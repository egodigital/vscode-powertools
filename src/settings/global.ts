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

import * as ego_webview from '../webview';
import * as vscode from 'vscode';


/**
 * A web view for global settings.
 */
export class GlobalSettingsWebView extends ego_webview.WebViewWithContextBase {
    /**
     * @inheritdoc
     */
    protected generateHtmlBody(): string {
        return `@TODO`;
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
