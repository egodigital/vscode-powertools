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
import * as ego_apps from '../apps';
import * as ego_contracts from '../contracts';
import * as ego_helpers from '../helpers';
import * as ego_webview from '../webview';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';


interface UninstallAppData {
    name: string;
    source: string;
}


 /**
  * A web view for an app store.
  */
export class AppStoreWebView extends ego_webview.WebViewWithContextBase {
    private _onAppListUpdatedEventFunction: (...args: any[]) => void;

    /**
     * @inheritdoc
     */
    protected generateHtmlBody(): string {
        const FILE = this.getFileResourceUri('tpl/AppStore.ejs')
            .fsPath;

        return ejs.render(
            fsExtra.readFileSync(
                FILE, 'utf8'
            )
        );
    }

    /**
     * @inheritdoc
     */
    protected getTitle(): string {
        return `App Store for 'vscode-powettools'`;
    }

    /**
     * @inheritdoc
     */
    protected getType(): string {
        return `AppStore`;
    }

    private onAppListUpdated() {
        this.postMessage(
            'appListUpdated'
        );
    }

    /**
     * @inheritdoc
     */
    protected onDispose() {
        this.unsetOnAppListUpdatedEventFunction();

        super.onDispose();
    }

    /**
     * @inheritdoc
     */
    protected async onWebViewMessage(msg: ego_contracts.WebViewMessage): Promise<boolean> {
        switch (msg.command) {
            case 'installApp':
                {
                    let err: any;
                    try {
                        const APP_URL = ego_helpers.toStringSafe(msg.data.source)
                            .trim();
                        if (APP_URL.toLowerCase().startsWith('https://') || APP_URL.toLowerCase().startsWith('http://')) {
                            let app: Buffer;
                            await vscode.window.withProgress({
                                location: vscode.ProgressLocation.Notification,
                            }, async (progress) => {
                                progress.report({
                                    message: `Download app from '${ APP_URL }' ...`,
                                });

                                const RESPONSE = await ego_helpers.GET(APP_URL);
                                if (RESPONSE.code < 200 || RESPONSE.code >= 300) {
                                    throw new Error(`Unexpected response: [${ RESPONSE.code }] '${ RESPONSE.status }'`);
                                }

                                app = await RESPONSE.readBody();
                            });

                            await ego_apps.installAppFromFile(
                                app
                            );
                        }
                    } catch (e) {
                        err = ego_helpers.errorToString(e);
                    }

                    await this.postMessage('appInstalled', {
                        success: _.isNil(err),
                        app: msg.data,
                        error: err,
                    });
                }
                break;

            case 'reloadApps':
                try {
                    const APPS: any[] = [];

                    // installed apps
                    const INSTALLED_APPS = await ego_apps.getInstalledApps();
                    for (const IA of INSTALLED_APPS) {
                        try {
                            let name: string;
                            let displayName: string;
                            let description: string;
                            let details: string;
                            let icon: string;

                            try {
                                const PACKAGE_JSON = await IA.loadPackageJSON();
                                if (PACKAGE_JSON) {
                                    name = PACKAGE_JSON.name;
                                    description = PACKAGE_JSON.description;
                                    displayName = PACKAGE_JSON.displayName;
                                }
                            } catch { }

                            try {
                                const README = await IA.loadREADME();
                                if (false !== README) {
                                    details = README;
                                }
                            } catch { }

                            try {
                                const ICON = await IA.loadIcon();
                                if (false !== ICON) {
                                    icon = ICON;
                                }
                            } catch { }

                            if (ego_helpers.isEmptyString(name)) {
                                name = path.basename(
                                    path.dirname(IA.path)
                                );
                            }

                            if (ego_helpers.isEmptyString(displayName)) {
                                displayName = name;
                            }

                            if (ego_helpers.isEmptyString(description)) {
                                description = undefined;
                            }

                            if (ego_helpers.isEmptyString(details)) {
                                details = undefined;
                            }

                            if (ego_helpers.isEmptyString(icon)) {
                                icon = undefined;
                            }

                            APPS.push({
                                'name': name,
                                'displayName': displayName,
                                'description': description,
                                'details': details,
                                'icon': icon,
                                'isInstalled': true,
                                'source': path.basename(IA.path),
                            });
                        } catch { }
                    }

                    // store apps
                    try {
                        let appStoreUrl = ego_helpers.toStringSafe(
                            this.extension
                                .globalState
                                .get(ego_contracts.KEY_GLOBAL_SETTING_APP_STORE_URL)
                        ).trim();
                        if ('' !== appStoreUrl) {
                            if (!appStoreUrl.toLowerCase().startsWith('https://') && !appStoreUrl.toLowerCase().startsWith('http://')) {
                                appStoreUrl = 'http://' + appStoreUrl;
                            }

                            await vscode.window.withProgress({
                                location: vscode.ProgressLocation.Notification,
                            }, async (progress) => {
                                progress.report({
                                    message: `Loading app store from ${ appStoreUrl } ...`,
                                });

                                const RESPONSE = await ego_helpers.GET(appStoreUrl);
                                if (RESPONSE.code < 200 || RESPONSE.code >= 300) {
                                    throw new Error(`Unexpected response: [${ RESPONSE.code }] '${ RESPONSE.status }'`);
                                }

                                const APP_STORE: ego_contracts.AppStore = JSON.parse(
                                    (await RESPONSE.readBody()).toString('utf8')
                                );
                                if (_.isObjectLike(APP_STORE)) {
                                    const APPS_FROM_STORE = ego_helpers.asArray(
                                        APP_STORE.apps
                                    );

                                    for (const A of APPS_FROM_STORE) {
                                        try {
                                            let name = ego_helpers.normalizeString(A.name);
                                            if ('' === name) {
                                                continue;
                                            }

                                            let source = ego_helpers.toStringSafe(A.source)
                                                .trim();
                                            if ('' === source) {
                                                continue;
                                            }

                                            if (!source.toLowerCase().startsWith('https://') && !source.toLowerCase().startsWith('http://')) {
                                                source = 'http://' + source;
                                            }

                                            let displayName = ego_helpers.toStringSafe(
                                                A.displayName
                                            ).trim();
                                            if ('' === displayName) {
                                                displayName = name;
                                            }

                                            let description = ego_helpers.toStringSafe(
                                                A.description
                                            ).trim();
                                            if ('' === description) {
                                                description = undefined;
                                            }

                                            let icon = ego_helpers.toStringSafe(
                                                A.icon
                                            ).trim();
                                            if ('' === icon) {
                                                icon = undefined;
                                            }

                                            APPS.push({
                                                'name': name,
                                                'displayName': displayName,
                                                'description': description,
                                                'details': undefined,
                                                'icon': icon,
                                                'isInstalled': false,
                                                'source': source,
                                            });
                                        } catch { }
                                    }
                                }
                            });
                        }
                    } catch { }

                    await this.postMessage(
                        'appsLoaded',
                        {
                            'success': true,
                            'apps': ego_helpers.from(APPS)
                                .orderBy(x => ego_helpers.normalizeString(x.displayName))
                                .thenBy(x => ego_helpers.normalizeString(x.name))
                                .thenBy(x => ego_helpers.normalizeString(x.source))
                                .toArray(),
                        }
                    );
                } catch (e) {
                    await this.postMessage(
                        'appsLoaded',
                        {
                            'success': false,
                            'error': ego_helpers.toStringSafe(e),
                        }
                    );
                }
                break;

            case 'uninstallApp':
                {
                    const APP_TO_UNINSTALL: UninstallAppData = msg.data;
                    if (_.isObjectLike(APP_TO_UNINSTALL)) {
                        if (!ego_helpers.isEmptyString(APP_TO_UNINSTALL.source)) {
                            const DIRS_WITH_APPS = ego_helpers.getAppsDir();

                            const APP_DIR = path.resolve(
                                path.join(
                                    DIRS_WITH_APPS,
                                    ego_helpers.toStringSafe(APP_TO_UNINSTALL.source),
                                )
                            );

                            if (await ego_helpers.isDirectory(APP_DIR)) {
                                if (APP_DIR.startsWith(DIRS_WITH_APPS + path.sep)) {
                                    let err: any;
                                    try {
                                        await fsExtra.remove(
                                            APP_DIR
                                        );

                                        vscode.window.showInformationMessage(
                                            `App '${ ego_helpers.toStringSafe(APP_TO_UNINSTALL.name) }' has been uninstalled.`
                                        );
                                    } catch (e) {
                                        err = e;

                                        vscode.window.showErrorMessage(
                                            `Could not uninstall app '${ ego_helpers.toStringSafe(APP_TO_UNINSTALL.name) }': '${ ego_helpers.toStringSafe(e) }'`
                                        );
                                    }

                                    await this.postMessage(
                                        'appUninstalled',
                                        {
                                            'success': _.isNil(err),
                                            'app': APP_TO_UNINSTALL,
                                        }
                                    );
                                }
                            } else {
                                vscode.window.showWarningMessage(
                                    `Directory for app '${ ego_helpers.toStringSafe(APP_TO_UNINSTALL.name) }' not found!`
                                );
                            }
                        }
                    }
                }
                break;

            default:
                return false;
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    public async open() {
        this.unsetOnAppListUpdatedEventFunction();

        this._onAppListUpdatedEventFunction = () => {
            this.onAppListUpdated();
        };

        ego_helpers.EVENTS
                   .on(ego_contracts.EVENT_APP_LIST_UPDATED,
                       this._onAppListUpdatedEventFunction);

        return await super.open();
    }

    private unsetOnAppListUpdatedEventFunction() {
        ego_helpers.tryRemoveListener(
            ego_helpers.EVENTS,
            ego_contracts.EVENT_APP_LIST_UPDATED,
            this._onAppListUpdatedEventFunction
        );

        this._onAppListUpdatedEventFunction = null;
    }
}


/**
 * Opens the app store.
 *
 * @param {vscode.ExtensionContext} extension The extension context.
 */
export async function openAppStore(extension: vscode.ExtensionContext) {
    const APP_STORE = new AppStoreWebView(extension);

    return await APP_STORE.open();
}
