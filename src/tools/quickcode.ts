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

import * as uuid from 'uuid';


type AsyncFunc<TResult = any> = (...args: any[]) => Promise<TResult>;

/**
 * Options for 'exec()' function.
 */
export interface ExecOptions {
    /**
     * The code to execute.
     */
    code: string;
}


/**
 * Executes code.
 *
 * @param {ExecOptions} _opts_f4eba53df3b74b7aa4e3a3228b528d78 options.
 */
export async function _exec_fcac50a111604220b8173024b6925905(
    _opts_f4eba53df3b74b7aa4e3a3228b528d78: ExecOptions
): Promise<any> {
    // @ts-ignore
    const _ = require('lodash');
    // @ts-ignore
    const $fs = require('fs-extra');
    // @ts-ignore
    const $h = require('../helpers');

    const $unwrap = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (val?: any, level?: number, maxLevel?: number) => {
            level = parseInt(
                $h.toStringSafe(level).trim()
            );
            if (isNaN(level)) {
                level = 0;
            }

            maxLevel = parseInt(
                $h.toStringSafe(maxLevel).trim()
            );
            if (isNaN(maxLevel)) {
                maxLevel = 64;
            }

            if (level < maxLevel) {
                if (_.isFunction(val)) {
                    return await Promise.resolve(
                        val()
                    );
                }
            }

            return val;
        }
    );

    // @ts-ignore
    const $guid = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (version?: string) => {
            version = $h.normalizeString( version );

            switch (version) {
                case '':
                case '4':
                case 'v4':
                    return uuid.v4();

                case '1':
                case 'v1':
                    return uuid.v1();

                default:
                    throw new Error(`'${ version }' is not supported!`);
            }
        }
    );
    // @ts-ignore
    const $uuid = $guid;

    // @ts-ignore
    const $cmd = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        function() {
            return require('vscode').commands
                .executeCommand
                .apply(null, arguments);
        }
    );

    // @ts-ignore
    const $help = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        () => {
            return showHelp_579c52a1992b472183db2fff8c764504();
        }
    );

    // @ts-ignore
    const $r = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (id: string) => {
            return $h.requireModule(id);
        }
    );

    // code to execute
    let _code_g93c97d35bd94b22b3041037bdc64780: string = $h.toStringSafe(_opts_f4eba53df3b74b7aa4e3a3228b528d78.code);
    if (!_code_g93c97d35bd94b22b3041037bdc64780.trim().startsWith('return ')) {
        _code_g93c97d35bd94b22b3041037bdc64780 = 'return ' + _code_g93c97d35bd94b22b3041037bdc64780;
    }
    if (!_code_g93c97d35bd94b22b3041037bdc64780.trim().endsWith(';')) {
        _code_g93c97d35bd94b22b3041037bdc64780 += ' ;';
    }

    return await $unwrap(eval(`(async () => {

${ _code_g93c97d35bd94b22b3041037bdc64780 }

})()`));
}


function asAsync_628dffd9c1e74e5cb82620a2c575e5dd<TResult = any>(
    func: (...args: any[]) => TResult | PromiseLike<TResult>
): AsyncFunc<TResult> {
    return async (...args: any[]) => {
        if (args) {
            for (let i = 0; i < args.length; i++) {
                args[i] = await Promise.resolve(args[i]);
            }
        }

        return await Promise.resolve(
            func.apply(null, args)
        );
    };
}

async function showHelp_579c52a1992b472183db2fff8c764504() {
    let md = '# Code Execution Help\n\n';

    // functions
    {
        md += '## Functions\n';
        md += 'Name | Description | Example\n';
        md += '---- | ----------- | -------\n';
        md += '`$cmd(id, ...args)` | Executes a [Visual Studio Code command](https://code.visualstudio.com/api/references/commands). | `$cmd("vscode.openFolder")`\n';
        md += '`$guid(version?)` | Generates a GUID. | `$guid("4")`\n';
        md += '`$r(id)` | Extended [require() function](https://nodejs.org/api/modules.html#modules_require), which also allows to access the [modules of that extension](https://github.com/egodigital/vscode-powertools/blob/master/package.json). | `$r("moment").utc()`\n';
        md += '`$unwrap(val)` | Unwraps a value from being a function. | `$unwrap(() => 5979)` \n';
        md += '`$uuid(version?)` | Alias for `guid`. | `$uuid("4")`\n';
        md += '\n';
    }

    // modules
    {
        md += '## Modules\n';
        md += 'Name | Description | Example\n';
        md += '---- | ----------- | -------\n';
        md += '`_` | [lodash](https://lodash.com/) | `_.isString(5979)` \n';
        md += '`$fs` | [fs-extra](https://github.com/jprichardson/node-fs-extra) | `$fs.existsSync("/path/to/something")` \n';
        md += '`$h` | [helpers](https://github.com/egodigital/vscode-powertools/blob/master/src/helpers.ts) | `$h.normalizeString("TM+MK")`\n';
        md += '\n';
    }

    const WEB_VIEW = new (require('../markdown').MarkdownWebView)({
        markdown: md,
        title: 'Code Execution Help',
    });

    await WEB_VIEW.open();
}
