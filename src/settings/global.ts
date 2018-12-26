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
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';
import * as vscode from 'vscode';


interface SettingsFromWebView {
    appStoreUrl: string;
}


/**
 * A web view for global settings.
 */
export class GlobalSettingsWebView extends ego_webview.WebViewWithContextBase {
    /**
     * @inheritdoc
     */
    protected generateHtmlBody(): string {
        const FILE = this.getFileResourceUri('tpl/GlobalSettings.ejs')
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
        return 'Global Settings';
    }

    /**
     * @inheritdoc
     */
    protected getType(): string {
        return 'GlobalSettings';
    }

    /**
     * @inheritdoc
     */
    protected async onWebViewMessage(msg: ego_contracts.WebViewMessage): Promise<boolean> {
        switch (msg.command) {
            case 'reloadSettings':
                {
                    let err: any;
                    let settings: SettingsFromWebView;
                    try {
                        settings = {
                            appStoreUrl: ego_helpers.toStringSafe(
                                this.extension
                                    .globalState
                                    .get(ego_contracts.KEY_GLOBAL_SETTING_APP_STORE_URL)
                            ).trim()
                        };

                        if ('' === settings.appStoreUrl) {
                            settings.appStoreUrl = undefined;
                        }
                    } catch (e) {
                        err = ego_helpers.errorToString(e);
                        settings = undefined;
                    }

                    await this.postMessage(
                        'settingsReloaded',
                        {
                            success: _.isNil(err),
                            error: err,
                            settings: settings,
                        },
                    );
                }
                break;

            case 'saveSettings':
                {
                    let err: any;
                    try {
                        const SETTINGS: SettingsFromWebView = msg.data;

                        let appStoreUrl = ego_helpers.toStringSafe(
                            SETTINGS.appStoreUrl
                        ).trim();
                        if ('' === appStoreUrl) {
                            appStoreUrl = undefined;
                        }

                        await this.extension
                            .globalState
                            .update(ego_contracts.KEY_GLOBAL_SETTING_APP_STORE_URL, appStoreUrl);
                    } catch (e) {
                        err = ego_helpers.errorToString(e);
                    }

                    await this.postMessage(
                        'settingsSaved',
                        {
                            success: _.isNil(err),
                            error: err,
                        }
                    );
                }
                break;

            default:
                return false;
        }

        return true;
    }
}


/**
 * Opens the web view with the global settings.
 *
 * @param {vscode.ExtensionContext} extension The extension context.
 */
export async function openGlobalSettings(extension: vscode.ExtensionContext) {
    const NEW_VIEW = new GlobalSettingsWebView(extension);
    await NEW_VIEW.open();

    return NEW_VIEW;
}
