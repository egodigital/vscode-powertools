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

import * as deepMerge from 'deepmerge';
import * as ego_contracts from './contracts';
import * as ego_helpers from './helpers';
import * as ego_settings_global from './settings/global';
import * as ego_webview from './webview';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';
import * as vscode from 'vscode';


/**
 * Options for 'MapWebView' class.
 */
export interface MapWebViewOptions {
    /**
     * The API token.
     */
    apiToken: string;
    /**
     * The custom title.
     */
    title?: string;
}


/**
 * A webview for displaying a map.
 */
export class MapWebView extends ego_webview.WebViewWithContextBase {
    /**
     * Initializes a new instance of that class.
     *
     * @param {vscode.ExtensionContext} extension The extension context.
     * @param {MapWebViewOptions} options The options.
     */
    public constructor(
        public readonly extension: vscode.ExtensionContext,
        public readonly options: MapWebViewOptions,
    ) {
        super(extension);
    }

    /**
     * @inheritdoc
     */
    protected generateHtmlBody(): string {
        const FILE = this.getFileResourceUri('tpl/Map.ejs')
            .fsPath;

        let mapBoxAPIToken: string = this.options
            .apiToken;

        if (ego_helpers.isEmptyString(mapBoxAPIToken)) {
            mapBoxAPIToken = null;
        }

        return ejs.render(
            fsExtra.readFileSync(
                FILE, 'utf8'
            ),
            {
                'mapbox_api_token': mapBoxAPIToken,
                'mapbox_css_file': `${ this.getFileResourceUri('css/mapbox-gl.css') }`,
                'mapbox_js_file': `${ this.getFileResourceUri('js/mapbox-gl.js') }`,
            }
        );
    }

    /**
     * @inheritdoc
     */
    protected getTitle(): string {
        let title = ego_helpers.toStringSafe(
            this.options
                .title
        ).trim();
        if ('' === title) {
            title = 'Map';
        }

        return title;
    }

    /**
     * @inheritdoc
     */
    protected getType(): string {
        return 'Map';
    }

    /**
     * @inheritdoc
     */
    protected async onWebViewMessage(msg: ego_contracts.WebViewMessage): Promise<boolean> {
        switch (msg.command) {
            case 'openMapBoxSettings':
                await ego_settings_global.openGlobalSettings(
                    this.extension, 'mapbox'
                );
                break;

            default:
                return false;
        }

        return true;
    }
}


/**
 * Opens a map webview.
 *
 * @param {vscode.ExtensionContext} extension The extension context.
 * @param {MapWebViewOptions} [opts] Custom options.
 *
 * @return Promise<MapWebView> The promise with the new, opened view.
 */
export async function openMapView(
    extension: vscode.ExtensionContext,
    opts?: MapWebViewOptions,
) : Promise<MapWebView> {
    let apiToken: string;

    // first try for workspace
    apiToken = ego_helpers.toStringSafe(
        extension.workspaceState
            .get(ego_contracts.KEY_GLOBAL_SETTING_MAPBOX_API_TOKEN, '')
    ).trim();
    if ('' === apiToken) {
        // now try globally
        apiToken = ego_helpers.toStringSafe(
            extension.globalState
                .get(ego_contracts.KEY_GLOBAL_SETTING_MAPBOX_API_TOKEN, '')
        ).trim();
    }

    opts = deepMerge({
        apiToken: '' === apiToken ? null : apiToken,
    }, opts || {});

    const WEB_VIEW = new MapWebView(extension, opts);
    if (!(await WEB_VIEW.open())) {
        throw new Error('Could not open map webview!');
    }

    return WEB_VIEW;
}
