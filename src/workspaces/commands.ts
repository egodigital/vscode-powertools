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
 * Inits events for workspace commands.
 *
 * @param {vscode.ExtensionContext} extension The extension context.
 */
export function initCommandEvents(extension: vscode.ExtensionContext) {
    extension.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            try {
                ego_workspace.getAllWorkspaces().forEach(ws => {
                    try {
                        const LIST_OF_COMMANDS = (<ego_contracts.WorkspaceCommand[]>ws.instanceState[KEY_COMMANDS]).map(cmd => {
                            const ITEM: ego_contracts.CommandItem = cmd['__item'];

                            return {
                                command: cmd,
                                item: ITEM,
                            };
                        });

                        // update button visibility
                        LIST_OF_COMMANDS.forEach(x => {
                            try {
                                if (x.command.button) {
                                    let isVisible = true;

                                    if (x.item.button) {
                                        isVisible = ego_helpers.isVisibleForActiveEditor(x.item.button);
                                    }

                                    if (isVisible) {
                                        x.command.button.show();
                                    } else {
                                        x.command.button.hide();
                                    }
                                }
                            } catch (e) {
                                ego_log.CONSOLE
                                    .trace(e, 'workspaces.commands.initCommandEvents.onDidChangeActiveTextEditor(3)');
                            }
                        });

                        // onEditorChanged events
                        ws.executeOnEditorChangedEvents(
                            LIST_OF_COMMANDS.filter(x => {
                                return !!x.item.button &&
                                    !!x.command.button;
                            }).map(x => {
                                const CMD_ID: string = x.command['__id'];

                                return {
                                    button: x.command.button,
                                    command: CMD_ID,
                                    item: x.item,
                                    onEditorChanged: x.item.button.onEditorChanged,
                                };
                            }),
                            (code: string, x) => {
                                return ws.executeCode(code, [{
                                    name: 'button',
                                    value: ego_helpers.toCodeButton(
                                        <any>{
                                            '__command': x.command,
                                            '__item': x.item.button,
                                            '__status_item': x.button,
                                        },
                                        (v) => {
                                            return ws.replaceValues(v);
                                        },
                                    ),
                                }]);
                            }
                        );
                    } catch (e) {
                        ego_log.CONSOLE
                            .trace(e, 'workspaces.commands.initCommandEvents.onDidChangeActiveTextEditor(2)');
                    }
                });
            } catch (e) {
                ego_log.CONSOLE
                    .trace(e, 'workspaces.commands.initCommandEvents.onDidChangeActiveTextEditor(1)');
            }
        }),
    );
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
            let item: ego_contracts.CommandItem = WORKSPACE.importValues(
                entry
            );
            const ID = ego_helpers.toStringSafe(key)
                .trim();

            if (!item) {
                return;
            }

            if (!WORKSPACE.doesMatchPlatformCondition(item)) {
                return;
            }
            if (!WORKSPACE.doesMatchFilterCondition(item)) {
                return;
            }

            let name = ego_helpers.toStringSafe(
                item.name
            ).trim();
            if ('' === name) {
                name = key;
            }

            let description = ego_helpers.toStringSafe(
                item.description
            ).trim();
            if ('' === description) {
                description = undefined;
            }

            let newButton: vscode.StatusBarItem;
            let newCommand: vscode.Disposable;
            try {
                newCommand = vscode.commands.registerCommand(ID, function(context: ego_contracts.CommandExecutionContext) {
                    const ARGS = ego_helpers.from(
                        ego_helpers.toArray(arguments)
                    ).skip(1)
                     .toArray();

                    return WORKSPACE.executeScript<ego_contracts.WorkspaceCommandScriptArguments>(
                        item,
                        (args) => {
                            // args.arguments
                            Object.defineProperty(args, 'arguments', {
                                enumerable: true,
                                get: () => {
                                    return ARGS;
                                },
                            });

                            // args.command
                            Object.defineProperty(args, 'command', {
                                enumerable: true,
                                get: () => {
                                    return key;
                                },
                            });

                            ego_helpers.updateCommandScriptArgumentsByExecutionContext(
                                args, context,
                            );

                            return args;
                        }
                    );
                });

                const NEW_WORKSPACE_CMD: ego_contracts.WorkspaceCommand = <any>{
                    '__id': ID,
                    '__item': item,
                    button: undefined,
                    command: newCommand,
                    description: undefined,
                    dispose: function() {
                        ego_helpers.tryDispose(this.button);
                        ego_helpers.tryDispose(this.command);

                        if (!_.isNil(item.onDestroyed)) {
                            WORKSPACE.executeCode(
                                item.onDestroyed
                            );
                        }
                    },
                    execute: function () {
                        return vscode.commands.executeCommand
                            .apply(null, [ ID ].concat( ego_helpers.toArray(arguments) ));
                    },
                    id: ID,
                    item: item,
                    name: undefined,
                };

                // NEW_WORKSPACE_CMD.button
                Object.defineProperty(NEW_WORKSPACE_CMD, 'button', {
                    enumerable: true,
                    get: () => {
                        return newButton;
                    }
                });

                // NEW_WORKSPACE_CMD.description
                Object.defineProperty(NEW_WORKSPACE_CMD, 'description', {
                    enumerable: true,
                    get: () => {
                        const DESCRIPTION = WORKSPACE.replaceValues(
                            description
                        ).trim();

                        return '' !== DESCRIPTION ? DESCRIPTION
                                                  : undefined;
                    }
                });

                // NEW_WORKSPACE_CMD.name
                Object.defineProperty(NEW_WORKSPACE_CMD, 'name', {
                    enumerable: true,
                    get: () => {
                        const NAME = WORKSPACE.replaceValues(
                            name
                        ).trim();

                        return '' !== NAME ? NAME
                                           : undefined;
                    }
                });

                if (item.button) {
                    newButton = ego_helpers.buildButtonSync(
                        item.button,
                        (newBtn) => {
                            if (_.isNil(newBtn.text)) {
                                newBtn.text = name;
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

                if (!_.isNil(item.onCreated)) {
                    WORKSPACE.executeCode(
                        item.onCreated
                    );
                }

                if (newButton) {
                    if (ego_helpers.isVisibleForActiveEditor(item.button)) {
                        newButton.show();
                    } else {
                        newButton.hide();
                    }
                }
            } catch (e) {
                ego_helpers.tryDispose(newButton);
                ego_helpers.tryDispose(newCommand);

                WORKSPACE.logger
                         .trace(e, `commands.reloadCommands(${ key })`);
            }
        });
    }
}
