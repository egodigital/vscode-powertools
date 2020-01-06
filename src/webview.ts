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
import * as fsExtra from 'fs-extra';
import * as htmlEntities from 'html-entities';
const opn = require('opn');
import * as path from 'path';
import * as url from 'url';
import * as vscode from 'vscode';
import * as vueParser from 'vue-parser';


/**
 * Options for 'getVueFooter()' function.
 */
export interface GetVueFooterOptions {
    /**
     * Extra HTML.
     */
    extra?: string;
    /**
     * URLs of scripts.
     */
    scripts?: {
        /**
         * The app script.
         */
        app?: string;
        /**
         * deepmerge
         */
        deepmerge?: string;
        /**
         * Vue
         */
        vue?: string;
        /**
         * Vuetify
         */
        vuetify?: string;
    };
}

/**
 * Options for 'getVueHeader()' function.
 */
export interface GetVueHeaderOptions {
    /**
     * Extra HTML.
     */
    extra?: string;
    /**
     * URLs to fonts.
     */
    fonts?: {
        /**
         * Font Awesome 5
         */
        fa5?: string;
        /**
         * Material icons.
         */
        materialIcons?: string;
        /**
         * The Roboto font.
         */
        roboto?: string;
    };
    /**
     * List of image URLs.
     */
    images?: {
        /**
         * Logo.
         */
        logo?: string;
    };
    /**
     * URLs of styles.
     */
    styles?: {
        /**
         * The app style.
         */
        app?: string;
        /**
         * Vuetify.
         */
        vuetify?: string;
    };
    /**
     * The custom page title.
     */
    title?: string;
}

/**
 * Result of 'getVueParts()' function.
 */
export interface GetVuePartsResult {
    /**
     * The content of the script tag.
     */
    script: string;
    /**
     * The content of the style tag.
     */
    style: string;
    /**
     * The content of the template tag.
     */
    template: string;
}


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
    public close(): Promise<boolean> {
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
    protected generateHtml(): string {
        const HEADER = this.generateHtmlHeader();
        const BODY = this.generateHtmlBody();
        const FOOTER = this.generateHtmlFooter();

        return `${HEADER}

${BODY}

${FOOTER}`;
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
    protected generateHtmlFooter(): string {
        const WEBVIEW_JAVASCRIPT_URI = this.getFileResourceUri('js/app.' + this.getType() + '.js');

        return `
        </main>

        <!-- Showdown -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/showdown.js')}" crossorigin="anonymous"></script>
        <!-- JQuery -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/jquery-3.4.1.min.js')}" crossorigin="anonymous"></script>
        <!-- highlight.js -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/highlight.pack.js')}" crossorigin="anonymous"></script>
        <!-- Bootstrap tooltips -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/popper.min.js')}" crossorigin="anonymous"></script>
        <!-- Bootstrap core JavaScript -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/bootstrap.js')}" crossorigin="anonymous"></script>
        <!-- MDB core JavaScript -->
        <script type="text/javascript" src="${ this.getFileResourceUri('js/mdb.js')}" crossorigin="anonymous"></script>

        <script type="text/javascript" src="${ this.getFileResourceUri('js/app.js')}" crossorigin="anonymous"></script>
        ${ WEBVIEW_JAVASCRIPT_URI && fsExtra.existsSync(WEBVIEW_JAVASCRIPT_URI.fsPath) ? `<script type="text/javascript" src="${WEBVIEW_JAVASCRIPT_URI}" crossorigin="anonymous"></script>` : ''}
    </body>
</html>`;
    }

    /**
     * Generate the HTML header for the view.
     *
     * @returns {string} The HTML header.
     */
    protected generateHtmlHeader(): string {
        const HTML_ENTITIES = new htmlEntities.AllHtmlEntities();
        const WEBVIEW_STYLE_URI = this.getFileResourceUri('css/app.' + this.getType() + '.css');

        return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="x-ua-compatible" content="ie=edge">

    <title>Power Tools by e.GO :: ${ HTML_ENTITIES.encode(this.getTitle())}</title>

    <!-- Font Awesome -->
    <link href="${ this.getFileResourceUri('css/font-awesome.css')}" rel="stylesheet">
    <!-- highlight.js -->
    <link href="${ this.getFileResourceUri('css/highlight/default.css')}" rel="stylesheet">
    <link href="${ this.getFileResourceUri('css/highlight/mono-blue.css')}" rel="stylesheet">
    <!-- Bootstrap core CSS -->
    <link href="${ this.getFileResourceUri('css/bootstrap.css')}" rel="stylesheet">
    <!-- Material Design Bootstrap -->
    <link href="${ this.getFileResourceUri('css/mdb.css')}" rel="stylesheet">

    <link href="${ this.getFileResourceUri('css/app.css')}" rel="stylesheet">
    ${ WEBVIEW_STYLE_URI && fsExtra.existsSync(WEBVIEW_STYLE_URI.fsPath) ? `<link href="${WEBVIEW_STYLE_URI}" rel="stylesheet">` : ''}

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
                    <img src="${ this.getFileResourceUri('img/ego_digital.png')}" id="ego-logo">
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

            u = vscode.Uri.file(PATH_TO_CHECK).with({
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
     * @return {vscode.Uri[]} The list of resources.
     */
    protected getResourceUris(): vscode.Uri[] {
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
                    `egoPowerTools${this.getType()}`,
                    title,
                    this.getViewColumns(),
                    this.getOptions(),
                );

                newPanel.webview.onDidReceiveMessage((msg: ego_contracts.WebViewMessage) => {
                    (async () => {
                        if (this.isInFinalizeState) {
                            return;
                        }

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
                                        url.parse(URL_TO_OPEN);

                                        let urlPromptText: string;
                                        if ('' === URL_TEXT) {
                                            urlPromptText = `'${URL_TO_OPEN}'`;
                                        } else {
                                            urlPromptText = `'${URL_TEXT}' (${URL_TO_OPEN})`;
                                        }

                                        const SELECTED_ITEM = await vscode.window.showWarningMessage<ego_contracts.ActionMessageItem>(
                                            `Do you really want to open the URL ${urlPromptText}?`,
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
                    })().then(() => {
                    }).catch(err => {
                        ego_log.CONSOLE
                            .trace(err, 'webview.WebViewBase.open(onDidReceiveMessage)');
                    });
                });

                newPanel.onDidChangeViewState((e) => {
                    (async () => {
                        if (this.isInFinalizeState) {
                            return;
                        }

                        await this.onWebViewVisibilityChanged(e.webviewPanel.visible);
                    })().then(() => {
                    }).catch(err => {
                        ego_log.CONSOLE
                            .trace(err, 'webview.WebViewBase.open(onDidChangeViewState)');
                    });
                });

                newPanel.onDidDispose(() => {
                    this._QUEUE.add(async () => {
                        await this.onWebViewDisposed();
                    }).then(() => {
                    }).catch(err => {
                        ego_log.CONSOLE
                            .trace(err, 'webview.WebViewBase.open(onDidDispose)');
                    });
                });

                newPanel.webview.html = this.generateHtml();

                this._panel = newPanel;
            } catch (e) {
                ego_helpers.tryDispose(newPanel);

                throw e;
            }

            return true;
        });
    }

    /**
     * @inheritdoc
     */
    protected onDispose() {
        ego_helpers.tryDispose(this.panel);
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
     * Is invoked, after the web view (panel) has been disposed.
     */
    protected async onWebViewDisposed() {
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
     * Is invoked after the visibility of the web view has been changed.
     *
     * @param {boolean} isVisible Content is currently visible or not.
     */
    protected async onWebViewVisibilityChanged(isVisible: boolean) {
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
    public async postMessage<TData = any>(command: string, data?: TData): Promise<boolean> {
        try {
            if (this.isInFinalizeState) {
                return;
            }

            const MSG: ego_contracts.WebViewMessage<TData> = {
                command: ego_helpers.toStringSafe(command).trim(),
                data: data,
            };

            return await this.view
                .postMessage(MSG);
        } catch (e) {
            ego_log.CONSOLE
                .trace(e, 'webview.WebViewBase.postMessage(1)');

            return false;
        }
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


/**
 * Returns the footer for an Vuetify based web site.
 *
 * @param {GetVueFooterOptions} [opts] Custom options.
 *
 * @return {string} The HTML code of the footer.
 */
export function getVueFooter(opts?: GetVueFooterOptions): string {
    if (_.isNil(opts)) {
        opts = {} as any;
    }

    let scriptApp: string;
    let scriptDeepMerge: string;
    let scriptVue: string;
    let scriptVuetify: string;
    if (opts.scripts) {
        scriptApp = opts.scripts.app;
        scriptDeepMerge = opts.scripts.deepmerge;
        scriptVue = opts.scripts.vue;
        scriptVuetify = opts.scripts.vuetify;
    }

    scriptApp = ego_helpers.toStringSafe(scriptApp)
        .trim();

    scriptDeepMerge = ego_helpers.toStringSafe(scriptDeepMerge)
        .trim();
    if ('' === scriptDeepMerge) {
        scriptDeepMerge = 'https://cdn.jsdelivr.net/npm/deepmerge@4.2.2/dist/umd.js';
    }

    scriptVue = ego_helpers.toStringSafe(scriptVue)
        .trim();
    if ('' === scriptVue) {
        scriptVue = 'https://cdn.jsdelivr.net/npm/vue@2.x/dist/vue.js';
    }

    scriptVuetify = ego_helpers.toStringSafe(scriptVuetify)
        .trim();
    if ('' === scriptVuetify) {
        scriptVuetify = 'https://cdn.jsdelivr.net/npm/vuetify@2.x/dist/vuetify.js';
    }

    let extra = ego_helpers.toStringSafe(opts.extra);
    if ('' === extra.trim()) {
        extra = '';
    }

    return `
        </v-content>
      </v-app>
    </div>

${extra}

    <script src="${scriptDeepMerge}"></script>
    <script src="${scriptVue}"></script>
    <script src="${scriptVuetify}"></script>

${'' !== scriptApp ? `<script src="${scriptApp}"></script>` : ''}

    <script>
      const EGO_VUE = (() => {
        const OPTS = deepmerge.all([
          {
            'el': '#ego-app',
            'methods': {
              'log': function() {
                return ego_log
                    .apply(this, arguments);
              },
              'post': function() {
                return ego_post
                    .apply(this, arguments);
              },
            },
          },

          'undefined' !== typeof PAGE ? PAGE : {},
        ]);

        OPTS['vuetify'] = new Vuetify({
            iconfont: 'fa',
        });

        return new Vue(OPTS);
      })();
    </script>
  </body>
</html>`;
}

/**
 * Returns the header for an Vuetify based web site.
 *
 * @param {GetVueFooterOptions} [opts] Custom options.
 *
 * @return {string} The HTML code of the header.
 */
export function getVueHeader(opts?: GetVueHeaderOptions): string {
    if (_.isNil(opts)) {
        opts = {} as any;
    }

    const HTML_ENC = new htmlEntities.AllHtmlEntities();

    let fontAwesome5: string;
    let fontMaterialIcons: string;
    let fontRoboto: string;
    if (opts.fonts) {
        fontAwesome5 = opts.fonts.fa5;
        fontMaterialIcons = opts.fonts.materialIcons;
        fontRoboto = opts.fonts.roboto;
    }

    let styleApp: string;
    let styleVuetify: string;
    if (opts.styles) {
        styleApp = opts.styles.app;
        styleVuetify = opts.styles.vuetify;
    }

    fontAwesome5 = ego_helpers.toStringSafe(fontAwesome5)
        .trim();
    if ('' === fontAwesome5) {
        fontAwesome5 = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/css/all.css';
    }

    fontMaterialIcons = ego_helpers.toStringSafe(fontMaterialIcons)
        .trim();
    if ('' === fontMaterialIcons) {
        fontMaterialIcons = 'https://cdn.jsdelivr.net/npm/@mdi/font@4.x/css/materialdesignicons.css';
    }

    fontRoboto = ego_helpers.toStringSafe(fontRoboto)
        .trim();
    if ('' === fontRoboto) {
        fontRoboto = 'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900';
    }

    styleApp = ego_helpers.toStringSafe(styleApp)
        .trim();

    styleVuetify = ego_helpers.toStringSafe(styleVuetify)
        .trim();
    if ('' === styleVuetify) {
        styleVuetify = 'https://cdn.jsdelivr.net/npm/vuetify@2.x/dist/vuetify.css';
    }

    let title = ego_helpers.toStringSafe(opts.title)
        .trim();

    let extra = ego_helpers.toStringSafe(opts.extra);
    if ('' === extra.trim()) {
        extra = '';
    }

    let logo: string;
    if (opts.images) {
        logo = opts.images.logo;
    }
    logo = ego_helpers.toStringSafe(logo)
        .trim();
    if ('' === styleVuetify) {
        logo = 'https://e-go-digital.com/site/templates/img/Logo-eGOdigital-RGB.svg';
    }

    return `<!DOCTYPE html>
    <html>
    <head>
      <link href="${fontRoboto}" rel="stylesheet">
      <link href="${fontAwesome5}" rel="stylesheet">
      <link href="${fontMaterialIcons}" rel="stylesheet">

${'' !== styleApp ? `<link href="${styleApp}" rel="stylesheet">` : ''}

      <link href="${styleVuetify}" rel="stylesheet">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui">
      <title>${HTML_ENC.encode(title)}</title>

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
                message: msg
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

${extra}

      <div id="ego-mkloubert"></div>

      <div id="ego-app">
        <v-app>
          <v-app-bar app clipped-left>
            <v-toolbar-title class="headline text-uppercase">
              <a href="https://e-go-digital.com/" target="_blank">
                <img src="${logo}" id="ego-logo" />
              </a>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn text href="https://github.com/egodigital/generator-ego" target="_blank">
              <span class="mr-2">
                Generated by <strong>generator-ego</strong>
              </span>
              <v-icon>fas fa-external-link-alt</v-icon>
            </v-btn>
          </v-app-bar>

          <v-content id="ego-content">`;
}

/**
 * Handles a value as Vue file and extracts its parts.
 *
 * @param {any} vue The input value.
 *
 * @return {GetVuePartsResult} The extracted data.
 */
export function getVueParts(vue: any): GetVuePartsResult {
    vue = ego_helpers.toStringSafe(vue);

    const TEMPLATE = trimLeadingDocumentSlashes(
        vueParser.parse(vue, 'template')
    );
    const SCRIPT = trimLeadingDocumentSlashes(
        vueParser.parse(vue, 'script')
    );
    const STYLE = trimLeadingDocumentSlashes(
        vueParser.parse(vue, 'style')
    );

    return {
        script: SCRIPT,
        style: STYLE,
        template: TEMPLATE,
    };
}

/**
 * Handles a value as string and removes leading document slashes.
 *
 * @param {any} val The input value.
 *
 * @return {string} The output value.
 */
export function trimLeadingDocumentSlashes(val: any): string {
    val = ego_helpers.from(ego_helpers.toStringSafe(val).split("\n"))
        .skipWhile(x => '' === x.trim())
        .skipWhile(x => x.trim().startsWith('//'))
        .joinToString("\n")
        .trim();

    return val;
}
