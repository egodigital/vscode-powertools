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

import * as ego_contracts from './contracts';
import * as ego_helpers from './helpers';
import * as ego_log from './log';
import * as htmlEntities from 'html-entities';
const opn = require('opn');
import * as path from 'path';
import * as url from 'url';
import * as vscode from 'vscode';


/**
 * A basic web view.
 */
export abstract class WebViewBase extends ego_helpers.DisposableBase {
    private _panel: vscode.WebviewPanel;
    /**
     * The underlying queue.
     */
    protected _QUEUE = ego_helpers.createQueue();


    /**
     * Closes the web view.
     *
     * @return {Promise<boolean>} A promise that indicates if operation was successful or not.
     */
    public close() {
        return this._QUEUE.add(async () => {
            if (!this._panel) {
                return false;
            }

            if (ego_helpers.tryDispose(this._panel)) {
                this._panel = null;
                return true;
            }

            return false;
        });
    }

    /**
     * Generate the HTML for the view.
     *
     * @returns {string} The HTML.
     */
    protected generateHtml() {
        return `${ this.generateHtmlHeader() }

${ this.generateHtmlBody() }

${ this.generateHtmlFooter() }`;
    }

    /**
     * Generate the HTML header for the view.
     *
     * @returns {string} The HTML.
     */
    protected abstract generateHtmlBody(): string;

    /**
     * Generate the HTML footer for the view.
     *
     * @returns {string} The HTML footer.
     */
    protected generateHtmlFooter() {
        return `
        </main>

        <!-- Showdown -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/showdown.js') }" crossorigin="anonymous"></script>
        <!-- JQuery -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/jquery-3.3.1.js') }" crossorigin="anonymous"></script>
        <!-- highlight.js -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/highlight.pack.js') }" crossorigin="anonymous"></script>
        <!-- Bootstrap tooltips -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/popper.min.js') }" crossorigin="anonymous"></script>
        <!-- Bootstrap core JavaScript -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/bootstrap.js') }" crossorigin="anonymous"></script>
        <!-- MDB core JavaScript -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/mdb.js') }" crossorigin="anonymous"></script>

        <script type="text/javascript" src="${ this.getFileResourceUri('js/app.js') }" crossorigin="anonymous"></script>
        <script type="text/javascript" src="${ this.getFileResourceUri('js/app.' + this.getType() + '.js') }" crossorigin="anonymous"></script>
    </body>
</html>`;
    }

    /**
     * Generate the HTML header for the view.
     *
     * @returns {string} The HTML header.
     */
    protected generateHtmlHeader() {
        const HTML_ENTITIES = new htmlEntities.AllHtmlEntities();

        return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="x-ua-compatible" content="ie=edge">

    <title>Power Tools by e.GO :: ${ HTML_ENTITIES.encode(this.getTitle()) }</title>

    <!-- Font Awesome -->
    <link href="${ this.getFileResourceUri('css/font-awesome.css') }" rel="stylesheet">
    <!-- highlight.js -->
    <link href="${ this.getFileResourceUri('css/highlight/default.css') }" rel="stylesheet">
    <link href="${ this.getFileResourceUri('css/highlight/mono-blue.css') }" rel="stylesheet">
    <!-- Bootstrap core CSS -->
    <link href="${ this.getFileResourceUri('css/bootstrap.css') }" rel="stylesheet">
    <!-- Material Design Bootstrap -->
    <link href="${ this.getFileResourceUri('css/mdb.css') }" rel="stylesheet">

    <link href="${ this.getFileResourceUri('css/app.css') }" rel="stylesheet">
    <link href="${ this.getFileResourceUri('css/app.' + this.getType() + '.css') }" rel="stylesheet">

    <script>
        const vscode = acquireVsCodeApi();

        function ego_post(command, data) {
            return vscode.postMessage({
                command: command,
                data: data
            });
        }

        function ego_log(msg) {
            try {
                if (msg instanceof Error) {
                    msg = \`ERROR: \${ msg.message }
\${ msg.stack }\`;
                }

                ego_post('log', {
                    message: JSON.stringify({
                        type: 'debug',
                        message: msg,
                    })
                });
            } catch (e) { }
        }

        window.onerror = function(message, url, line, column, error) {
            ego_log({
                type: 'uncatched.error',
                message: message,
                url: url,
                line: line,
                column: column,
                error: error
            });

            return false;
        };
    </script>
</head>

<body>
    <header>
        <!-- Navbar -->
        <nav class="navbar fixed-top navbar-expand-lg navbar-light white scrolling-navbar">
            <div class="container">
                <!-- Brand -->
                <a class="navbar-brand waves-effect" href="https://www.e-go-digital.com/" target="_blank">
                    <img src="${ this.getFileResourceUri('img/ego_digital.svg') }" id="ego-logo">
                </a>

                <div id="ego-social-media-buttons">
                    <a class="btn btn-sm btn-dark ego-social-media-btn" href="https://github.com/egodigital" target="_blank">
                        <i class="fa fa-github" aria-hidden="true"></i>
                    </a>
                </div>
            </div>
        </nav>
        <!-- Navbar -->
    </header>

    <main>
`;
    }

    /**
     * Returns an URI from the 'resources' directory.
     *
     * @param {string} p The (relative) path.
     *
     * @return {vscode.Uri} The URI.
     */
    protected getFileResourceUri(p: string): vscode.Uri {
        p = ego_helpers.toStringSafe(p);

        let u: vscode.Uri;

        for (const R of this.getResourceUris()) {
            const PATH_TO_CHECK = path.resolve(
                path.join(R.fsPath, p)
            );

            u = vscode.Uri.file( PATH_TO_CHECK ).with({
                scheme: 'vscode-resource'
            });

            try {
                if (ego_helpers.isFileSync(PATH_TO_CHECK, false)) {
                    break;
                }
            } catch { }
        }

        return u;
    }

    /**
     * Gets the options for the underlying view.
     *
     * @return {ego_contracts.WebViewWithPanelOptions} The options.
     */
    protected getOptions(): ego_contracts.WebViewWithPanelOptions {
        return {
            enableCommandUris: true,
            enableFindWidget: true,
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: this.getResourceUris(),
        };
    }

    /**
     * Returns the URIs for the web view's resources.
     *
     * @return {scode.Uri[]} The list of resources.
     */
    protected getResourceUris() {
        const URIs: vscode.Uri[] = [];

        // 'res' folder inside extension's root directory
        URIs.push(
            vscode.Uri.file(path.resolve(
                path.join(__dirname, './res')
            ))
        );

        return URIs;
    }

    /**
     * Returns the title for the web view.
     *
     * @returns {string} The title.
     */
    protected abstract getTitle(): string;

    /**
     * Returns the type of the web view.
     *
     * @returns {string} The type.
     */
    protected abstract getType(): string;

    /**
     * Returns the settings for view columns.
     *
     * @return {ego_contracts.ViewColumnSettings} The settings.
     */
    protected getViewColumns(): ego_contracts.ViewColumnSettings {
        return vscode.ViewColumn.One;
    }

    /**
     * Opens the web view.
     *
     * @return {Promise<boolean>} A promise that indicates if operation was successful or not.
     */
    public open(): Promise<boolean> {
        return this._QUEUE.add(async () => {
            if (this._panel) {
                return false;
            }

            let newPanel: vscode.WebviewPanel;
            try {
                let title = 'e.GO Power Tools';
                {
                    let titleSuffix = this.getTitle();
                    if (titleSuffix) {
                        title += ' :: ' + ego_helpers.toStringSafe(titleSuffix);
                    }
                }

                newPanel = vscode.window.createWebviewPanel(
                    `egoPowerTools${ this.getType() }`,
                    title,
                    this.getViewColumns(),
                    this.getOptions(),
                );

                newPanel.webview.onDidReceiveMessage((msg: ego_contracts.WebViewMessage) => {
                    (async () => {
                        try {
                            let action: false | Function = false;

                            const MSG_ALREADY_HANDLED = await Promise.resolve(
                                this.onWebViewMessage(msg)
                            );

                            if (!MSG_ALREADY_HANDLED) {
                                switch (msg.command) {
                                    case 'onLoaded':
                                        action = async () => {
                                            await this.onLoaded();
                                        };
                                        break;

                                    case 'log':
                                        action = async () => {
                                            await this.onLog(msg.data);
                                        };
                                        break;

                                    case 'openExternalUrl':
                                        action = async () => {
                                            const URL_TO_OPEN = ego_helpers.toStringSafe(msg.data.url);
                                            const URL_TEXT = ego_helpers.toStringSafe(msg.data.text).trim();

                                            // check if "parsable"
                                            url.parse( URL_TO_OPEN );

                                            let urlPromptText: string;
                                            if ('' === URL_TEXT) {
                                                urlPromptText = `'${ URL_TO_OPEN }'`;
                                            } else {
                                                urlPromptText = `'${ URL_TEXT }' (${ URL_TO_OPEN })`;
                                            }

                                            const SELECTED_ITEM = await vscode.window.showWarningMessage<ego_contracts.ActionMessageItem>(
                                                `Do you really want to open the URL ${ urlPromptText }?`,
                                                {
                                                    title: 'Yes',
                                                    action: async () => {
                                                        await opn(URL_TO_OPEN, {
                                                            wait: false,
                                                        });
                                                    }
                                                },
                                                {
                                                    title: 'No',
                                                    isCloseAffordance: true
                                                }
                                            );

                                            if (SELECTED_ITEM) {
                                                if (SELECTED_ITEM.action) {
                                                    await SELECTED_ITEM.action();
                                                }
                                            }
                                        };
                                        break;
                                }
                            }

                            if (action) {
                                await Promise.resolve(
                                    action()
                                );
                            }
                        } catch { }
                    })();
                });

                newPanel.onDidChangeViewState((e) => {
                });

                newPanel.webview.html = this.generateHtml();

                this._panel = newPanel;
            } catch (e) {
                ego_helpers.tryDispose(newPanel);
            }

            return true;
        });
    }

    /**
     * Is invoked after the page inside the web view has been loaded.
     */
    protected async onLoaded() {
    }

    /**
     * Handles a log message from a web view.
     *
     * @param {ego_contracts.WebViewLogMessageData} data The data.
     */
    protected async onLog(data: ego_contracts.WebViewLogMessageData): Promise<void> {
        const MSG = JSON.parse(
            data.message
        );

        ego_log.CONSOLE.debug(
            MSG
        );

        this.emit('webview.log', MSG);
    }

    /**
     * Handles a custom web view message.
     *
     * @param {ego_contracts.WebViewMessage} msg The message to handle.
     *
     * @return {Promise<boolean>} The promise that indicates if message has been handled or not,
     */
    protected async onWebViewMessage(msg: ego_contracts.WebViewMessage): Promise<boolean> {
        return false;
    }

    /**
     * Gets the underlying panel.
     */
    public get panel(): vscode.WebviewPanel {
        return this._panel;
    }

    /**
     * Sends a message to the web view.
     *
     * @param {string} command The command to send.
     * @param {TData} [data] The optional data to send.
     *
     * @returns {Promise<boolean>} The promise that indicates if operation was successful or not.
     */
    public async postMessage<TData = any>(command: string, data?: TData) {
        const MSG: ego_contracts.WebViewMessage<TData> = {
            command: ego_helpers.toStringSafe(command).trim(),
            data: data,
        };

        return await Promise.resolve(
            this.view
                .postMessage(MSG)
        );
    }

    /**
     * Gets the underlying web view.
     */
    public get view(): vscode.Webview {
        return this.panel
            .webview;
    }
}

/**
 * A basic web view with an extension context.
 */
export abstract class WebViewWithContextBase extends WebViewBase {
    /**
     * Initializes a new instance of that class.
     *
     * @param {vscode.ExtensionContext} extension The extension context.
     */
    public constructor(
        public readonly extension: vscode.ExtensionContext
    ) {
        super();
    }
}
