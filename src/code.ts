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


/**
 * Options for 'run' function.
 */
export interface RunOptions {
    /**
     * The code to execute.
     */
    code: string;
    /**
     * (Optional) Values.
     */
    values?: { [name: string]: any };
}


/**
 * Runs (JavaScript) code.
 *
 * @param {RunOptions} _749b18b8162b474388f9d39d173483fa_tmmk The options.
 *
 * @return {TResult} The result of the execution.
 */
export function run<TResult = any>(_749b18b8162b474388f9d39d173483fa_tmmk: RunOptions): TResult {
    // @ts-ignore
    const _ = require('lodash');
    // @ts-ignore
    const $fs = require('fs-extra');
    // @ts-ignore
    const $h = require('./helpers');
    // @ts-ignore
    const $m = require('moment');
    require('moment-timezone');
    // @ts-ignore
    const $p = require('path');
    // @ts-ignore
    const $vs = require('vscode');

    // @ts-ignore
    const $r = (id: string) => {
        return $h.requireModule(id);
    };

    const $v: any = {};
    if (_749b18b8162b474388f9d39d173483fa_tmmk.values) {
        _.forIn(_749b18b8162b474388f9d39d173483fa_tmmk.values, (value: any, key: string) => {
            Object.defineProperty($v, key, {
                enumerable: true,
                get: () => {
                    return value;
                },
            });
        });
    }

    return eval(
        $h.toStringSafe(
            _749b18b8162b474388f9d39d173483fa_tmmk.code
        )
    );
}
