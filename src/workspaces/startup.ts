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

                    const CMD = WORKSPACE.replaceValues(SHELL_ITEM.command);
                    if ('' === CMD.trim()) {
                        continue;
                    }

                    let currentWorkDirectory = WORKSPACE.replaceValues(SHELL_ITEM.cwd);
                    if ('' === currentWorkDirectory.trim()) {
                        currentWorkDirectory = WORKSPACE.rootPath;
                    }
                    if (!path.isAbsolute(currentWorkDirectory)) {
                        currentWorkDirectory = path.join(
                            WORKSPACE.rootPath, currentWorkDirectory
                        );
                    }

                    const SILENT = ego_helpers.toBooleanSafe(SHELL_ITEM.silent, true);

                    try {
                        WORKSPACE.logger
                                 .info(`Executing '${ CMD }' in shell ...`);

                        const RESULT = childProcess.execSync(CMD, {
                            cwd: path.resolve(
                                currentWorkDirectory
                            ),
                        });

                        if (!SILENT) {
                            WORKSPACE.output
                                     .appendLine(RESULT.toString('utf8'));
                        }
                    } catch (e) {
                        WORKSPACE.logger
                                 .err(e, 'workspaces.onStartup(1)');
                    }
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
                                    SCRIPT_MODULE.execute
                                        .apply(WORKSPACE, [ ARGS ])
                                );
                            }
                        }
                    } catch (e) {
                        WORKSPACE.logger
                                 .err(e, 'workspaces.onStartup(2)');
                    }
                }
                break;
        }
    }

    WORKSPACE.logger
             .info(`Executed all startups.`);
}
