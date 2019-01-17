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
    // @ts-ignore
    const $vs = require('vscode');

    const $unwrap = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (val?: any, maxLevel?: number, level?: number) => {
            maxLevel = parseInt(
                $h.toStringSafe(maxLevel).trim()
            );
            if (isNaN(maxLevel)) {
                maxLevel = 64;
            }

            level = parseInt(
                $h.toStringSafe(level).trim()
            );
            if (isNaN(level)) {
                level = 0;
            }

            if (level < maxLevel) {
                if (_.isFunction(val)) {
                    return await Promise.resolve(
                        $unwrap(
                            val(), maxLevel, level + 1
                        )
                    );
                }
            }

            return val;
        }
    );

    // @ts-ignore
    const $guid = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (version?: string) => {
            const uuid = require('uuid');

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
    const $pwd = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async function (length?: number, allowedChars?: string) {
            const crypto = require('crypto');

            length = parseInt(
                $h.toStringSafe(length).trim()
            );
            if (isNaN(length)) {
                length = 20;
            }

            if (arguments.length < 2) {
                allowedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            }
            allowedChars = $h.toStringSafe(allowedChars);

            const RANDOM_BYTES = await (() => {
                return new Promise<Buffer>((resolve, reject) => {
                    try {
                        crypto.randomBytes(length * 4, (err: any, bytes: Buffer) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(bytes);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            })();

            let password = '';

            for (let i = 0; i < length; i++) {
                const RB = RANDOM_BYTES.readUInt32LE(i * 4);
                const C = allowedChars[RB % allowedChars.length];

                password += C;
            }

            return password;
        }
    );

    // @ts-ignore
    const $r = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (id: string) => {
            return $h.requireModule(id);
        }
    );

    // @ts-ignore
    const $res = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (val: any, mapper?: (v: any) => any) => {
            if (mapper) {
                return await Promise.resolve(
                    mapper(val)
                );
            }

            return val;
        }
    );

    // @ts-ignore
    const $htmldec = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (val: any) => {
            const HTML = new (require('html-entities').AllHtmlEntities);

            return HTML.decode(
                $h.toStringSafe(val)
            );
        }
    );
    // @ts-ignore
    const $htmlenc = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (val: any) => {
            const HTML = new (require('html-entities').AllHtmlEntities);

            return HTML.encode(
                $h.toStringSafe(val)
            );
        }
    );

    // @ts-ignore
    const $hash = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (algo: string, val: any, asBlob?: boolean) => {
            const crypto = require('crypto');
            const isStream = require('is-stream');

            algo = $h.normalizeString(algo);
            asBlob = $h.toBooleanSafe(asBlob);

            if (isStream(val)) {
                val = await $h.asBuffer(val);
            } else {
                if (!Buffer.isBuffer(val)) {
                    val = new Buffer(
                        $h.toStringSafe(val), 'utf8'
                    );
                }
            }

            return crypto.createHash(algo)
                .update(val)
                .digest(asBlob ? undefined : 'hex');
        }
    );
    // @ts-ignore
    const $md5 = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        function (val: any, asBlob?: boolean) {
            return $hash.apply(
                null, [ 'md5' ].concat($h.toArray(arguments))
            );
        }
    );
    // @ts-ignore
    const $sha1 = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        function (val: any, asBlob?: boolean) {
            return $hash.apply(
                null, [ 'sha1' ].concat($h.toArray(arguments))
            );
        }
    );
    // @ts-ignore
    const $sha256 = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        function (val: any, asBlob?: boolean) {
            return $hash.apply(
                null, [ 'sha256' ].concat($h.toArray(arguments))
            );
        }
    );
    // @ts-ignore
    const $sha384 = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        function (val: any, asBlob?: boolean) {
            return $hash.apply(
                null, [ 'sha384' ].concat($h.toArray(arguments))
            );
        }
    );
    // @ts-ignore
    const $sha512 = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        function (val: any, asBlob?: boolean) {
            return $hash.apply(
                null, [ 'sha512' ].concat($h.toArray(arguments))
            );
        }
    );

    // @ts-ignore
    const $asc = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (str) => {
            str = $h.toStringSafe(str);

            const CODES: number[] = [];
            for (let i = 0; i < str.length; i++) {
                CODES.push(str.charCodeAt(i));
            }

            return 1 === CODES.length ? CODES[0]
                                      : CODES;
        }
    );

    // @ts-ignore
    const $emojis = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (search) => {
            const emoji = require('node-emoji');

            search = $h.toStringSafe(search).trim();

            const SEARCH_RESULT = emoji.search(search);

            const EMOJI_LIST = {};
            for (const ITEM of SEARCH_RESULT) {
                EMOJI_LIST[ITEM.key] = ITEM.emoji;
            }

            const SORTED_EMOJI_LIST = {};
            for (const KEY of Object.keys(EMOJI_LIST)) {
                SORTED_EMOJI_LIST[KEY] = EMOJI_LIST[KEY];
            }

            return SORTED_EMOJI_LIST;
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
        md += '`$asc(str)` | Handles a value as string and returns the ASCII (codes). | `$asc("T")`\n';
        md += '`$cmd(id, ...args)` | Executes a [Visual Studio Code command](https://code.visualstudio.com/api/references/commands). | `$cmd("vscode.openFolder")`\n';
        md += '`$emojis(search?)` | Returns a list of [emojis](https://www.npmjs.com/package/node-emoji), by using an optional filter. | `$emojis("heart")`\n';
        md += '`$guid(version?)` | Generates a GUID. | `$guid("4")`\n';
        md += '`$hash(algo, val, asBlob?)` | Hashes a value. | `$hash("sha1", "TM+MK")`\n';
        md += '`$htmldec(val)` | Handles a values as string, and decodes the HTML entities. | `$htmldec("5979 &gt; 23979")`\n';
        md += '`$htmlenc(val)` | Handles a values as string, and encodes the HTML entities. | `$htmlenc("<tm>")`\n';
        md += '`$md5(val, asBlob?)` | Hashes a value with MD5. | `$md5("TM+MK")`\n';
        md += '`$pwd(length?, allowedChars?)` | Generates a password. | `$pwd(64)`\n';
        md += '`$r(id)` | Extended [require() function](https://nodejs.org/api/modules.html#modules_require), which also allows to access the [modules of that extension](https://github.com/egodigital/vscode-powertools/blob/master/package.json). | `$r("moment").utc()`\n';
        md += '`$res(val, mapper?)` | Resolves a value. | `$res( Promise.resolve("TM"), s => s.toLowerCase() )`\n';
        md += '`$sha1(val, asBlob?)` | Hashes a value with SHA-1. | `$sha1("TM+MK")`\n';
        md += '`$sha256(val, asBlob?)` | Hashes a value with SHA-256. | `$sha256("TM+MK")`\n';
        md += '`$sha384(val, asBlob?)` | Hashes a value with SHA-384. | `$sha384("TM+MK")`\n';
        md += '`$sha512(val, asBlob?)` | Hashes a value with SHA-512. | `$sha512("TM+MK")`\n';
        md += '`$unwrap(val, maxLevel?`, level?)` | Unwraps a value from being a function. | `$unwrap(() => 5979)` \n';
        md += '`$uuid(version?)` | Alias for `guid`. | `$uuid("4")`\n';
        md += '\n';
    }

    // modules
    {
        md += '## Modules\n';
        md += 'Name | Description | Example\n';
        md += '---- | ----------- | -------\n';
        md += '`_` | [lodash](https://lodash.com/) | `_.isString(5979)`\n';
        md += '`$fs` | [fs-extra](https://github.com/jprichardson/node-fs-extra) | `$fs.existsSync("/path/to/something")`\n';
        md += '`$h` | [helpers](https://github.com/egodigital/vscode-powertools/blob/master/src/helpers.ts) | `$h.normalizeString("TM+MK")`\n';
        md += '`$vs` | [Visual Studio Code API](https://code.visualstudio.com/api/references/vscode-api) | `$vs.commands.getCommands`\n';
        md += '\n';
    }

    const WEB_VIEW = new (require('../markdown').MarkdownWebView)({
        markdown: md,
        title: 'Code Execution Help',
    });

    await WEB_VIEW.open();
}
