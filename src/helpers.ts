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
import * as path from 'path';
import * as os from 'os';


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
