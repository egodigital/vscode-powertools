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
import * as ego_workspace from './workspace';
import * as ego_webview from './webview';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';
import * as htmlEntities from 'html-entities';
const opn = require('opn');
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';


/**
 * Name of the key for storing app instances.
 */
export const KEY_APPS = 'apps';
const REGEX_APP_NAME = /^([a-z])([a-z|0-9|\_|\-]{0,})$/gm;


/**
 * A webview for a custom (workspace) app.
 */
export abstract class AppWebViewBase extends ego_webview.WebViewBase {
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
            vscode.Uri.file(path.resolve(
                path.join(os.homedir(), ego_contracts.HOMEDIR_SUBFOLDER)
            ))
        );

        return URIs;
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
     * Get the full path of the script file.
     */
    public abstract get scriptFile(): string;
}

/**
 * A web view for an app.
 */
export class AppWebView extends AppWebViewBase {
    private _module: ego_contracts.AppModule;

    /**
     * Initializes a new instance of that class.
     *
     * @param {vscode.OutputChannel} output The output channel.
     * @param {string} scriptFile The path to the script file.
     */
    public constructor(
        public readonly output: vscode.OutputChannel,
        public readonly scriptFile: string,
    ) {
        super();

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
            data: data,
            event: eventName,
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
                return ego_helpers.toStringSafe(
                    val
                );
            },
            require: (id) => {
                return ego_helpers.requireModule(id);
            },
            workspaces: undefined,
        };

        // ARGS.workspaces
        Object.defineProperty(ARGS, 'workspaces', {
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
 * Creates a (new) app.
 */
export async function createApp() {
    const NAME = ego_helpers.normalizeString(
        await vscode.window.showInputBox({
            placeHolder: 'Enter the name of your new app here ...',
            prompt: 'App Name',
            validateInput: (value) => {
                value = ego_helpers.normalizeString(value);
                if (!REGEX_APP_NAME.test(value)) {
                    return 'Please start with a letter and use the following chars only: [a-z, 0-9, -, _]!';
                }

                const APP_DIR = path.resolve(
                    path.join(
                        os.homedir(),
                        ego_contracts.HOMEDIR_SUBFOLDER,
                        '.apps',
                        value
                    )
                );
                if (fsExtra.existsSync(APP_DIR)) {
                    return `An app with the name '${ value }' seams already exist!`;
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
            os.homedir(),
            ego_contracts.HOMEDIR_SUBFOLDER,
            '.apps',
            NAME
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

    // index.ejs
    const INDEX_EJS = path.resolve(
        path.join(
            APP_DIR, 'index.ejs'
        )
    );
    await fsExtra.writeFile(
        INDEX_EJS,
        `<!--

${ new htmlEntities.AllHtmlEntities().encode(
    MIT_HEADER.join('\n')
) }

-->

<div class="container">
  <h1><%= page_title %></h1>
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
    // TODO
}

/**
 * This is called, after the
 * page has been completely loaded.
 */
function ego_on_loaded() {
    // TODO
}

</script>
`,
        'utf8'
    );

    // index.js
    const INDEX_JS = path.resolve(
        path.join(
            APP_DIR, 'index.js'
        )
    );
    await fsExtra.writeFile(
        INDEX_JS,
        `${ MIT_HEADER.map(l => ('// ' + l).trim()).join('\n') }

/**
 * Is invoked on an event.
 */
exports.onEvent = async (args) => {
    switch (args.event) {
        case 'on.command':
            // is invoked, when the web view has
            // been post a (command) message
            //
            // args.data.command => (string) The name of the command.
            // args.data.data    => (any) The data of the command.
            break;

        case 'on.loaded':
            // page inside web view has been completely loaded
            break;
    }
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
        'index.ejs',
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

    // open app folder
    await opn(
        APP_DIR,
        {
            wait: false
        }
    );
}

/**
 * Loads all apps from the home directory.
 *
 * @param {vscode.OutputChannel} output The output channel.
 *
 * @return {Promise<AppWebView[]>} The promise with the loaded apps.
 */
export async function loadApps(
    output: vscode.OutputChannel
): Promise<AppWebView[]> {
    const APPS: AppWebView[] = [];

    const DIR_WITH_APPS = path.resolve(
        path.join(
            os.homedir(),
            ego_contracts.HOMEDIR_SUBFOLDER,
            '.apps'
        )
    );

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
                    path.join(FULL_APP_DIR_PATH, 'index.js')
                );
                if (!(await ego_helpers.isFile(INDEX_JS, false))) {
                    continue;  // no file or not found
                }

                APPS.push(
                    new AppWebView(
                        output,
                        INDEX_JS,
                    )
                );
            } catch (e) {
                ego_log.CONSOLE
                       .trace(e, 'apps.loadApps(1)');
            }
        }
    }

    return APPS;
}

/**
 * Opens an app.
 *
 * @param {vscode.OutputChannel} output The output channel.
 */
export async function openApp(
    output: vscode.OutputChannel
) {
    const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = [];

    // "global" apps from home directory
    const GLOBAL_APPS = await loadApps(
        output
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
