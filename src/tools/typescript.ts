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
import * as ego_helpers from '../helpers';

/**
 * Options for 'toTypeScript()' function.
 */
export interface ToTypeScriptOptions {
}

/**
 * Converts a value to TypeScript code.
 *
 * @param {any} val The value to convert.
 * @param {ToTypeScriptOptions} [opts] Custom options.
 *
 * @return {string} The generated TypeScript code.
 */
export function toTypeScript(val: any, opts?: ToTypeScriptOptions): string {
    if (!opts) {
        opts = <any>{};
    }

    let interfaceName = 'IMyInterface';
    let typescript = '';

    if (_.isNull(val)) {
        typescript += `type ${ interfaceName } = null;`;
    } else if (_.isUndefined(val)) {
        typescript += `type ${ interfaceName } = undefined;`;
    } else if (_.isSymbol(val)) {
        typescript += `type ${ interfaceName } = ${ val };`;
    } else if (_.isObject(val)) {
        typescript += `type ${ interfaceName } = {\n`;
        typescript += toTypeScriptObjectSource(val, 1, 0);
        typescript += `};`;
    } else {
        typescript += `type ${ interfaceName } = ${ val };`;
    }

    return typescript;
}

function reflectFunction(func: Function) {
    // https://stackoverflow.com/questions/6921588/is-it-possible-to-reflect-the-arguments-of-a-javascript-function
    const ARGS = func.toString()
        .replace (/[\r\n\s]+/g, ' ')
        .match (/(?:function\s*\w*)?\s*(?:\((.*?)\)|([^\s]+))/)
        .slice (1, 3)
        .join('')
        .split (/\s*,\s*/);

    return {
        arguments: ARGS,
    };
}

function toTypeScriptObjectSource(val: any, spaceLevel: number, level: number): string {
    const SPACES = 4 * spaceLevel;
    let typescript = '';

    const PROPERTIES = ego_helpers.from(
        Object.keys(val)
    ).orderBy(p => ego_helpers.normalizeString(p));
    for (const PROP of PROPERTIES) {
        const PROPERTY_VALUE = val[PROP];

        let type = `any`;

        if (_.isNull(PROPERTY_VALUE)) {
            type = `null`;
        } else if (_.isUndefined(PROPERTY_VALUE)) {
            type = `undefined`;
        } else if (_.isSymbol(PROPERTY_VALUE)) {
            type = `symbol`;
        } else if (_.isFunction(PROPERTY_VALUE)) {
            const REFLECTION = reflectFunction(PROPERTY_VALUE);

            type = `(${
                REFLECTION.arguments
                    .map(a => a + ': any')
                    .join(', ')
            }) => any`;
        } else if (_.isObject(PROPERTY_VALUE)) {
            if (Array.isArray(PROPERTY_VALUE)) {
                type = `(${
                    PROPERTY_VALUE.length ?
                        PROPERTY_VALUE.map(av => {
                            return '{\n' + toTypeScriptObjectSource(av, spaceLevel + 1, level + 1) +
                                (' '.repeat(SPACES)) + '}';
                        }).join(') | (') : 'any'
                })[]`;
            } else if (_.isPlainObject(PROPERTY_VALUE)) {
                type = '{\n' + toTypeScriptObjectSource(PROPERTY_VALUE, spaceLevel + 1, level + 1) +
                       (' '.repeat(SPACES)) + '}';
            } else {
                if (PROPERTY_VALUE.constructor) {
                    type = PROPERTY_VALUE.constructor.name;
                }
            }
        } else {
            type = typeof PROPERTY_VALUE;
        }

        typescript += ' '.repeat(SPACES);
        typescript += `${ PROP }: ${ type };\n`;
    }

    return typescript;
}
