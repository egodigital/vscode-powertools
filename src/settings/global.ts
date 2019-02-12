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
import * as ego_log from '../log';
import * as ego_webview from '../webview';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';
import * as vscode from 'vscode';


interface SettingsFromWebView {
    appStoreUrl: string;
    globalAzureDevOpsOrg: string;
    globalAzureDevOpsPAT: string;
    globalAzureDevOpsUsername: string;
    openChangelogOnStartup: boolean;
    workspaceAzureDevOpsOrg: string;
    workspaceAzureDevOpsPAT: string;
    workspaceAzureDevOpsUsername: string;
}

interface SettingsForWebView extends SettingsFromWebView {
}


/**
 * A web view for global settings.
 */
export class GlobalSettingsWebView extends ego_webview.WebViewWithContextBase {
    /**
     * Initializes a new instance of that class.
     *
     * @param {vscode.ExtensionContext} extension The extension context.
     * @param {string} [initialSection] The initial section.
     */
    public constructor(
        public readonly extension: vscode.ExtensionContext,
        public readonly initialSection?: string,
    ) {
        super(extension);
    }

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
    protected async onLoaded() {
        try {
            const INITIAL_SECTION = ego_helpers.toStringSafe(
                this.initialSection
            ).trim();

            if ('' !== INITIAL_SECTION) {
                await this.postMessage(
                    'selectSection',
                    INITIAL_SECTION,
                );
            }
        } catch (e) {
            ego_log.CONSOLE
                .trace(e, 'settings.global.GlobalSettingsWebView.onLoaded(1)');
        }
    }

    /**
     * @inheritdoc
     */
    protected async onWebViewMessage(msg: ego_contracts.WebViewMessage): Promise<boolean> {
        switch (msg.command) {
            case 'reloadSettings':
                {
                    let err: any;
                    let settings: SettingsForWebView;
                    try {
                        settings = {
                            appStoreUrl: ego_helpers.toStringSafe(
                                this.extension
                                    .globalState
                                    .get(ego_contracts.KEY_GLOBAL_SETTING_APP_STORE_URL)
                            ).trim(),
                            globalAzureDevOpsOrg: ego_helpers.toStringSafe(
                                this.extension
                                    .globalState
                                    .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_GLOBAL_ORG)
                            ).trim(),
                            globalAzureDevOpsPAT: ego_helpers.toStringSafe(
                                this.extension
                                    .globalState
                                    .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_GLOBAL_PAT)
                            ).trim(),
                            globalAzureDevOpsUsername: ego_helpers.toStringSafe(
                                this.extension
                                    .globalState
                                    .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_GLOBAL_USERNAME)
                            ).trim(),
                            openChangelogOnStartup: ego_helpers.toBooleanSafe(
                                this.extension
                                    .globalState
                                    .get(ego_contracts.KEY_GLOBAL_SETTING_OPEN_CHANGELOG_ON_STARTUP, true),
                                true,
                            ),
                            workspaceAzureDevOpsOrg: ego_helpers.toStringSafe(
                                this.extension
                                    .workspaceState
                                    .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_WORKSPACE_ORG)
                            ).trim(),
                            workspaceAzureDevOpsPAT: ego_helpers.toStringSafe(
                                this.extension
                                    .workspaceState
                                    .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_WORKSPACE_PAT)
                            ).trim(),
                            workspaceAzureDevOpsUsername: ego_helpers.toStringSafe(
                                this.extension
                                    .workspaceState
                                    .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_WORKSPACE_USERNAME)
                            ).trim(),
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

                        let globalAzureDevOpsOrg = ego_helpers.toStringSafe(
                            SETTINGS.globalAzureDevOpsOrg
                        ).trim();
                        let globalAzureDevOpsPAT = ego_helpers.toStringSafe(
                            SETTINGS.globalAzureDevOpsPAT
                        ).trim();
                        let globalAzureDevOpsUsername = ego_helpers.toStringSafe(
                            SETTINGS.globalAzureDevOpsUsername
                        ).trim();
                        if ('' === globalAzureDevOpsOrg) {
                            globalAzureDevOpsOrg = undefined;
                        }
                        if ('' === globalAzureDevOpsPAT) {
                            globalAzureDevOpsPAT = undefined;
                        }
                        if ('' === globalAzureDevOpsUsername) {
                            globalAzureDevOpsUsername = undefined;
                        }

                        let workspaceAzureDevOpsOrg = ego_helpers.toStringSafe(
                            SETTINGS.workspaceAzureDevOpsOrg
                        ).trim();
                        let workspaceAzureDevOpsPAT = ego_helpers.toStringSafe(
                            SETTINGS.workspaceAzureDevOpsPAT
                        ).trim();
                        let workspaceAzureDevOpsUsername = ego_helpers.toStringSafe(
                            SETTINGS.workspaceAzureDevOpsUsername
                        ).trim();
                        if ('' === workspaceAzureDevOpsOrg) {
                            workspaceAzureDevOpsOrg = undefined;
                        }
                        if ('' === workspaceAzureDevOpsPAT) {
                            workspaceAzureDevOpsPAT = undefined;
                        }
                        if ('' === workspaceAzureDevOpsUsername) {
                            workspaceAzureDevOpsUsername = undefined;
                        }

                        const OPEN_CHANGELOG_ON_STARTUP = ego_helpers.toBooleanSafe(
                            SETTINGS.openChangelogOnStartup, true
                        );

                        // app store URL
                        await this.extension
                            .globalState
                            .update(ego_contracts.KEY_GLOBAL_SETTING_APP_STORE_URL, appStoreUrl);
                        // open changelog on startup
                        await this.extension
                            .globalState
                            .update(ego_contracts.KEY_GLOBAL_SETTING_OPEN_CHANGELOG_ON_STARTUP, OPEN_CHANGELOG_ON_STARTUP);

                        // Azure DevOps credentials
                        await this.extension
                            .globalState
                            .update(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_GLOBAL_ORG, globalAzureDevOpsOrg);
                        await this.extension
                            .globalState
                            .update(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_GLOBAL_PAT, globalAzureDevOpsPAT);
                        await this.extension
                            .globalState
                            .update(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_GLOBAL_USERNAME, globalAzureDevOpsUsername);
                        await this.extension
                            .workspaceState
                            .update(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_WORKSPACE_ORG, workspaceAzureDevOpsOrg);
                        await this.extension
                            .workspaceState
                            .update(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_WORKSPACE_PAT, workspaceAzureDevOpsPAT);
                        await this.extension
                            .workspaceState
                            .update(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_WORKSPACE_USERNAME, workspaceAzureDevOpsUsername);
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
 * @param {string} [initialSection] The initial section.
 *
 * @return {Promise<GlobalSettingsWebView>} The web view.
 */
export async function openGlobalSettings(
    extension: vscode.ExtensionContext,
    initialSection?: string,
): Promise<GlobalSettingsWebView> {
    const NEW_VIEW = new GlobalSettingsWebView(
        extension, initialSection
    );
    await NEW_VIEW.open();

    return NEW_VIEW;
}
