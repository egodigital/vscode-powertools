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

import * as ego_contracts from '../contracts';
import * as ego_global_buttons from '../global/buttons';
import * as ego_global_values from '../global/values';
import * as ego_helpers from '../helpers';
import * as vscode from 'vscode';


let globalSettings: ego_contracts.GlobalExtensionSettings;
const QUEUE = ego_helpers.createQueue();


/**
 * Disposes all global settings.
 */
export async function disposeGlobalStuff() {
    await QUEUE.add(async () => {
        ego_global_buttons.disposeGlobalUserButtons();
    });
}

/**
 * Returns the current, global settings.
 *
 * @return {ego_contracts.GlobalExtensionSettings} The current global, settings.
 */
export function getGlobalSettings(): ego_contracts.GlobalExtensionSettings {
    return globalSettings;
}

/**
 * Reloads the global settings.
 */
export async function reloadGlobalSettings() {
    await QUEUE.add(async () => {
        const NEW_SETTINGS: ego_contracts.GlobalExtensionSettings =
            vscode.workspace.getConfiguration('ego.power-tools.user') || <any>{};

        await ego_global_values.reloadGlobalUserValues
            .apply(NEW_SETTINGS, []);
        await ego_global_buttons.reloadGlobalUserButtons
            .apply(NEW_SETTINGS, []);

        globalSettings = NEW_SETTINGS;
    });
}
