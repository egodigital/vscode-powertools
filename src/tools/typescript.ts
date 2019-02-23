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


function getTypescriptType(val: any, level: number) {
    const START_SPACES = ' '.repeat((level + 1) * 4);
    const END_SPACES = ' '.repeat(level * 4);

    let type = '';

    if (_.isNull(val)) {
        type += `null`;
    } else if (_.isUndefined(val)) {
        type += `undefined`;
    } else if (_.isSymbol(val)) {
        type += `symbol`;
    } else if (_.isFunction(val)) {
        const REFLECTION = reflectFunction(val);

        type += `(${
            REFLECTION.arguments
                .map(arg => arg + ': any')
                .join(', ')
        }) => any`;
    } else if (Array.isArray(val)) {
        type += `[\n${ START_SPACES }`;
        type += val.map(av => {
            return getTypescriptType(av, level + 1);
        }).join(` |\n${ START_SPACES }`);
        type += `\n${ END_SPACES }]`;
    } else if (_.isObjectLike(val)) {
        if (_.isPlainObject(val)) {
            type += '{\n';

            const PROPERTY_LIST = ego_helpers.from(
                Object.keys(val)
            ).orderBy(p => ego_helpers.normalizeString(p))
             .toArray();

            for (const PROP of PROPERTY_LIST) {
                type += `${ START_SPACES }${ PROP }: ${ getTypescriptType(val[PROP], level + 1) };\n`;
            }

            type += `${ END_SPACES }}`;
        } else {
            if (val.constructor) {
                type = val.constructor.name;
            }
        }
    } else if (!_.isString(val) && ('function' === typeof val[Symbol.iterator])) {
        type += `Iterator<any>`;
    } else {
        type = typeof val;
    }

    if ('' === type) {
        type = 'any';
    }

    return type;
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

    let interfaceName = 'IMyType';
    let typescript = '';

    if (_.isPlainObject(val)) {
        typescript += `interface ${ interfaceName } ${ getTypescriptType(val, 0) }`;
    } else {
        typescript += `type ${ interfaceName } = ${ getTypescriptType(val, 0) };`;
    }

    return typescript;
}
