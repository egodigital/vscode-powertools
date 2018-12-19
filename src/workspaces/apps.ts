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
import * as ego_contracts from '../contracts';
import * as ego_helpers from '../helpers';
import * as ego_webview from '../webview';
import * as ego_workspace from '../workspace';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';


type EventFunction<TResult = any> = (args: ego_contracts.AppEventScriptArguments) => TResult;


/**
 * Name of the key for storing app instances.
 */
export const KEY_APPS = 'apps';


/**
 * A webview for a custom app.
 */
export class AppWebView extends ego_webview.WebViewBase {
    /**
     * Initializes a new instance of that class.
     *
     * @param {ego_workspace.Workspace} workspace The underlying workspace.
     * @param {ego_contracts.AppItem} item The item from the settings.
     */
    public constructor(
        public readonly workspace: ego_workspace.Workspace,
        public readonly item: ego_contracts.AppItem,
    ) {
        super();

        const SCRIPT_PATH = workspace.replaceValues(
            item.script
        );

        const FULL_SCRIPT_PATH = workspace.getExistingFullPath(
            SCRIPT_PATH
        );

        if (false === FULL_SCRIPT_PATH) {
            throw new Error(`Script '${ SCRIPT_PATH }' not found!`);
        }

        this.module = ego_helpers.loadModule<ego_contracts.AppModule>(
            FULL_SCRIPT_PATH
        );
        this.scriptFile = FULL_SCRIPT_PATH;
    }

    private createScriptArguments(
        eventName: string,
        data?: any,
    ): ego_contracts.AppEventScriptArguments {
        const ME = this;

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
            logger: this.workspace.logger,
            options: ego_helpers.cloneObject(this.item.options),
            output: this.workspace.output,
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
                return this.workspace.replaceValues(val);
            },
            require: (id) => {
                return ego_helpers.requireModule(id);
            }
        };
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

    private getEventFunction(funcProvider: (m: ego_contracts.AppModule) => EventFunction): EventFunction {
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
        // '.vscode' sub folder inside workspace
        URIs.unshift(
            vscode.Uri.file(path.resolve(
                path.join(this.workspace.rootPath, './vscode')
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
     * Stores the underlying module.
     */
    public readonly module: ego_contracts.AppModule;

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
     * The full path to the script file.
     */
    public readonly scriptFile: string;
}


/**
 * Disposes all workspace apps.
 */
export async function disposeApps() {
    const WORKSPACE: ego_workspace.Workspace = this;

    const COMMAND_LIST: ego_contracts.WorkspaceApp[] = WORKSPACE.instanceState[
        KEY_APPS
    ];
    while (COMMAND_LIST.length > 0) {
        const CMD = COMMAND_LIST.pop();

        ego_helpers.tryDispose(CMD);
    }
}

/**
 * Reloads all workspace apps.
 */
export async function reloadApps() {
    const WORKSPACE: ego_workspace.Workspace = this;
    if (WORKSPACE.isInFinalizeState) {
        return;
    }
    if (!WORKSPACE.isInitialized) {
        return;
    }

    const SETTINGS = WORKSPACE.settings;
    if (!SETTINGS) {
        return;
    }

    disposeApps.apply(
        this
    );

    const APP_ENTRIES = ego_helpers.asArray(
        SETTINGS.apps
    );

    if (APP_ENTRIES.length < 1) {
        return;
    }

    const APP_LIST: ego_contracts.WorkspaceApp[] = WORKSPACE.instanceState[
        KEY_APPS
    ];

    APP_ENTRIES.forEach(entry => {
        let item: ego_contracts.AppItem;
        if (_.isObjectLike(entry)) {
            item = <ego_contracts.AppItem>entry;
        } else {
            item = {
                script: ego_helpers.toStringSafe(entry),
            };
        }

        if (!ego_helpers.doesMatchPlatformCondition(item)) {
            return;
        }
        if (!ego_helpers.doesMatchFilterCondition(item)) {
            return;
        }

        let name = ego_helpers.toStringSafe(
            item.name
        ).trim();
        if ('' === name) {
            name = item.script;
        }

        let description = ego_helpers.toStringSafe(
            item.description
        ).trim();
        if ('' === description) {
            description = undefined;
        }

        let view: AppWebView;
        let newApp: ego_contracts.WorkspaceApp = {
            description: undefined,
            detail: undefined,
            dispose: function() {
                const VIEW = view;
                if (VIEW) {
                    VIEW.dispose();
                }

                view = null;
            },
            name: undefined,
            open: async function() {
                if (view) {
                    return false;
                }

                const NEW_VIEW = new AppWebView(
                    WORKSPACE,
                    item
                );

                if (!(await NEW_VIEW.open())) {
                    return false;
                }

                return NEW_VIEW;
            },
            view: undefined,
        };

        // newApp.description
        Object.defineProperty(newApp, 'description', {
            enumerable: true,
            get: () => {
                const DESCRIPTION = WORKSPACE.replaceValues(
                    description
                ).trim();

                return '' !== DESCRIPTION ? DESCRIPTION
                                          : undefined;
            }
        });

        // newApp.detail
        Object.defineProperty(newApp, 'detail', {
            enumerable: true,
            get: () => {
                let detail = WORKSPACE.getExistingFullPath(
                    item.script
                );
                if (false === detail) {
                    detail = ego_helpers.toStringSafe(
                        item.script
                    );
                }

                return detail;
            }
        });

        // newApp.name
        Object.defineProperty(newApp, 'name', {
            enumerable: true,
            get: () => {
                const NAME = WORKSPACE.replaceValues(
                    name
                ).trim();

                return '' !== NAME ? NAME
                                   : undefined;
            }
        });

        // newApp.view
        Object.defineProperty(newApp, 'view', {
            get: () => {
                return view;
            }
        });

        if (newApp) {
            APP_LIST.push(
                newApp
            );
        }
    });
}
