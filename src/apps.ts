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
import * as ego_contracts from './contracts';
import * as ego_helpers from './helpers';
import * as ego_log from './log';
import * as ego_webview from './webview';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';


/**
 * Name of the key for storing app instances.
 */
export const KEY_APPS = 'apps';


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

        this.module = ego_helpers.loadModule<ego_contracts.AppModule>(
            scriptFile
        );

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

        return {
            data: data,
            event: eventName,
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
            }
        };
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
    public readonly module: ego_contracts.AppModule;

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
 * Loads all apps from the home directory.
 *
 * @param {vscode.OutputChannel} output The output channel.
 *
 * @return {AppWebView[]} The promise with the loaded apps.
 */
export async function loadApps(
    output: vscode.OutputChannel
) {
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
