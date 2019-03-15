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
 * Inits events for workspace buttons.
 *
 * @param {vscode.ExtensionContext} extension The extension context.
 */
export function initButtonEvents(extension: vscode.ExtensionContext) {
    extension.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            try {
                ego_workspace.getAllWorkspaces().forEach(ws => {
                    try {
                        const LIST_OF_BUTTONS = (<ego_contracts.WorkspaceButton[]>ws.instanceState[KEY_BUTTONS]).map(wsb => {
                            const ITEM: ego_contracts.ButtonItem = wsb['__item'];
                            const STATUS_BAR_ITEM: vscode.StatusBarItem = wsb['__status_item'];

                            return {
                                button: wsb,
                                item: ITEM,
                                onEditorChanged: ITEM.onEditorChanged,
                                statusBarItem: STATUS_BAR_ITEM,
                            };
                        });

                        // change visibility
                        LIST_OF_BUTTONS.forEach(x => {
                            if (ego_helpers.isVisibleForActiveEditor(x.item)) {
                                x.statusBarItem.show();
                            } else {
                                x.statusBarItem.hide();
                            }
                        });

                        ws.executeOnEditorChangedEvents(
                            LIST_OF_BUTTONS,
                            (code: string, b) => {
                                return ws.executeCode(code, [{
                                    name: 'button',
                                    value: ego_helpers.toCodeButton(
                                        b.button,
                                        (v) => {
                                            return ws.replaceValues(v);
                                        },
                                    ),
                                }]);
                            }
                        );
                    } catch (e) {
                        ws.logger
                          .trace(e, 'workspaces.buttons.initButtonEvents.onDidChangeActiveTextEditor(2)');
                    }
                });
            } catch (e) {
                ego_log.CONSOLE
                    .trace(e, 'workspaces.buttons.initButtonEvents.onDidChangeActiveTextEditor(1)');
            }
        })
    );
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

    const BUTTONS = ego_helpers.asArray(SETTINGS.buttons).map(b => {
        return WORKSPACE.importValues(b);
    });
    if (BUTTONS.length < 1) {
        return;
    }

    const BUTTON_LIST: ego_contracts.WorkspaceButton[] = WORKSPACE.instanceState[
        KEY_BUTTONS
    ];

    BUTTONS.forEach(b => {
        try {
            if (!WORKSPACE.doesMatchPlatformCondition(b)) {
                return;
            }
            if (!WORKSPACE.doesMatchFilterCondition(b)) {
                return;
            }

            let newButton: vscode.StatusBarItem;
            let newCommand: vscode.Disposable;
            let hasBeenDisposed = false;
            const DISPOSE_BTN = () => {
                if (hasBeenDisposed) {
                    return;
                }
                hasBeenDisposed = true;

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
                            commandAction = async () => {
                                await WORKSPACE.runShellCommand(
                                    <ego_contracts.ShellCommandButtonAction>btnAction
                                );
                            };
                        }
                        break;

                    case 'command':
                        {
                            commandAction = async () => {
                                const CMD_ACTION = <ego_contracts.CommandButtonAction>btnAction;

                                const CMD_ID = ego_helpers.toStringSafe(CMD_ACTION.command);
                                const CMD_ARGS: any[] =
                                    _.isNil(CMD_ACTION.arguments) ? []
                                                                  : ego_helpers.asArray(CMD_ACTION, false);

                                await Promise.resolve(
                                    vscode.commands.executeCommand
                                        .apply(null, [ <any>CMD_ID ].concat(CMD_ARGS) )
                                );
                            };
                        }
                        break;

                    case 'script':
                        {
                            commandAction = async () => {
                                await WORKSPACE.executeScript<ego_contracts.ButtonActionScriptArguments>(
                                    <ego_contracts.ScriptButtonAction>btnAction,
                                    (args) => {
                                        // ARGS.button
                                        Object.defineProperty(args, 'button', {
                                            enumerable: true,
                                            get: () => {
                                                return newButton;
                                            }
                                        });

                                        return args;
                                    },
                                );
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

                    BUTTON_LIST.push(<any>{
                        '__command': CMD_ID,
                        '__item': b,
                        '__status_item': newButton,
                        dispose: () => {
                            DISPOSE_BTN();

                            if (!_.isNil(b.onDestroyed)) {
                                WORKSPACE.executeCode(
                                    b.onDestroyed
                                );
                            }
                        }
                    });

                    if (!_.isNil(b.onCreated)) {
                        WORKSPACE.executeCode(
                            b.onCreated
                        );
                    }

                    if (ego_helpers.isVisibleForActiveEditor(b)) {
                        newButton.show();
                    } else {
                        newButton.hide();
                    }
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
