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
import * as changeCase from 'change-case';
import * as childProcess from 'child_process';
import * as ego_contracts from './contracts';
import * as ego_helpers from './helpers';
import * as ego_log from './log';
import * as ego_values from './values';
import * as ego_workspace from './workspace';
import * as ego_webview from './webview';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as htmlEntities from 'html-entities';
import * as mimeTypes from 'mime-types';
const opn = require('opn');
import * as os from 'os';
import * as path from 'path';
import * as sanitizeFilename from 'sanitize-filename';
import * as tmp from 'tmp';
import * as yazl from 'yazl';
import * as vscode from 'vscode';
const zip = require('node-zip');


/**
 * Name of the key for storing app instances.
 */
export const KEY_APPS = 'apps';
// const REGEX_APP_NAME = /^([a-z])([a-z|0-9|\_|\-]{0,})$/gm;


/**
 * A webview for a custom (workspace) app.
 */
export abstract class AppWebViewBase extends ego_webview.WebViewWithContextBase {
    /**
     * Creates arguments for an event function.
     *
     * @param {string} eventName The name of the event.
     * @param {any} [data] The data for the event.
     *
     * @return {ego_contracts.AppEventScriptArguments} The created arguments.
     */
    protected abstract createScriptArguments(
        eventName: string,
        data?: any,
    ): ego_contracts.AppEventScriptArguments;

    /**
     * Clears the '.temp' sub folder.
     *
     * @return {boolean} Temp folder has been cleared or not.
     */
    protected clearTempDir(): boolean {
        const TEMP_DIR = this.getTempDir();
        if (fsExtra.existsSync(TEMP_DIR)) {
            fsExtra.removeSync(TEMP_DIR);
            return true;
        }

        return false;
    }

    /**
     * @inheritdoc
     */
    public async close(): Promise<boolean> {
        const ARGS = this.createScriptArguments('on.close');

        const FUNC = this.getEventFunction(m => m.onClose);
        if (FUNC) {
            await Promise.resolve(
                FUNC(ARGS)
            );
        }

        return await super.close();
    }

    /**
     * Creates a new temp file, inside the '.temp' sub folder.
     *
     * @return {string} The full path of the new file.
     */
    protected createTempFile(): string {
        const TEMP_DIR = this.getTempDir();
        if (!fsExtra.existsSync(TEMP_DIR)) {
            fsExtra.mkdirsSync(TEMP_DIR);
        }

        const TEMP_FILE = tmp.tmpNameSync({
            dir: TEMP_DIR,
        });
        fsExtra.writeFileSync(
            TEMP_FILE, Buffer.alloc(0)
        );

        return TEMP_FILE;
    }

    /**
     * Checks if a file or folder exists, relative to '.data' sub folder.
     *
     * @param {string} p The path of the file / folder to check.
     *
     * @return {boolean} Indicates if file / folder exists or not.
     */
    protected fileSystemItemExists(p: string): boolean {
        return fsExtra.existsSync(
            this.toFullDataPath(p)
        );
    }

    /**
     * Returns file system information of a file or folder, relative to the '.data' sub folder.
     *
     * @param {string} p The path of the item.
     * @param {boolean} [lstat] Use 'fs.lstat()' instead of 'fs.stat()'. Default: (true)
     *
     * @return {fs.Stats|false} The information or (false) if not found.
     */
    protected fileSystemItemStat(p: string, lstat?: boolean): fs.Stats | false {
        p = this.toFullDataPath(p);
        lstat = ego_helpers.toBooleanSafe(lstat, true);

        if (fsExtra.existsSync(p)) {
            return lstat ? fsExtra.lstatSync(p)
                         : fsExtra.statSync(p);
        }

        return false;
    }

    /**
     * @inheritdoc
     */
    protected generateHtmlBody(): string {
        const ARGS = this.createScriptArguments('get.html');

        let html: string;

        const FUNC = this.getEventFunction(m => m.getHtml);
        if (FUNC) {
            html = FUNC(ARGS);
        }

        return ego_helpers.toStringSafe(
            html
        );
    }

    /**
     * Returns the list of all workspaces.
     *
     * @return {ego_contracts.WorkspaceInfo[]} The list of workspaces.
     */
    protected getAllWorkspaces(): ego_contracts.WorkspaceInfo[] {
        return ego_helpers.from(
            ego_workspace.getAllWorkspaces()
        ).select(ws => {
            return ws.getInfo();
        }).orderBy(wi => {
            return wi.index;
        }).thenBy(wi => {
            return ego_helpers.normalizeString(
                wi.name
            );
        }).thenBy(wi => {
            return ego_helpers.normalizeString(
                wi.rootPath
            );
        }).toArray();
    }

    /**
     * Returns the function for an app event.
     *
     * @param {Function} funcProvider The function provider.
     *
     * @return {ego_contracts.AppEventFunction} The function (if available).
     */
    protected getEventFunction(funcProvider: (m: ego_contracts.AppModule) => ego_contracts.AppEventFunction): ego_contracts.AppEventFunction {
        const FUNC = funcProvider(this.module);

        return _.isNil(FUNC) ? this.module.onEvent
                             : FUNC;
    }

    /**
     * @inheritdoc
     */
    protected getResourceUris() {
        const URIs: vscode.Uri[] = super.getResourceUris();

        // '.vscode-powertools' sub folder inside user's home directory
        URIs.unshift(
            vscode.Uri.file(
                ego_helpers.getExtensionDirInHome()
            )
        );
        // script's folder
        URIs.unshift(
            vscode.Uri.file(
                path.resolve(
                    path.dirname(
                        this.scriptFile
                    )
                )
            )
        );

        return URIs;
    }

    /**
     * Returns the full path of the temp directory.
     *
     * @return {string} The temp directory.
     */
    protected getTempDir(): string {
        return path.resolve(
            path.join(
                path.dirname(this.scriptFile),
                '.temp',
            )
        );
    }

    /**
     * @inheritdoc
     */
    protected getTitle(): string {
        const ARGS = this.createScriptArguments('get.title');

        let title: string;

        const FUNC = this.getEventFunction(m => m.getTitle);
        if (FUNC) {
            title = FUNC(ARGS);
        }

        return ego_helpers.toStringSafe(
            title
        );
    }

    /**
     * @inheritdoc
     */
    protected getType(): string {
        return 'App';
    }

    /**
     * Gets the underlying module.
     */
    public abstract get module(): ego_contracts.AppModule;

    /**
     * @inheritdoc
     */
    protected onDispose() {
        const ARGS = this.createScriptArguments('on.dispose');

        const FUNC = this.module.onDispose;
        if (FUNC) {
            FUNC(ARGS);
        }

        super.onDispose();
    }

    /**
     * @inheritdoc
     */
    protected async onLoaded() {
        const ARGS = this.createScriptArguments('on.loaded');

        const FUNC = this.getEventFunction(m => m.onLoaded);
        if (FUNC) {
            await Promise.resolve(
                FUNC(ARGS)
            );
        }
    }

    /**
     * @inheritdoc
     */
    protected async onWebViewDisposed() {
        const ARGS = this.createScriptArguments('on.disposed');

        const FUNC = this.getEventFunction(m => m.onDisposed);
        if (FUNC) {
            await Promise.resolve(
                FUNC(ARGS)
            );
        }
    }

    /**
     * @inheritdoc
     */
    protected async onWebViewMessage(msg: ego_contracts.WebViewMessage): Promise<boolean> {
        const FUNC = this.getEventFunction(
            m => m.onMessage
        );
        if (FUNC) {
            const ARGS = this.createScriptArguments(
                'on.command',
                msg
            );

            return ego_helpers.toBooleanSafe(
                await Promise.resolve(
                    FUNC(ARGS)
                ),
            );
        }

        return false;
    }

    /**
     * Reads a file, relative to '.data' sub folder.
     *
     * @param {string} p The path of the file.
     *
     * @return {Buffer} The read data.
     */
    protected readFile(p: string): Buffer {
        return fsExtra.readFileSync(
            this.toFullDataPath(p)
        );
    }

    /**
     * Reads a file or folder, relative to '.data' sub folder.
     *
     * @param {string} p The path of the file / folder.
     */
    protected removeFileOrFolder(p: string) {
        p = this.toFullDataPath(p);

        if (ego_helpers.isDirectorySync(p, true)) {
            fsExtra.removeSync(p);
        } else {
            fsExtra.unlinkSync(p);
        }
    }

    /**
     * Get the full path of the script file.
     */
    public abstract get scriptFile(): string;

    /**
     * Returns a full path, relative to '.data' sub directory.
     *
     * @param {string} p The input path.
     *
     * @return {string} The full path.
     */
    protected toFullDataPath(p: string): string {
        p = ego_helpers.toStringSafe(p);

        if (!path.isAbsolute(p)) {
            p = path.resolve(
                path.join(
                    path.dirname(this.scriptFile),
                    '.data',
                    p
                )
            );
        }

        return path.resolve(p);
    }

    /**
     * Write data to a file, relative to '.data' sub folder.
     *
     * @param {string} p The path of the file.
     * @param {any} data The data write.
     */
    protected writeFile(p: string, data: any) {
        if (!data) {
            data = Buffer.alloc(0);
        }
        if (!Buffer.isBuffer(data)) {
            data = Buffer.from(
                ego_helpers.toStringSafe(data), 'utf8'
            );
        }

        p = this.toFullDataPath(p);

        // keep sure directory exists
        const DIR = path.dirname(p);
        if (!fsExtra.existsSync(DIR)) {
            fsExtra.mkdirsSync(DIR);
        }

        fsExtra.writeFileSync(p, data);
    }
}

/**
 * A web view for an app.
 */
export class AppWebView extends AppWebViewBase {
    private _module: ego_contracts.AppModule;

    /**
     * Initializes a new instance of that class.
     *
     * @param {vscode.ExtensionContext} extension The underlying extension context.
     * @param {vscode.OutputChannel} output The output channel.
     * @param {string} scriptFile The path to the script file.
     */
    public constructor(
        extension: vscode.ExtensionContext,
        public readonly output: vscode.OutputChannel,
        public readonly scriptFile: string,
    ) {
        super(extension);

        // package.json
        const PACKAGE_JSON = path.resolve(
            path.join(
                path.dirname(scriptFile), 'package.json'
            )
        );
        if (ego_helpers.isFileSync(PACKAGE_JSON, false)) {
            this.packageJSON = JSON.parse(
                fsExtra.readFileSync(
                    PACKAGE_JSON, 'utf8'
                )
            );
        }
    }

    /**
     * @inheritdoc
     */
    protected createScriptArguments(
        eventName: string,
        data?: any,
    ): ego_contracts.AppEventScriptArguments {
        const ME = this;

        let options: any;
        if (this.packageJSON) {
            options = this.packageJSON;
        }

        const ARGS: ego_contracts.AppEventScriptArguments = {
            clearTemp: () => {
                return this.clearTempDir();
            },
            data: data,
            event: eventName,
            exists: (p) => {
                return this.fileSystemItemExists(p);
            },
            extension: this.extension,
            getAllWorkspaces: () => {
                return this.getAllWorkspaces();
            },
            getFileResourceUri: (p, asString?) => {
                let uri: string | vscode.Uri = this.getFileResourceUri(p);
                if (!_.isNil(uri)) {
                    if (ego_helpers.toBooleanSafe(asString, true)) {
                        uri = `${ uri }`;
                    }
                }

                return uri;
            },
            logger: ego_log.CONSOLE,
            options: options,
            output: this.output,
            post: (cmd, data?) => {
                return this.postMessage(
                    cmd, data
                );
            },
            readFile: (p) => {
                return this.readFile(p);
            },
            remove: (p) => {
                this.removeFileOrFolder(p);
            },
            render: function (source, data?) {
                return ejs.render(
                    ego_helpers.toStringSafe(source),
                    data
                );
            },
            renderFile: function (file, data?) {
                file = ego_helpers.toStringSafe(
                    file
                );

                if (!path.isAbsolute(file)) {
                    file = path.join(
                        path.dirname(ME.scriptFile),
                        file
                    );
                }

                return this.render(
                    fsExtra.readFileSync(
                        path.resolve( file ),
                        'utf8'
                    ),
                    data
                );
            },
            replaceValues: (val) => {
                return ego_values.replaceValuesByObjects(
                    ego_values.getGlobalValues(),
                    val,
                );
            },
            require: (id) => {
                return ego_helpers.requireModule(id);
            },
            stat: (p, lstat) => {
                return this.fileSystemItemStat(p, lstat);
            },
            tempFile: () => {
                return this.createTempFile();
            },
            toDataPath: (p) => {
                return this.toFullDataPath(p);
            },
            workspaces: undefined,
            writeFile: (p, data) => {
                this.writeFile(p, data);
            },
        };

        // ARGS.workspaces
        Object.defineProperty(ARGS, 'workspaces', {
            enumerable: true,
            get: () => {
                return ego_workspace.getWorkspaceList();
            }
        });

        return ARGS;
    }

    /**
     * Gets the description of the app.
     */
    public get description(): string {
        let appDescription: string;
        if (this.packageJSON) {
            appDescription = ego_helpers.toStringSafe(
                this.packageJSON.description
            ).trim();
        }

        if (ego_helpers.isEmptyString(appDescription)) {
            appDescription = undefined;
        }

        return appDescription;
    }

    /**
     * Gets the (display) name of the app.
     */
    public get displayName(): string {
        let appDisplayName: string;
        if (this.packageJSON) {
            appDisplayName = ego_helpers.toStringSafe(
                this.packageJSON.displayName
            ).trim();
        }

        if (ego_helpers.isEmptyString(appDisplayName)) {
            appDisplayName = this.name;
        }

        return appDisplayName;
    }

    /**
     * @inheritdoc
     */
    protected getTitle(): string {
        let title = super.getTitle();
        if (ego_helpers.isEmptyString(title)) {
            title = this.displayName;
        }

        return title;
    }

    /**
     * Initializes the app (view).
     */
    public async initialize() {
        this._module = ego_helpers.loadModule<ego_contracts.AppModule>(
            this.scriptFile
        );
    }

    /**
     * @inheritdoc
     */
    public get module(): ego_contracts.AppModule {
        return this._module;
    }

    /**
     * Gets the (internal) name of the app.
     */
    public get name(): string {
        let appName: string;
        if (this.packageJSON) {
            appName = ego_helpers.toStringSafe(
                this.packageJSON.name
            ).trim();
        }

        if (ego_helpers.isEmptyString(appName)) {
            appName = path.basename(
                path.dirname(this.scriptFile)
            );
        }

        return appName;
    }

    /**
     * The 'package.json' of the app (if available).
     */
    public readonly packageJSON: ego_contracts.AppPackageJSON;
}


/**
 * Builds a package file for an app.
 */
export async function buildAppPackage() {
    const INSTALLED_APPS = await getInstalledApps();

    const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = [];

    for (const IA of INSTALLED_APPS) {
        try {
            let name: string;
            let displayName: string;
            let filesToIgnore: string[];

            // package.json
            try {
                const PACKAGE_JSON = await IA.loadPackageJSON();
                if (PACKAGE_JSON) {
                    name = PACKAGE_JSON.name;
                    displayName = PACKAGE_JSON.displayName;
                }
            } catch (e) {
                ego_log.CONSOLE
                       .trace(e, 'apps.buildAppPackage(2)');
            }

            // .egoignore
            try {
                const EGO_IGNORE = await IA.loadIgnoreFile();
                if (EGO_IGNORE) {
                    filesToIgnore = EGO_IGNORE;
                }
            } catch (e) {
                ego_log.CONSOLE
                       .trace(e, 'apps.buildAppPackage(3)');
            }

            if (ego_helpers.isEmptyString(name)) {
                name = path.basename(
                    IA.path
                );
            }
            if (ego_helpers.isEmptyString(displayName)) {
                displayName = name;
            }

            ((x) => {
                QUICK_PICKS.push({
                    action: async () => {
                        const NEW_PACKAGE = new yazl.ZipFile();

                        await vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                        }, async (progress) => {
                            const ADD_FOLDER = async (p = '') => {
                                const FOLDER_PATH = path.resolve(
                                    path.join(x.app.path, p)
                                );

                                progress.report({
                                    message: `Adding directory '${ FOLDER_PATH }' ...`,
                                });

                                let filesAdded = false;
                                for (const ITEM of await fsExtra.readdir(FOLDER_PATH)) {
                                    if ('' === p) {
                                        if (ITEM.startsWith('.')) {
                                            if ('.egoignore' !== ITEM) {
                                                continue;
                                            }
                                        }

                                        if ('node_modules' === ITEM) {
                                            continue;  // we do not need the folder here
                                        }
                                    }

                                    const ITEM_PATH = path.resolve(
                                        path.join(FOLDER_PATH, ITEM)
                                    );

                                    const RELATIVE_PATH = '' !== p ? (p + '/' + ITEM) : ITEM;

                                    const STAT = await fsExtra.stat(ITEM_PATH);
                                    if (STAT.isFile()) {
                                        const IS_IGNORED = ego_helpers.doesMatch(
                                            RELATIVE_PATH, x.filesToIgnore
                                        ) || ego_helpers.doesMatch(
                                            '/' + RELATIVE_PATH, x.filesToIgnore
                                        );

                                        if (!IS_IGNORED) {
                                            progress.report({
                                                message: `Adding file '${ RELATIVE_PATH }' ...`,
                                            });

                                            NEW_PACKAGE.addBuffer(
                                                await fsExtra.readFile(ITEM_PATH),
                                                RELATIVE_PATH,
                                            );

                                            filesAdded = true;
                                        }
                                    } else {
                                        await ADD_FOLDER(
                                            RELATIVE_PATH,
                                        );
                                    }
                                }

                                if (!filesAdded) {
                                    if ('' !== p) {
                                        NEW_PACKAGE.addEmptyDirectory(p);
                                    }
                                }
                            };

                            await ADD_FOLDER();
                        });

                        const OUTPUT_FILE = await vscode.window.showSaveDialog({
                            defaultUri: vscode.Uri.file(
                                ego_helpers.getExtensionDirInHome()
                            ),
                            filters: {
                                'Package files (*.ego-app)': [ 'ego-app' ],
                                'All files (*.*)': [ '*' ]
                            },
                            saveLabel: 'Save app package to ...',
                        });

                        if (OUTPUT_FILE) {
                            if (await ego_helpers.exists(OUTPUT_FILE.fsPath)) {
                                await fsExtra.unlink(OUTPUT_FILE.fsPath);
                            }

                            await (() => {
                                return new Promise<void>((resolve, reject) => {
                                    try {
                                        const PIPE = NEW_PACKAGE.outputStream.pipe(
                                            fs.createWriteStream(OUTPUT_FILE.fsPath)
                                        );

                                        PIPE.once('error', (err) => {
                                            reject(err);
                                        });

                                        PIPE.once('close', () => {
                                            resolve();
                                        });

                                        NEW_PACKAGE.end();
                                    } catch (e) {
                                        reject(e);
                                    }
                                });
                            })();

                            await opn(
                                path.dirname(OUTPUT_FILE.fsPath),
                                {
                                    wait: false,
                                }
                            );
                        }
                    },
                    detail: x.app.path,
                    label: x.displayName,
                });
            })({
                app: IA,
                displayName: displayName,
                filesToIgnore: ego_helpers.asArray(filesToIgnore, true),
            });
        } catch (e) {
            ego_log.CONSOLE
                   .trace(e, 'apps.buildAppPackage(1)');
        }
    }

    if (QUICK_PICKS.length < 1) {
        vscode.window
              .showWarningMessage('No apps found!');

        return;
    }

    const SELECTED_ITEM = await vscode.window.showQuickPick(
        QUICK_PICKS,
        {
            placeHolder: 'Select the app, you would like to build a package for ...'
        }
    );

    if (SELECTED_ITEM) {
        await Promise.resolve(
            SELECTED_ITEM.action()
        );
    }
}

/**
 * Creates a (new) app.
 */
export async function createApp() {
    const HTML_ENCODER = new htmlEntities.AllHtmlEntities();

    const NAME = ego_helpers.normalizeString(
        await vscode.window.showInputBox({
            placeHolder: 'Enter the name of your new app here ...',
            prompt: 'App Name',
            validateInput: (val) => {
                if (ego_helpers.isEmptyString(val)) {
                    return 'Please enter a name for the app!';
                }
            },
        })
    );

    if ('' === NAME) {
        return;
    }

    let suggestedDisplayName = NAME.split('-').join(' ');
    suggestedDisplayName = suggestedDisplayName.split('_').join(' ');
    while (suggestedDisplayName.indexOf('  ') > -1) {
        suggestedDisplayName = suggestedDisplayName.split('  ')
            .join(' ');
    }

    const DISPLAY_NAME = ego_helpers.toStringSafe(
        await vscode.window.showInputBox({
            placeHolder: 'The display name of your app ...',
            prompt: 'App Display Name',
            value: changeCase.titleCase(
                suggestedDisplayName
            ).trim(),
            validateInput: (value) => {
                if (ego_helpers.isEmptyString(value)) {
                    return 'Please enter a display name for your app!';
                }
            }
        })
    ).trim();

    if ('' === DISPLAY_NAME) {
        return;
    }

    let description = ego_helpers.toStringSafe(
        await vscode.window.showInputBox({
            placeHolder: 'An optional description for your app ...',
        })
    ).trim();
    if ('' === description) {
        description = undefined;
    }

    const APP_DIR = path.resolve(
        path.join(
            ego_helpers.getAppsDir(),
            NAME,
        )
    );

    await fsExtra.mkdirs(APP_DIR);

    const PACKAGE_JSON_DATA: any = {
        name: NAME,
        displayName: DISPLAY_NAME,
        description: description,
        version: '0.0.1',
        license: 'MIT'
    };

    let author: string;
    let authorEmail: string;
    try {
        const GIT = await ego_helpers.createGitClient();

        try {
            const GIT_RESULT = await GIT.exec([ 'config', 'user.name' ]);
            if (ego_helpers.isEmptyString(GIT_RESULT.stdErr.toString('utf8'))) {
                author = GIT_RESULT.stdOut
                    .toString('utf8')
                    .trim();
            }
        } catch { }

        try {
            const GIT_RESULT = await GIT.exec([ 'config', 'user.email' ]);
            if (ego_helpers.isEmptyString(GIT_RESULT.stdErr.toString('utf8'))) {
                authorEmail = GIT_RESULT.stdOut
                    .toString('utf8')
                    .trim();
            }
        } catch { }
    } catch { }
    if (ego_helpers.isEmptyString(author)) {
        try {
            author = os.userInfo()
                .username;
        } catch { }
    }
    if (ego_helpers.isEmptyString(author)) {
        author = undefined;
    }
    if (ego_helpers.isEmptyString(authorEmail)) {
        authorEmail = undefined;
    }
    if (!ego_helpers.isEmptyString(author) || !ego_helpers.isEmptyString(authorEmail)) {
        PACKAGE_JSON_DATA['author'] = {
            email: authorEmail,
            name: author,
        };
    }

    const MIT_HEADER = `The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER`.split('\n');

    // view.ejs
    const VIEW_EJS = path.resolve(
        path.join(
            APP_DIR, 'view.ejs'
        )
    );
    await fsExtra.writeFile(
        VIEW_EJS,
        `<!--

${ HTML_ENCODER.encode(
    MIT_HEADER.join('\n')
) }

-->

<div class="container">
  <h1><%= page_title %></h1>

  <pre id="last-message-from-extension"></pre>
</div>

<style>

/* put your custom styles here */

</style>

<script>

/**
 * This is called, when a command
 * has been received from the app script.
 */
function ego_on_command(command, data) {
    switch (command) {
        case 'hello_back_from_extension':
            // this has been send from
            // 'onEvent()' function
            // in 'index.js'

            $('#last-message-from-extension').text(
                'From extension:\\n\\n' + JSON.stringify(data, null, 2)
            );
            break;
    }
}

/**
 * This is called, after the
 * page has been completely loaded.
 */
function ego_on_loaded() {
    // TODO

    // this is send to 'onEvent()' function
    // in 'index.js'
    ego_post('hello_from_webview_command', {
        'message': 'Hello, Echo!'
    });
}

</script>
`,
        'utf8'
    );

    // index.js
    const INDEX_JS = path.resolve(
        path.join(
            APP_DIR, ego_contracts.GLOBAL_APP_ENTRY
        )
    );
    await fsExtra.writeFile(
        INDEX_JS,
        `${ MIT_HEADER.map(l => ('// ' + l).trim()).join('\n') }

/**
 * Is invoked on an event.
 */
exports.onEvent = async (args) => {
    const vscode = args.require('vscode');

    switch (args.event) {
        case 'on.command':
            // is invoked, when the web view has
            // been post a (command) message
            if ('hello_from_webview_command' === args.data.command) {
                // this has been send from
                // 'ego_on_loaded()' function
                // in 'view.ejs'

                // s. https://code.visualstudio.com/api/references/vscode-api
                vscode.window.showInformationMessage(
                    'From WebView: ' + JSON.stringify(args.data.data, null, 2)
                );

                // send this back to 'view.ejs'
                await args.post('hello_back_from_extension', {
                    'message': 'Hello, Otto!'
                });
            }
            break;

        case 'on.loaded':
            // page inside web view has been completely loaded
            break;

        case 'on.close':
            // the web view is going to be closed
            break;

        case 'on.disposed':
            // the web view has been disposed
            break;
    }
};

/**
 * The web view is going to be disposed.
 */
exports.onDispose = (args) => {
};


/**
 * This returns the title, which is displayed in the tab
 * of the web view.
 */
exports.getTitle = () => {
    return ${ JSON.stringify(DISPLAY_NAME) };
};

/**
 * This returns the HTML code for the body.
 */
exports.getHtml = (args) => {
    return args.renderFile(
        'view.ejs',
        {
            'page_title': ${ JSON.stringify(DISPLAY_NAME) },
        }
    );
};
`,
        'utf8'
    );

    // package.json
    const PACKAGE_JSON = path.resolve(
        path.join(
            APP_DIR, 'package.json'
        )
    );
    await fsExtra.writeFile(
        PACKAGE_JSON,
        JSON.stringify(PACKAGE_JSON_DATA, null, 4),
        'utf8'
    );

    // LICENSE
    const LICENSE_FILE = path.resolve(
        path.join(
            APP_DIR, 'LICENSE'
        )
    );
    await fsExtra.writeFile(
        LICENSE_FILE,
        `MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
        'utf8'
    );

    // README.md
    const README_FILE = path.resolve(
        path.join(
            APP_DIR, 'README.md'
        )
    );
    await fsExtra.writeFile(
        README_FILE,
        `# ${ HTML_ENCODER.encode(NAME) }

${ ego_helpers.isEmptyString(description) ? 'This is an app for the [Visual Studio Code](https://code.visualstudio.com/) extension [Power Tools](https://marketplace.visualstudio.com/items?itemName=egodigital.vscode-powertools).' : HTML_ENCODER.encode(description) }

## Install

Keep sure to have [vscode-powertools](https://marketplace.visualstudio.com/items?itemName=egodigital.vscode-powertools) installed.

Then following these steps:

* press \`F1\` in [Visual Studio Code](https://code.visualstudio.com/) to open the command list
* select command \`Power Tools: Apps\`
* select \`Open App ...\` sub command
* now you can open the app by choosing \`${ HTML_ENCODER.encode(DISPLAY_NAME) }\`

## Credits

The app is powered by [vscode-powertools](https://marketplace.visualstudio.com/items?itemName=egodigital.vscode-powertools), created by [e.GO Digital](https://e-go-digital.com/).`,
        'utf8'
    );

    // .egoignore
    const EGO_IGNORE = path.resolve(
        path.join(
            APP_DIR, ego_contracts.IGNORE_FILE
        )
    );
    await fsExtra.writeFile(
        EGO_IGNORE,
        `# define one or more glob patterns of files
# which should be ignored
# when creating a package

**/*.map
`,
        'utf8'
    );

    raiseInstalledAppListUpdated();

    // open app folder
    await opn(
        APP_DIR,
        {
            wait: false
        }
    );
}

/**
 * Returns the list of installed apps.
 *
 * @return {Promise<ego_contracts.InstalledApp[]>} The promise with the list of installed apps.
 */
export async function getInstalledApps(): Promise<ego_contracts.InstalledApp[]> {
    const APPS: ego_contracts.InstalledApp[] = [];

    const DIR_WITH_APPS = ego_helpers.getAppsDir();

    if (await ego_helpers.isDirectory(DIR_WITH_APPS, false)) {
        for (const ITEM of await fsExtra.readdir(DIR_WITH_APPS)) {
            try {
                const APP_FULL_PATH = path.resolve(
                    path.join(
                        DIR_WITH_APPS, ITEM
                    )
                );

                if (!(await ego_helpers.isDirectory(APP_FULL_PATH, false))) {
                    continue;
                }

                const INDEX_JS = path.resolve(
                    path.join(
                        APP_FULL_PATH, ego_contracts.GLOBAL_APP_ENTRY
                    )
                );

                if (await ego_helpers.isFile(INDEX_JS, false)) {
                    APPS.push({
                        loadIgnoreFile: async () => {
                            const EGO_IGNORE = path.resolve(
                                path.join(
                                    APP_FULL_PATH, ego_contracts.IGNORE_FILE
                                )
                            );
                            if (await ego_helpers.exists(EGO_IGNORE)) {
                                return ego_helpers.from(
                                    (await fsExtra.readFile(
                                        EGO_IGNORE, 'utf8'
                                    )).split('\n')
                                ).select(x => x.trim())
                                 .where(x => '' !== x)
                                 .where(x => !x.startsWith('#'))
                                 .toArray();
                            }

                            return false;
                        },
                        loadIcon: async () => {
                            const EXTENSIONS = [ 'png', 'gif', 'jpg', 'jpeg' ];
                            for (const EXT of EXTENSIONS) {
                                try {
                                    const ICON_PATH = path.resolve(
                                        path.join(
                                            APP_FULL_PATH, `icon.${ EXT }`
                                        )
                                    );

                                    const ICON_STAT = await fsExtra.stat(ICON_PATH);
                                    if (ICON_STAT.isFile() && ICON_STAT.size > 0) {
                                        const MIME_TYPE = mimeTypes.lookup(ICON_PATH);
                                        if (false !== MIME_TYPE) {
                                            const ICON_DATA = await fsExtra.readFile(
                                                ICON_PATH
                                            );

                                            return `data:${ MIME_TYPE };base64,${ ICON_DATA.toString('base64') }`;
                                        }
                                    }
                                } catch { }
                            }

                            return false;
                        },
                        loadPackageJSON: async function() {
                            const PACKAGE_JSON = path.resolve(
                                path.join(
                                    APP_FULL_PATH, 'package.json'
                                )
                            );
                            if (await ego_helpers.isFile(PACKAGE_JSON, false)) {
                                return JSON.parse(
                                    await fsExtra.readFile(
                                        PACKAGE_JSON,
                                        'utf8'
                                    )
                                );
                            }

                            return false;
                        },
                        loadREADME: async function() {
                            const README = path.resolve(
                                path.join(
                                    APP_FULL_PATH, 'README.md'
                                )
                            );
                            if (await ego_helpers.isFile(README, false)) {
                                return await fsExtra.readFile(
                                    README,
                                    'utf8'
                                );
                            }

                            return false;
                        },
                        path: APP_FULL_PATH
                    });
                }
            } catch { }
        }
    }

    return APPS;
}

/**
 * Installs an app.
 */
export async function installApp() {
    const APP_FILE = await vscode.window.showOpenDialog({
        filters: {
            'Package files (*.ego-app)': [ 'ego-app' ],
            'All files (*.*)': [ '*' ]
        },
        canSelectFolders: false,
        canSelectFiles: true,
        canSelectMany: false,
        openLabel: 'Select package file with app ...',
    });

    if (!APP_FILE || APP_FILE.length < 1) {
        return;
    }

    await installAppFromFile(
        APP_FILE[0].fsPath
    );
}

/**
 * Installs an app from a file.
 *
 * @param {string|Buffer} file The package file.
 */
export async function installAppFromFile(
    file: string | Buffer
) {
    if (!Buffer.isBuffer(file)) {
        file = await fsExtra.readFile(
            ego_helpers.toStringSafe(file)
        );
    }

    const ZIP_FILE = zip(file, {
        base64: false,
        checkCRC32: false,
    });

    if (!ZIP_FILE.files || !ZIP_FILE.files['package.json']) {
        vscode.window.showWarningMessage(
            `'package.json' files is missing!`
        );

        return;
    }

    const PACKAGE_JSON: ego_contracts.AppPackageJSON = JSON.parse(
        ZIP_FILE.files['package.json']
            .asNodeBuffer()
            .toString('utf8')
    );

    const NAME = sanitizeFilename(
        ego_helpers.normalizeString(PACKAGE_JSON.name)
    );
    if ('' === NAME) {
        vscode.window.showWarningMessage(
            `Not enough information to install the app!`
        );

        return;
    }

    const APP_DIR = path.resolve(
        path.join(
            ego_helpers.getAppsDir(),
            NAME,
        )
    );

    let installApp = true;
    if (await ego_helpers.exists(APP_DIR)) {
        const YES_OR_NO = await vscode.window.showWarningMessage(
            `App '${ NAME }' is already installed. Do you want to upgrade it?`,
            'Yes', 'No!'
        );

        installApp = 'Yes' === YES_OR_NO;
    }

    if (!installApp) {
        return;
    }

    await vscode.window.withProgress({
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
    }, async (progress) => {
        progress.report({
            message: `Installing app '${ NAME }' ...`,
        });

        if (!(await ego_helpers.exists(APP_DIR))) {
            await fsExtra.mkdirs(APP_DIR);
        }

        const APP_DIR_ITEMS = await fsExtra.readdir(APP_DIR);
        if (APP_DIR_ITEMS.length > 0) {
            // cleanup directory

            progress.report({
                message: `Remove old files of app '${ NAME }' ...`,
            });

            for (const ITEM of APP_DIR_ITEMS) {
                if (ITEM.startsWith('.')) {
                    continue;
                }

                progress.report({
                    message: `Removing '${ ITEM }' of app '${ NAME }' ...`,
                });

                const FULL_ITEM_PATH = path.resolve(
                    path.join(
                        APP_DIR, ITEM
                    )
                );

                const STAT = await fsExtra.lstat(FULL_ITEM_PATH);
                if (STAT.isDirectory()) {
                    await fsExtra.remove(FULL_ITEM_PATH);
                } else {
                    await fsExtra.unlink(FULL_ITEM_PATH);
                }
            }
        }

        progress.report({
            message: `Extracting files of app '${ NAME }' ...`,
        });

        for (const FILE in ZIP_FILE.files) {
            const ENTRY = ZIP_FILE.files[FILE];

            let filePath = ego_helpers.toStringSafe(
                FILE
            ).trim();
            if ('' === filePath) {
                continue;
            }

            while (filePath.startsWith('/')) {
                filePath = filePath.substr(1)
                    .trim();
            }

            let isDir = filePath.endsWith('/');
            while (filePath.endsWith('/')) {
                filePath = filePath.substr(0, filePath.length - 1)
                    .trim();
            }

            const TARGET_PATH = path.resolve(
                path.join(APP_DIR, filePath)
            );
            if (!TARGET_PATH.startsWith(APP_DIR + path.sep)) {
                continue;
            }

            progress.report({
                message: `Extracting '${ filePath }' of app '${ NAME }' ...`,
            });

            if (isDir) {
                await fsExtra.mkdirs(TARGET_PATH);
            } else {
                const TARGET_DIR = path.dirname(
                    TARGET_PATH
                );
                if (!(await ego_helpers.exists(TARGET_DIR))) {
                    await fsExtra.mkdirs(TARGET_DIR);
                }

                await fsExtra.writeFile(
                    TARGET_PATH,
                    ENTRY.asNodeBuffer(),
                );
            }
        }
    });

    raiseInstalledAppListUpdated();

    vscode.window.showInformationMessage(
        `App '${ NAME }' has been installed.`,
    );
}

/**
 * Loads all apps from the home directory.
 *
 * @param {vscode.ExtensionContext} extension The underlying extension context.
 * @param {vscode.OutputChannel} output The output channel.
 *
 * @return {Promise<AppWebView[]>} The promise with the loaded apps.
 */
export async function loadApps(
    extension: vscode.ExtensionContext,
    output: vscode.OutputChannel
): Promise<AppWebView[]> {
    const APPS: AppWebView[] = [];

    try {
        const DIR_WITH_APPS = ego_helpers.getAppsDir();

        if (await ego_helpers.isDirectory(DIR_WITH_APPS)) {
            for (const APP_DIR of await fsExtra.readdir(DIR_WITH_APPS)) {
                try {
                    const FULL_APP_DIR_PATH = path.resolve(
                        path.join(DIR_WITH_APPS, APP_DIR)
                    );

                    if (!(await ego_helpers.isDirectory(FULL_APP_DIR_PATH, false))) {
                        continue;  // no directory or not found
                    }

                    const INDEX_JS = path.resolve(
                        path.join(FULL_APP_DIR_PATH, ego_contracts.GLOBAL_APP_ENTRY)
                    );
                    if (!(await ego_helpers.isFile(INDEX_JS, false))) {
                        continue;  // no file or not found
                    }

                    APPS.push(
                        new AppWebView(
                            extension,
                            output,
                            INDEX_JS,
                        )
                    );
                } catch (e) {
                    ego_log.CONSOLE
                           .trace(e, 'apps.loadApps(2)');
                }
            }
        }
    } catch (e) {
        ego_log.CONSOLE
               .trace(e, 'apps.loadApps(1)');
    }

    return APPS;
}

/**
 * Opens an app.
 *
 * @param {vscode.ExtensionContext} extension The underlying extension context.
 * @param {vscode.OutputChannel} output The output channel.
 */
export async function openApp(
    extension: vscode.ExtensionContext,
    output: vscode.OutputChannel
) {
    const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = [];

    // "global" apps from home directory
    const GLOBAL_APPS = await loadApps(
        extension, output
    );
    GLOBAL_APPS.forEach(a => {
        QUICK_PICKS.push({
            action: async () => {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    cancellable: false,
                }, async (progress) => {
                    progress.report({
                        message: `Opening app '${ a.displayName }' ...`,
                    });

                    if (a.packageJSON) {
                        if (a.packageJSON.dependencies || a.packageJSON.devDependencies) {
                            const NODE_MODULES = path.resolve(
                                path.join(
                                    path.dirname(a.scriptFile), 'node_modules'
                                )
                            );

                            if (!(await ego_helpers.exists(NODE_MODULES))) {
                                progress.report({
                                    message: `Installing dependencies for app '${ a.displayName }' ...`,
                                });

                                const CWD = path.resolve(
                                    path.dirname(a.scriptFile)
                                );

                                // run 'npm install'
                                await (() => {
                                    return new Promise<void>((resolve, reject) => {
                                        try {
                                            childProcess.exec('npm install', {
                                                cwd: CWD,
                                            }, (err) => {
                                                if (err) {
                                                    reject(err);
                                                } else {
                                                    resolve();
                                                }
                                            });
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                })();
                            }
                        }
                    }
                });

                await a.initialize();
                return await a.open();
            },
            description: a.description,
            detail: a.scriptFile,
            label: a.displayName,
        });
    });

    // workspace apps
    const WORKSPACE_APPS = ego_helpers.from(
        ego_workspace.getAllWorkspaces()
    ).selectMany(ws => {
        return ego_helpers.from(
            ws.getApps()
        ).select(a => {
            return {
                app: a,
                workspace: ws,
            };
        });
    }).toArray();
    WORKSPACE_APPS.forEach(x => {
        QUICK_PICKS.push({
            action: () => {
                return x.app
                    .open();
            },
            description: x.app.description,
            detail: x.workspace.rootPath,
            label: x.app.name,
        });
    });

    const SELECTED_ITEM = await vscode.window.showQuickPick(
        ego_helpers.from(
            QUICK_PICKS
        ).orderBy(x => {
            return ego_helpers.normalizeString(x.label);
        }).thenBy(x => {
            return ego_helpers.normalizeString(x.description);
        }).thenBy(x => {
            return ego_helpers.normalizeString(x.detail);
        }).pipe(x => {
            x.label = `$(zap)  ${ x.label }`;
        }).toArray()
    );

    if (SELECTED_ITEM) {
        await Promise.resolve(
            SELECTED_ITEM.action()
        );
    }
}

/**
 * Raises the event when list of installed apps have been updated.
 */
export function raiseInstalledAppListUpdated() {
    ego_helpers.EVENTS
               .emit(ego_contracts.EVENT_APP_LIST_UPDATED);
}
