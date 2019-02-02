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
    const $m = require('moment');
    require('moment-timezone');
    // @ts-ignore
    const $o = require('opn');
    // @ts-ignore
    const $vs = require('vscode');

    // @ts-ignore
    const $e = (
        $vs.window.activeTextEditor &&
        $vs.window.activeTextEditor.document
    ) ? $vs.window.activeTextEditor.document.getText()
      : false;

    // @ts-ignore
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
    const $alert = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (msg: any) => {
            await $vs.window.showWarningMessage(
                $h.toStringSafe(msg)
            );
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

    // @ts-ignore
    const $exec = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async () => {
            const ACTIVE_EDITOR = $vs.window.activeTextEditor;
            if (ACTIVE_EDITOR) {
                const DOCUMENT = ACTIVE_EDITOR.document;
                if (DOCUMENT) {
                    return await Promise.resolve(eval(`(async () => {

${ $h.toStringSafe(DOCUMENT.getText()) }

})()`));
                }
            }

            throw new Error('No active editor found!');
        }
    );

    // @ts-ignore
    const $DELETE = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (url: string, body?: any, headers?: any) => {
            return toHttpResponseResult_ce264120a2bf44a98d6044ce418333cd(
                await $h.DELETE(
                    $h.toStringSafe(url), body, headers,
                )
            );
        }
    );
    // @ts-ignore
    const $GET = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (url: string, headers?: any) => {
            return toHttpResponseResult_ce264120a2bf44a98d6044ce418333cd(
                await $h.GET(
                    $h.toStringSafe(url), headers,
                )
            );
        }
    );
    // @ts-ignore
    const $PATCH = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (url: string, body?: any, headers?: any) => {
            return toHttpResponseResult_ce264120a2bf44a98d6044ce418333cd(
                await $h.PATCH(
                    $h.toStringSafe(url), body, headers,
                )
            );
        }
    );
    // @ts-ignore
    const $POST = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (url: string, body?: any, headers?: any) => {
            return toHttpResponseResult_ce264120a2bf44a98d6044ce418333cd(
                await $h.POST(
                    $h.toStringSafe(url), body, headers,
                )
            );
        }
    );
    // @ts-ignore
    const $PUT = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (url: string, body?: any, headers?: any) => {
            return toHttpResponseResult_ce264120a2bf44a98d6044ce418333cd(
                await $h.PUT(
                    $h.toStringSafe(url), body, headers,
                )
            );
        }
    );

    // @ts-ignore
    const $ip = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (v6?: boolean, timeout?: number) => {
            const publicIP = require('public-ip');

            v6 = $h.toBooleanSafe(v6);

            timeout = parseInt(
                $h.toStringSafe(
                    timeout
                ).trim()
            );
            if (isNaN(timeout)) {
                timeout = 5000;
            }

            const OPTS = {
                timeout: timeout,
            };

            return v6 ? publicIP.v6(OPTS)
                : publicIP.v4(OPTS);
        }
    );
    // @ts-ignore
    const $ip4 = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (timeout?: number) => $ip(false, timeout),
    );
    // @ts-ignore
    const $ip6 = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (timeout?: number) => $ip(true, timeout),
    );

    // @ts-ignore
    const $now = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (tz) => {
            const NOW = $m();

            tz = $h.toStringSafe(tz)
                .trim();

            return '' === tz ? NOW
                             : NOW.tz(tz);
        }
    );
    // @ts-ignore
    const $utc = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async () => {
            return $m.utc();
        }
    );

    // @ts-ignore
    const $full = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async (p: string) => {
            return getFullPath_fb9882a1f9c94d97a5f0d65e28f07cba(p);
        }
    );

    // @ts-ignore
    const $read = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async function (file: string, encoding?: string) {
            file = getFullPath_fb9882a1f9c94d97a5f0d65e28f07cba(file);
            encoding = $h.normalizeString(encoding);

            return arguments.length < 2 ? await $fs.readFile(file)
                : await $fs.readFile(file, encoding);
        }
    );
    // @ts-ignore
    const $write = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async function (file: string, data: any, encoding?: string) {
            file = getFullPath_fb9882a1f9c94d97a5f0d65e28f07cba(file);
            encoding = $h.normalizeString(encoding);

            if (arguments.length < 3) {
                await $fs.writeFile(file, data);
            } else {
                await $fs.writeFile(file, data, encoding);
            }
        }
    );

    // @ts-ignore
    const $md = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async function (markdown: any) {
            markdown = await $h.asBuffer(markdown, 'utf8');

            return {
                '__markdown_tm_19790905': Symbol('MARKDOWN_DOCUMENT'),
                'markdown': markdown.toString('utf8'),
                'toString': function() {
                    return this.markdown;
                }
            };
        }
    );

    // @ts-ignore
    const $beautify = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async () => {
            const EDITOR = $vs.window.activeTextEditor;
            if (EDITOR) {
                const DOC = EDITOR.document;
                if (DOC) {
                    let result: any = Symbol('LANGUAGE_NOT_SUPPORTED');
                    const TEXT: string = DOC.getText();
                    let lang: string = DOC.languageId;

                    switch ($h.normalizeString(lang)) {
                        case 'css':
                            {
                                const beautify = require('js-beautify').css;

                                result = beautify(TEXT);
                            }
                            break;

                        case 'html':
                            {
                                const beautify = require('js-beautify').html;

                                result = beautify(TEXT);
                            }
                            break;

                        case 'javascript':
                            {
                                const beautify = require('js-beautify').js;

                                result = beautify(TEXT);
                            }
                            break;
                    }

                    if (_.isSymbol(result)) {
                        throw new Error(`Language '${ DOC.languageId }' is not supported!`);
                    }

                    return {
                        '__neweditor_tm_19790905': Symbol('NEW_EDITOR'),
                        'column': $vs.ViewColumn.Two,
                        'lang': lang,
                        'text': $h.toStringSafe(result),
                    };
                }
            }

            throw new Error('No active editor found!');
        }
    );
    // @ts-ignore
    const $compile = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async () => {
            const EDITOR = $vs.window.activeTextEditor;
            if (EDITOR) {
                const DOC = EDITOR.document;
                if (DOC) {
                    let result: any = Symbol('LANGUAGE_NOT_SUPPORTED');
                    const TEXT: string = DOC.getText();
                    let lang: string = DOC.languageId;

                    switch ($h.normalizeString(DOC.languageId)) {
                        case 'coffeescript':
                            {
                                const beautify = require('js-beautify').js;
                                const coffeeScript = require('coffeescript');

                                result = coffeeScript.compile(TEXT, {
                                    bare: true,
                                });
                                result = beautify(result);

                                lang = 'javascript';
                            }
                            break;

                        case 'less':
                            {
                                const beautify = require('js-beautify').css;
                                const less = require('less');

                                const COMPILER_RESULT = await less.render(TEXT);

                                result = beautify(
                                    COMPILER_RESULT.css
                                );

                                lang = 'css';
                            }
                            break;
                    }

                    if (_.isSymbol(result)) {
                        throw new Error(`Language '${ DOC.languageId }' is not supported!`);
                    }

                    return {
                        '__neweditor_tm_19790905': Symbol('NEW_EDITOR'),
                        'column': $vs.ViewColumn.Two,
                        'lang': lang,
                        'text': $h.toStringSafe(result),
                    };
                }
            }

            throw new Error('No active editor found!');
        }
    );
    // @ts-ignore
    const $uglify = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async () => {
            const EDITOR = $vs.window.activeTextEditor;
            if (EDITOR) {
                const DOC = EDITOR.document;
                if (DOC) {
                    let result: any = Symbol('LANGUAGE_NOT_SUPPORTED');
                    const TEXT: string = DOC.getText();
                    let lang: string = DOC.languageId;

                    switch ($h.normalizeString(DOC.languageId)) {
                        case 'coffeescript':
                            {
                                const coffeeScript = require('coffeescript');
                                const uglifyJS = require('uglify-js');

                                result = coffeeScript.compile(TEXT, {
                                    bare: true,
                                });
                                result = uglifyJS.minify(result)
                                    .code;

                                lang = 'javascript';
                            }
                            break;

                        case 'css':
                            {
                                const cleanCSS = require('clean-css');

                                result = new cleanCSS()
                                    .minify(TEXT)
                                    .styles;
                            }
                            break;

                        case 'javascript':
                            {
                                const uglifyJS = require('uglify-js');

                                result = uglifyJS.minify(TEXT)
                                    .code;
                            }
                            break;

                        case 'less':
                            {
                                const cleanCSS = require('clean-css');
                                const less = require('less');

                                const COMPILER_RESULT = await less.render(TEXT);

                                result = COMPILER_RESULT.css;
                                result = new cleanCSS()
                                    .minify(result)
                                    .styles;

                                lang = 'css';
                            }
                            break;
                    }

                    if (_.isSymbol(result)) {
                        throw new Error(`Language '${ DOC.languageId }' is not supported!`);
                    }

                    return {
                        '__neweditor_tm_19790905': Symbol('NEW_EDITOR'),
                        'column': $vs.ViewColumn.Two,
                        'lang': lang,
                        'text': $h.toStringSafe(result),
                    };
                }
            }

            throw new Error('No active editor found!');
        }
    );

    // @ts-ignore
    const $csv = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        async function(data: any) {
            data = await $h.asBuffer(data);

            return {
                '__csv_tm_19790905': Symbol('CSV'),
                'data': _.isNil(data) ? data : data.toString('utf8'),
            };
        }
    );

    // @ts-ignore
    const $ltrim = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (val: any) => {
            return $h.toStringSafe(val)
                .replace(/^\s+/, "");
        }
    );
    // @ts-ignore
    const $rtrim = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (val: any) => {
            return $h.toStringSafe(val)
                .replace(/\s+$/, "");
        }
    );
    // @ts-ignore
    const $trim = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (val: any) => {
            return $h.toStringSafe(val)
                .trim();
        }
    );

    // @ts-ignore
    const $lower = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (val: any) => {
            return $h.toStringSafe(val)
                .toLowerCase();
        }
    );
    // @ts-ignore
    const $upper = asAsync_628dffd9c1e74e5cb82620a2c575e5dd(
        (val: any) => {
            return $h.toStringSafe(val)
                .toUpperCase();
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

    return await $vs.window.withProgress({
        cancellable: true,
        location: $vs.ProgressLocation.Window,
        title: 'Executing Code ...'
    }, async ($progress: any, $cancel: any) => {
        return await $unwrap(eval(`(async () => {

${ _code_g93c97d35bd94b22b3041037bdc64780 }

})()`));
    });
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

function getFullPath_fb9882a1f9c94d97a5f0d65e28f07cba(p: string) {
    const fsExtra = require('fs-extra');
    const helpers = require('../helpers');
    const path = require('path');
    const vscode = require('vscode');

    p = helpers.toStringSafe(p);
    if (!path.isAbsolute(p)) {
        let basePath: string | false = false;

        const EDITOR = vscode.window.activeTextEditor;
        if (EDITOR) {
            const DOC = EDITOR.document;
            if (DOC) {
                const FILE = DOC.fileName;
                if (!helpers.isEmptyString(FILE) && fsExtra.existsSync(FILE)) {
                    basePath = path.dirname(
                        FILE
                    );
                }
            }
        }

        if (false === basePath) {
            basePath = <string>helpers.getExtensionDirInHome();
        }

        p = path.join(
            basePath, p
        );
    }

    return path.resolve(p);
}

async function showHelp_579c52a1992b472183db2fff8c764504() {
    let md = '# Code Execution Help\n\n';

    // functions
    {
        md += '## Constants\n';
        md += 'Name | Description | Example\n';
        md += '---- | ----------- | -------\n';
        md += '`$e` | Stores the content of the content of the current, active editor, or `(false)` if no editor is open. | `$alert( $e )`\n';
    }

    // functions
    {
        md += '## Functions\n';
        md += 'Name | Description | Example\n';
        md += '---- | ----------- | -------\n';
        md += '`$alert(msg)` | Shows a (warning) popup. | `$alert("Hello, TM!")`\n';
        md += '`$asc(str)` | Handles a value as string and returns the ASCII (codes). | `$asc("T")`\n';
        md += '`$beautify` | Beautifies the code in the active editor and opens the result in a new one. | `$beautify`\n';
        md += '`$cmd(id, ...args)` | Executes a [Visual Studio Code command](https://code.visualstudio.com/api/references/commands). | `$cmd("vscode.openFolder")`\n';
        md += '`$compile` | Compiles the code in the active editor and opens the result in a new one. | `$compile`\n';
        md += '`$csv(data)` | Handles data as CSV and displays them. | `$csv( "col 1, col2\\r\\nval1.1,val1.2\\r\\nval2.1,val2.2" )`\n';
        md += '`$DELETE(url, body?, headers?)` | Starts a HTTP DELETE request. | `$DELETE("https://example.com/users/19861222")`\n';
        md += '`$emojis(search?)` | Returns a list of [emojis](https://www.npmjs.com/package/node-emoji), by using an optional filter. | `$emojis("heart")`\n';
        md += '`$exec` | Executes the code in the currently running editor. | `$exec`\n';
        md += '`$full(path?)` | Returns a full path. | `$full("dir1/subDir1_1/myFile.txt")`\n';
        md += '`$GET(url, headers?)` | Starts a HTTP GET request. | `$GET("https://example.com/users/19790905")`\n';
        md += '`$guid(version?)` | Generates a GUID. | `$guid("4")`\n';
        md += '`$hash(algo, val, asBlob?)` | Hashes a value. | `$hash("sha1", "TM+MK")`\n';
        md += '`$htmldec(val)` | Handles a values as string, and decodes the HTML entities. | `$htmldec("5979 &gt; 23979")`\n';
        md += '`$htmlenc(val)` | Handles a values as string, and encodes the HTML entities. | `$htmlenc("<tm>")`\n';
        md += '`$ip(v6?, timeout?)` | Tries to detect the public IP address. | `$ip(true)`\n';
        md += '`$ip4(timeout?)` | Tries to detect the public IP address (version 4). | `$ip4`\n';
        md += '`$ip6(timeout?)` | Tries to detect the public IP address (version 6). | `$ip6`\n';
        md += '`$lower(val)` | Handles a value as string and converts to lower case characters. | `$lower("tm + MK")`\n';
        md += '`$ltrim(val)` | Handles a value as string and trims from leading whitespaces. | `$ltrim("  TM + MK   ")`\n';
        md += '`$md(src)` | Handles a value as [Markdown](https://github.com/showdownjs/showdown) string. | `$md("# Header 1\\n\\nHello, TM!")`\n';
        md += '`$md5(val, asBlob?)` | Hashes a value with MD5. | `$md5("TM+MK")`\n';
        md += '`$now(timeZone?)` | Returns the current [time](https://momentjs.com/), with an optional [timezone](https://momentjs.com/timezone/). | `$now("Europe/Berlin")`\n';
        md += '`$PATCH(url, body?, headers?)` | Starts a HTTP PATCH request. | `$PATCH("https://example.com/users/19790905")`\n';
        md += '`$POST(url, body?, headers?)` | Starts a HTTP POST request. | `$POST("https://example.com/users/19790905")`\n';
        md += '`$PUT(url, body?, headers?)` | Starts a HTTP PUT request. | `$PUT("https://example.com/users/19790905")`\n';
        md += '`$pwd(length?, allowedChars?)` | Generates a password. | `$pwd(64)`\n';
        md += '`$r(id)` | Extended [require() function](https://nodejs.org/api/modules.html#modules_require), which also allows to access the [modules of that extension](https://github.com/egodigital/vscode-powertools/blob/master/package.json). | `$r("moment").utc()`\n';
        md += '`$read(file, enc?)` | Reads data from a file. Relative paths will be mapped to the directory of the currently opened editor or the `.vscode-powertools` sub folder inside the user\'s home directory. | `$read("myFile.txt")`\n';
        md += '`$res(val, mapper?)` | Resolves a value. | `$res( Promise.resolve("TM"), s => s.toLowerCase() )`\n';
        md += '`$rtrim(val)` | Handles a value as string and trims from ending whitespaces. | `$rtrim("  TM + MK   ")`\n';
        md += '`$sha1(val, asBlob?)` | Hashes a value with SHA-1. | `$sha1("TM+MK")`\n';
        md += '`$sha256(val, asBlob?)` | Hashes a value with SHA-256. | `$sha256("TM+MK")`\n';
        md += '`$sha384(val, asBlob?)` | Hashes a value with SHA-384. | `$sha384("TM+MK")`\n';
        md += '`$sha512(val, asBlob?)` | Hashes a value with SHA-512. | `$sha512("TM+MK")`\n';
        md += '`$trim(val)` | Handles a value as string and trims from leading and ending whitespaces. | `$trim("  TM + MK   ")`\n';
        md += '`$uglify` | Uglifies the code in the active editor and opens the result in a new one. | `$uglify`\n';
        md += '`$unwrap(val, maxLevel?, level?)` | Unwraps a value from being a function. | `$unwrap(() => 5979)` \n';
        md += '`$upper(val)` | Handles a value as string and converts to upper case characters. | `$upper("tm + MK")`\n';
        md += '`$utc` | Returns the current [time](https://momentjs.com/) in [UTC](https://en.wikipedia.org/wiki/Coordinated_Universal_Time). | `$utc`\n';
        md += '`$uuid(version?)` | Alias for `guid`. | `$uuid("4")`\n';
        md += '`$write(file, data, enc?)` | Writes data to a file. Relative paths will be mapped to the directory of the currently opened editor or the `.vscode-powertools` sub folder inside the user\'s home directory. | `$write("myFile.txt", "Data to write. Can be a string, stream or buffer")`\n';
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
        md += '`$m` | [Moment.js](https://momentjs.com/) | `$m()`\n';
        md += '`$o` | [opn](https://www.npmjs.com/package/opn) | `$o("https://e-go-digital.com")`\n';
        md += '`$vs` | [Visual Studio Code API](https://code.visualstudio.com/api/references/vscode-api) | `$vs.commands.getCommands`\n';
        md += '\n';
    }

    const WEB_VIEW = new (require('../markdown').MarkdownWebView)({
        markdown: md,
        title: 'Code Execution Help',
    });

    await WEB_VIEW.open();
}

function toHttpResponseResult_ce264120a2bf44a98d6044ce418333cd(result: any) {
    if (result) {
        result['__httpresponse_tm_19790905'] = Symbol('HTTP_RESPONSE');
    }

    return result;
}
