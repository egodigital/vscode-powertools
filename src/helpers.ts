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

import * as ego_code from './code';
import * as ego_contracts from './contracts';
import * as ego_log from './log';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import {
    asArray,
    toBooleanSafe,
    toStringSafe
} from 'vscode-helpers';

export * from 'vscode-helpers';


/**
 * Checks if a conditional obj does match items condition.
 *
 * @param {ego_contracts.Conditional} obj The object to check.
 *
 * @return {boolean} Matches condition or not.
 */
export function doesMatchFilterCondition(obj: ego_contracts.Conditional): boolean {
    return filterConditionals(
        obj
    ).length > 0;
}

/**
 * Filters "conditional" items.
 *
 * @param {TObj|TObj[]} objs The objects to check.
 *
 * @return {TObj[]} The filtered items.
 */
export function filterConditionals<TObj extends ego_contracts.Conditional = ego_contracts.Conditional>(
    objs: TObj | TObj[]
): TObj[] {
    return asArray(objs).filter(o => {
        try {
            const IF = toStringSafe(o.if);
            if ('' !== IF.trim()) {
                return toBooleanSafe(
                    ego_code.run({
                        code: IF,
                    }),
                    true
                );
            }

            return true;
        } catch (e) {
            ego_log.CONSOLE
                .trace(e, 'helpers.filterConditionals(1)');

            return false;
        }
    });
}

/**
 * Returns the (possible path) of the extension's sub folder inside the home directory.
 *
 * @return {string} The path of the extension's sub folder inside the home directory.
 */
export function getExtensionDirInHome() {
    return path.resolve(
        path.join(os.homedir(),
                  ego_contracts.HOMEDIR_SUBFOLDER)
    );
}

/**
 * Imports a module from the extension's context.
 *
 * @param {string} id The ID of the module.
 *
 * @return {TModule} The module.
 */
export function requireModule<TModule = any>(id: string): TModule {
    return require(
        toStringSafe(id)
    );
}

/**
 * Shows an error message.
 *
 * @param {any} err The message to show.
 *
 * @return {Promise<string>} The promise with the result.
 */
export async function showErrorMessage(err: any) {
    if (err) {
        return await vscode.window.showErrorMessage(
            toStringSafe(err).trim()
        );
    }
}
