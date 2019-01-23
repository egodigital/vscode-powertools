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
import * as ego_helpers from '../helpers';
import * as ego_values from '../values';
import * as fsExtra from 'fs-extra';
import * as path from 'path';


let globalValues: ego_contracts.WithValues;


/**
 * Returns the list of global values.
 *
 * @return {ego_contracts.Value[]} The list of global values.
 */
export function getGlobalUserValues(): ego_contracts.Value[] {
    return ego_values.toValues(
        globalValues
    );
}

/**
 * Reloads global values.
 */
export function reloadGlobalUserValues() {
    const SETTINGS: ego_contracts.GlobalExtensionSettings = this;

    globalValues = SETTINGS;
}

/**
 * Handles a value as string and replaces placeholders.
 *
 * @param {any} val The input value.
 *
 * @return {string} The output value.
 */
export function replaceValues(val: any): string {
    val = ego_helpers.toStringSafe(val);

    val = ego_values.replaceValues(globalValues, val, {
        pathResolver: (p: string) => {
            return resolveValuePath(p);
        },
    });

    return val;
}

function resolveValuePath(p: string) {
    p = ego_helpers.toStringSafe(p);

    if (path.isAbsolute(p)) {
        p = path.resolve(p);

        if (fsExtra.existsSync(p)) {
            return p;
        }
    } else {
        const FULL_PATH = path.resolve(
            path.join(ego_helpers.getExtensionDirInHome(), p)
        );

        if (fsExtra.existsSync(FULL_PATH)) {
            return FULL_PATH;
        }
    }

    return false;
}
