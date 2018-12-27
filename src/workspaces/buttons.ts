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
 * Name of the key for storing button instances.
 */
export const KEY_BUTTONS = 'buttons';
let nextButtonCommandId = Number.MIN_SAFE_INTEGER;


/**
 * Disposes all workspace buttons.
 */
export async function disposeButtons() {
    const WORKSPACE: ego_workspace.Workspace = this;

    const BUTTON_LIST: ego_contracts.WorkspaceButton[] = WORKSPACE.instanceState[
        KEY_BUTTONS
    ];
    while (BUTTON_LIST.length > 0) {
        const BTN = BUTTON_LIST.pop();

        ego_helpers.tryDispose(BTN);
    }
}

/**
 * Reloads all workspace buttons.
 */
export async function reloadButtons() {
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

    disposeButtons.apply(
        this
    );

    const BUTTONS = ego_helpers.asArray(SETTINGS.buttons);
    if (BUTTONS.length < 1) {
        return;
    }

    const BUTTON_LIST: ego_contracts.WorkspaceButton[] = WORKSPACE.instanceState[
        KEY_BUTTONS
    ];

    BUTTONS.forEach(b => {
        try {
            if (!ego_helpers.doesMatchPlatformCondition(b)) {
                return;
            }
            if (!ego_helpers.doesMatchFilterCondition(b)) {
                return;
            }

            let newButton: vscode.StatusBarItem;
            let newCommand: vscode.Disposable;
            const DISPOSE_BTN = () => {
                ego_helpers.tryDispose(newButton);
                ego_helpers.tryDispose(newCommand);
            };

            try {
                let commandAction: Function;

                let btnAction: ego_contracts.ButtonAction;
                if (_.isObjectLike(b.action)) {
                    btnAction = <ego_contracts.ButtonAction>b.action;
                } else {
                    btnAction = <ego_contracts.ShellCommandButtonAction>{
                        command: ego_helpers.toStringSafe(btnAction),
                    };
                }

                switch (ego_helpers.normalizeString(btnAction.type)) {
                    case '':
                    case 'shell':
                        {
                            const SHELL_ACTION = <ego_contracts.ShellCommandButtonAction>btnAction;

                            commandAction = async () => {
                                const COMMAND_TO_EXECUTE = WORKSPACE.replaceValues(
                                    SHELL_ACTION.command
                                );

                                let cwd = WORKSPACE.replaceValues(
                                    SHELL_ACTION.cwd
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

                                // run command
                                await (() => {
                                    return new Promise<void>((resolve, reject) => {
                                        try {
                                            childProcess.exec(COMMAND_TO_EXECUTE, {
                                                cwd: cwd,
                                            }, (err) => {
                                                if (err) {
                                                    reject(err);
                                                } else {
                                                    resolve();
                                                }
                                            });
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                })();
                            };
                        }
                        break;

                    case 'script':
                        {
                            const SCRIPT_ACTION = <ego_contracts.ScriptButtonAction>btnAction;

                            commandAction = async () => {
                                const SCRIPT_PATH = WORKSPACE.replaceValues(
                                    SCRIPT_ACTION.script
                                );

                                const FULL_SCRIPT_PATH = WORKSPACE.getExistingFullPath(
                                    SCRIPT_PATH
                                );

                                if (false === FULL_SCRIPT_PATH) {
                                    throw new Error(`Script '${ SCRIPT_PATH }' not found!`);
                                }

                                const SCRIPT_MODULE = ego_helpers.loadModule<ego_contracts.ButtonActionScriptModule>(
                                    FULL_SCRIPT_PATH
                                );
                                if (SCRIPT_MODULE) {
                                    if (SCRIPT_MODULE.execute) {
                                        const ARGS: ego_contracts.ButtonActionScriptArguments = {
                                            button: undefined,
                                            logger: WORKSPACE.logger,
                                            options: ego_helpers.cloneObject(SCRIPT_ACTION.options),
                                            output: WORKSPACE.output,
                                            replaceValues: (val) => {
                                                return WORKSPACE.replaceValues(val);
                                            },
                                            require: (id) => {
                                                return ego_helpers.requireModule(id);
                                            },
                                        };

                                        // ARGS.button
                                        Object.defineProperty(ARGS, 'button', {
                                            get: () => {
                                                return newButton;
                                            }
                                        });

                                        await Promise.resolve(
                                            SCRIPT_MODULE.execute(ARGS)
                                        );
                                    }
                                }
                            };
                        }
                        break;
                }

                if (commandAction) {
                    const ID = nextButtonCommandId++;
                    const CMD_ID = `ego.power-tools.buttons.btn${ ID }`;

                    newCommand = vscode.commands.registerCommand(CMD_ID, async () => {
                        try {
                            newButton.command = undefined;

                            return await Promise.resolve(
                                commandAction()
                            );
                        } catch (e) {
                            WORKSPACE.logger
                                     .trace(e, 'buttons.reloadButtons(2)');

                            ego_helpers.showErrorMessage(
                                `Could not execute button: ${ ego_helpers.errorToString(e) }`
                            );
                        } finally {
                            newButton.command = CMD_ID;
                        }
                    });

                    newButton = ego_helpers.buildButtonSync(b, (newBtn) => {
                        if (_.isNil(newBtn.text)) {
                            newBtn.text = WORKSPACE.folder.name;
                        }

                        newBtn.text = WORKSPACE.replaceValues(newBtn.text);
                        newBtn.tooltip = WORKSPACE.replaceValues(newBtn.tooltip);
                        newBtn.color = WORKSPACE.replaceValues(newBtn.color);
                        newBtn.command = CMD_ID;
                    });

                    BUTTON_LIST.push({
                        dispose: () => {
                            DISPOSE_BTN();
                        }
                    });

                    newButton.show();
                }
            } catch (e) {
                DISPOSE_BTN();

                throw e;
            }
        } catch (e) {
            WORKSPACE.logger
                     .trace(e, 'buttons.reloadButtons(1)');
        }
    });
}
