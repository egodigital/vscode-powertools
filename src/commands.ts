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

import * as ego_helpers from './helpers';
import * as ego_settings_global from './settings/global';
import * as vscode from 'vscode';


/**
 * Registers all commands.
 *
 * @param {vscode.ExtensionContext} context The underlying extension context.
 */
export function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('ego.power-tools.openGlobalSettings', async () => {
            try {
                await ego_settings_global.openGlobalSettings(context);
            } catch (e) {
                ego_helpers.showErrorMessage(e);
            }
        }),
    );
}
