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
import * as ego_contracts from '../contracts';
import * as ego_helpers from '../helpers';
import * as ego_log from '../log';
import * as ego_workspace from '../workspace';
import * as vscode from 'vscode';


/**
 * Name of the key for storing command instances.
 */
export const KEY_COMMANDS = 'commands';


/**
 * Disposes all workspace commands.
 */
export function disposeCommands() {
    const WORKSPACE: ego_workspace.Workspace = this;

    const COMMAND_LIST: ego_contracts.WorkspaceCommand[] = WORKSPACE.instanceState[
        KEY_COMMANDS
    ];
    while (COMMAND_LIST.length > 0) {
        const CMD = COMMAND_LIST.pop();

        ego_helpers.tryDispose(CMD);
    }
}

/**
 * Reloads all workspace commands.
 */
export async function reloadCommands() {
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

    disposeCommands.apply(
        this
    );

    const COMMAND_LIST: ego_contracts.WorkspaceCommand[] = WORKSPACE.instanceState[
        KEY_COMMANDS
    ];

    if (SETTINGS.commands) {
        _.forIn(SETTINGS.commands, (entry, key) => {
            let item: ego_contracts.CommandItem = entry;
            const ID = ego_helpers.toStringSafe(key)
                .trim();

            if (!item) {
                return;
            }

            if (!ego_helpers.doesMatchFilterCondition(item)) {
                return;
            }

            let title = ego_helpers.toStringSafe(
                item.title
            ).trim();
            if ('' === title) {
                title = key;
            }

            let newButton: vscode.StatusBarItem;
            let newCommand: vscode.Disposable;
            try {
                const SCRIPT_PATH = ego_helpers.toStringSafe(
                    item.script
                );

                newCommand = vscode.commands.registerCommand(ID, async function() {
                    try {
                        const FULL_SCRIPT_PATH = WORKSPACE.getExistingFullPath(
                            SCRIPT_PATH
                        );

                        if (false === FULL_SCRIPT_PATH) {
                            throw new Error(`Script '${ SCRIPT_PATH }' not found!`);
                        }

                        const SCRIPT_MODULE = ego_helpers.loadModule<ego_contracts.WorkspaceCommandScriptModule>(
                            FULL_SCRIPT_PATH
                        );
                        if (SCRIPT_MODULE) {
                            if (SCRIPT_MODULE.execute) {
                                const ARGS: ego_contracts.WorkspaceCommandScriptArguments = {
                                    command: key,
                                    replaceValues: (val) => {
                                        return WORKSPACE.replaceValues(val);
                                    },
                                    require: (id) => {
                                        return ego_helpers.requireModule(id);
                                    }
                                };

                                return await Promise.resolve(
                                    SCRIPT_MODULE.execute
                                        .apply(WORKSPACE, [ ARGS ])
                                );
                            }
                        }
                    } catch (e) {
                        ego_log.CONSOLE.trace(
                            e, `workspaces.reloadCommands.execute(${ key })`
                        );

                        ego_helpers.showErrorMessage(
                            e
                        );
                    }
                });

                const NEW_WORKSPACE_CMD: ego_contracts.WorkspaceCommand = {
                    button: undefined,
                    command: newCommand,
                    dispose: function() {
                        ego_helpers.tryDispose(this.button);
                        ego_helpers.tryDispose(this.command);
                    },
                    execute: function () {
                        return vscode.commands.executeCommand
                            .apply(null, [ ID ].concat( ego_helpers.toArray(arguments) ));
                    },
                    id: ID,
                    item: item,
                    title: title,
                };

                // NEW_WORKSPACE_CMD.button
                Object.defineProperty(NEW_WORKSPACE_CMD, 'button', {
                    enumerable: true,
                    get: () => {
                        return newButton;
                    }
                });

                if (item.button) {
                    newButton = ego_helpers.buildButtonSync(
                        item.button,
                        (newBtn) => {
                            if (_.isNil(newBtn.text)) {
                                newBtn.text = title;
                            }

                            if (_.isNil(newBtn.tooltip)) {
                                newBtn.tooltip = key;
                            }

                            newBtn.text = WORKSPACE.replaceValues(newBtn.text);
                            newBtn.tooltip = WORKSPACE.replaceValues(newBtn.tooltip);
                            newBtn.color = WORKSPACE.replaceValues(newBtn.color);
                            newBtn.command = ID;
                        }
                    );
                }

                COMMAND_LIST.push(
                    NEW_WORKSPACE_CMD
                );

                if (newButton) {
                    newButton.show();
                }
            } catch (e) {
                ego_helpers.tryDispose(newButton);
                ego_helpers.tryDispose(newCommand);

                ego_log.CONSOLE
                       .trace(e, `commands.reloadCommands(${ key })`);
            }
        });
    }
}
