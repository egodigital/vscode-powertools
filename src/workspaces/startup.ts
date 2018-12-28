/**
 * This file is part of the vscode-powertools distribution.
 * Copyright (c) e.GO Digital GmbH, Aachen, Germany (https://www.e-go-digital.com/)
 *
 * vscode-powertools is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * vscode-powertools is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as _ from 'lodash';
import * as childProcess from 'child_process';
import * as ego_contracts from '../contracts';
import * as ego_helpers from '../helpers';
import * as ego_workspace from '../workspace';
import * as path from 'path';
import * as vscode from 'vscode';


/**
 * Runs things on startup.
 */
export async function onStartup() {
    const WORKSPACE: ego_workspace.Workspace = this;
    if (WORKSPACE.isInFinalizeState) {
        return;
    }
    if (!WORKSPACE.isInitialized) {
        return;
    }

    const SETTINGS = WORKSPACE.settings;
    if (!SETTINGS) {
        return;
    }

    const STARTUPS = ego_helpers.asArray(
        SETTINGS.startup
    );

    if (STARTUPS.length < 1) {
        return;
    }

    for (const S of STARTUPS) {
        try {
            let entry: ego_contracts.StartupItem;
            if (_.isObjectLike(S)) {
                entry = <ego_contracts.StartupItem>S;
            } else {
                entry = <ego_contracts.ShellCommandStartupItem>{
                    command: ego_helpers.toStringSafe(S),
                };
            }

            if (!ego_helpers.doesMatchPlatformCondition(entry)) {
                continue;
            }
            if (!ego_helpers.doesMatchFilterCondition(entry)) {
                continue;
            }

            switch (ego_helpers.normalizeString(entry.type)) {
                case '':
                case 'shell':
                    {
                        const SHELL_ITEM = <ego_contracts.ShellCommandStartupItem>entry;

                        const COMMAND_TO_EXECUTE = WORKSPACE.replaceValues(
                            SHELL_ITEM.command
                        );

                        let cwd = WORKSPACE.replaceValues(
                            SHELL_ITEM.cwd
                        );
                        if (ego_helpers.isEmptyString(cwd)) {
                            cwd = WORKSPACE.rootPath;
                        }
                        if (!path.isAbsolute(cwd)) {
                            cwd = path.join(
                                WORKSPACE.rootPath, cwd
                            );
                        }
                        cwd = path.resolve(cwd);

                        const SILENT = ego_helpers.toBooleanSafe(SHELL_ITEM.silent, true);

                        // run command
                        await vscode.window.withProgress({
                            cancellable: false,
                            location: vscode.ProgressLocation.Notification,
                            title: 'Shell Command',
                        }, (progress) => {
                            return new Promise<void>((resolve, reject) => {
                                const COMPLETED = (err: any, result?: string) => {
                                    const WRITE_RESULT = () => {
                                        if (!SILENT) {
                                            if (!ego_helpers.isEmptyString(result)) {
                                                WORKSPACE.output
                                                    .appendLine(ego_helpers.toStringSafe(result));
                                                WORKSPACE.output
                                                    .appendLine('');
                                            }
                                        }
                                    };

                                    if (err) {
                                        WORKSPACE.output
                                            .appendLine(`[FAILED: '${ ego_helpers.errorToString(err) }']`);

                                        WRITE_RESULT();

                                        reject(err);
                                    } else {
                                        WORKSPACE.output
                                            .appendLine('[OK]');

                                        WRITE_RESULT();

                                        resolve();
                                    }
                                };

                                try {
                                    WORKSPACE.output
                                        .append(`Running shell command '${ COMMAND_TO_EXECUTE }' ... `);

                                    progress.report({
                                        message: `Running '${ COMMAND_TO_EXECUTE }' ...`,
                                    });

                                    childProcess.exec(COMMAND_TO_EXECUTE, {
                                        cwd: cwd,
                                    }, (err, result) => {
                                        COMPLETED(err, result);
                                    });
                                } catch (e) {
                                    COMPLETED(e);
                                }
                            });
                        });
                    }
                    break;

                case 'script':
                    {
                        const SCRIPT_ITEM = <ego_contracts.ScriptCommandStartupItem>entry;

                        try {
                            const SCRIPT_PATH = WORKSPACE.replaceValues(
                                SCRIPT_ITEM.script
                            );

                            const FULL_SCRIPT_PATH = WORKSPACE.getExistingFullPath(
                                SCRIPT_PATH
                            );

                            if (false === FULL_SCRIPT_PATH) {
                                throw new Error(`Script '${ SCRIPT_PATH }' not found!`);
                            }

                            const SCRIPT_MODULE = ego_helpers.loadModule<ego_contracts.ScriptCommandStartupModule>(
                                FULL_SCRIPT_PATH
                            );
                            if (SCRIPT_MODULE) {
                                if (SCRIPT_MODULE.execute) {
                                    const ARGS: ego_contracts.ScriptCommandStartupArguments = {
                                        logger: WORKSPACE.logger,
                                        options: ego_helpers.cloneObject(SCRIPT_ITEM.options),
                                        output: WORKSPACE.output,
                                        replaceValues: (val) => {
                                            return WORKSPACE.replaceValues(val);
                                        },
                                        require: (id) => {
                                            return ego_helpers.requireModule(id);
                                        }
                                    };

                                    await Promise.resolve(
                                        SCRIPT_MODULE.execute(ARGS)
                                    );
                                }
                            }
                        } catch (e) {
                            WORKSPACE.logger
                                    .err(e, 'startups.onStartup(3)');
                        }
                    }
                    break;
            }
        } catch (e) {
            WORKSPACE.logger
                     .trace(e, 'startups.onStartup(1)');
        }
    }

    WORKSPACE.logger
             .info(`Executed all startups.`);
}
