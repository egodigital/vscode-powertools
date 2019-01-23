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

const fs = require('fs');
const path = require('path');


function closeObject(obj) {
    if (obj) {
        obj = JSON.parse(
            JSON.stringify(obj)
        );
    }

    return obj;
}


const PACKAGE_JSON_FILE = path.resolve(
    path.join(__dirname, 'package.json')
);

const PACKAGE_JSON = JSON.parse(
    fs.readFileSync(
        PACKAGE_JSON_FILE, 'utf8'
    )
);

const ORG = PACKAGE_JSON['contributes']['configuration']['properties']['ego.power-tools'];
const CLONE = PACKAGE_JSON['contributes']['configuration']['properties']['ego.power-tools.user'];
const APPLY = (prop) => {
    CLONE["properties"][prop] = closeObject(
        ORG["properties"][prop]
    );
};

APPLY('buttons');
APPLY('commands');
APPLY('values');

fs.writeFileSync(
    PACKAGE_JSON_FILE,
    JSON.stringify(
        PACKAGE_JSON, null, 4
    ),
    'utf8'
);
