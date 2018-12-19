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

import * as ego_contracts from './contracts';
import * as ego_helpers from './helpers';
import * as ego_settings_global from './settings/global';
import * as ego_workspace from './workspace';
import * as vscode from 'vscode';


/**
 * Registers all commands.
 *
 * @param {vscode.ExtensionContext} context The underlying extension context.
 */
export function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        // apps
        vscode.commands.registerCommand('ego.power-tools.apps', async () => {
            try {
                const ALL_WORKSPACES = ego_workspace.getAllWorkspaces();

                const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = ego_helpers.from(
                    ALL_WORKSPACES
                ).selectMany(ws => {
                    return ws.getApps();
                }).select(app => {
                    return {
                        action: () => {
                            return app.open();
                        },
                        description: app.description,
                        detail: app.detail,
                        label: app.name,
                    };
                }).orderBy(qp => {
                    return ego_helpers.normalizeString(qp.label);
                }).toArray();

                const SELECT_ITEM = await vscode.window.showQuickPick(
                    QUICK_PICKS,
                    {
                        placeHolder: 'Select the app, you would like to open ...',
                    }
                );

                if (SELECT_ITEM) {
                    await Promise.resolve(
                        SELECT_ITEM.action()
                    );
                }
            } catch (e) {
                ego_helpers.showErrorMessage(e);
            }
        }),

        // commands
        vscode.commands.registerCommand('ego.power-tools.commands', async () => {
            try {
                const ALL_WORKSPACES = ego_workspace.getAllWorkspaces();

                const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = ego_helpers.from(
                    ALL_WORKSPACES
                ).selectMany(ws => {
                    return ws.getCommands();
                }).select(cmd => {
                    return {
                        action: () => {
                            return cmd.execute();
                        },
                        description: cmd.description,
                        detail: cmd.detail,
                        label: cmd.title,
                    };
                }).orderBy(qp => {
                    return ego_helpers.normalizeString(qp.label);
                }).toArray();

                const SELECT_ITEM = await vscode.window.showQuickPick(
                    QUICK_PICKS,
                    {
                        placeHolder: 'Select the command, you would like to execute ...',
                    }
                );

                if (SELECT_ITEM) {
                    await Promise.resolve(
                        SELECT_ITEM.action()
                    );
                }
            } catch (e) {
                ego_helpers.showErrorMessage(e);
            }
        }),

        // openGlobalSettings
        vscode.commands.registerCommand('ego.power-tools.openGlobalSettings', async () => {
            try {
                await ego_settings_global.openGlobalSettings(context);
            } catch (e) {
                ego_helpers.showErrorMessage(e);
            }
        }),
    );
}
