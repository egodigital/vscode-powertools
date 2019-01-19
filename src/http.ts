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
import * as ego_webview from './webview';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';
const headerCaseNormalizer = require('header-case-normalizer');
import * as http from 'http';
import * as mimeTypes from 'mime-types';
import * as vscode from 'vscode';


/**
 * A web view displaying a HTTP response.
 */
export class HttpResponseWebView extends ego_webview.WebViewBase {
    /**
     * Initializes a new instance of that class.
     *
     * @param {ego_helpers.HTTPRequestResult} result The response.
     */
    public constructor(
        public readonly result: ego_helpers.HTTPRequestResult
    ) {
        super();
    }

    /**
     * @inheritdoc
     */
    protected generateHtmlBody(): string {
        const FILE = this.getFileResourceUri('tpl/HttpResponse.ejs')
            .fsPath;

        return ejs.render(
            fsExtra.readFileSync(
                FILE, 'utf8'
            ),
            {
                'http_response': this.httpResponse
            }
        );
    }

    private getContentType(): string {
        let contentType: string;

        if (this.response.headers) {
            contentType = ego_helpers.normalizeString(this.response.headers['content-type']);

            const SEP = contentType.indexOf(';');
            if (SEP > -1) {
                contentType = contentType.substr(0, SEP).trim();
            }
        }

        return ego_helpers.isEmptyString(contentType) ?
            'application/octet-stream' : ego_helpers.normalizeString(contentType);
    }

    /**
     * @inheritdoc
     */
    protected getTitle(): string {
        return 'HTTP Response';
    }

    /**
     * @inheritdoc
     */
    protected getType(): string {
        return 'HttpResponse';
    }

    /**
     * The (source code) of the HTTP response.
     */
    public httpResponse: string;

    /**
     * Initializes the view.
     */
    public async initialize() {
        this.httpResponse = '';
        this.httpResponse += `HTTP/${ this.result.version } ${ this.result.code } ${ this.result.status }\r\n`;

        if (this.response.headers) {
            const HEADER_NAMES = ego_helpers.from(
                Object.keys(this.response.headers)
            ).orderBy(h => ego_helpers.normalizeString(h));

            for (const H of HEADER_NAMES) {
                this.httpResponse += `${ headerCaseNormalizer(H) }: ${ this.response.headers[H] }\r\n`;
            }
        }

        this.httpResponse += `\r\n`;

        const BODY = await this.result.readBody();
        if (BODY.length > 0) {
            this.httpResponse += BODY.toString('ascii');
        }
    }

    /**
     * @inheritdoc
     */
    protected async onWebViewMessage(msg: ego_contracts.WebViewMessage): Promise<boolean> {
        switch (msg.command) {
            case 'saveContent':
                {
                    let cancelled = true;
                    let err: any;
                    try {
                        const FILTERS = {};

                        const EXT = mimeTypes.extension(this.getContentType());
                        if (false !== EXT) {
                            FILTERS[`${ EXT.toUpperCase() } files (*.${ EXT })`] = [ EXT ];
                        }

                        FILTERS['All files (*.*)'] = [ '*' ];

                        const FILE = await vscode.window.showSaveDialog({
                            filters: FILTERS,
                            saveLabel: 'Save Content To ...',
                        });

                        if (FILE) {
                            cancelled = false;

                            await fsExtra.writeFile(
                                FILE.fsPath,
                                await this.result.readBody(),
                            );
                        }
                    } catch (e) {
                        err = e;
                    }

                    await this.postMessage(
                        'saveContentFinished',
                        {
                            success: _.isNil(err),
                            cancelled: _.isNil(err) ? cancelled : undefined,
                        }
                    );
                }
                break;

            case 'saveRequest':
                {
                    let cancelled = true;
                    let err: any;
                    try {
                        const FILTERS = {};
                        FILTERS['HTTP files (*.http)'] = [ 'http' ];
                        FILTERS['All files (*.*)'] = [ '*' ];

                        const FILE = await vscode.window.showSaveDialog({
                            filters: FILTERS,
                            saveLabel: 'Save Request To ...',
                        });

                        if (FILE) {
                            cancelled = false;

                            await fsExtra.writeFile(
                                FILE.fsPath,
                                this.httpResponse,
                                'ascii'
                            );
                        }
                    } catch (e) {
                        err = e;
                    }

                    await this.postMessage(
                        'saveRequestFinished',
                        {
                            success: _.isNil(err),
                            cancelled: _.isNil(err) ? cancelled : undefined,
                        }
                    );
                }
                break;

            default:
                return false;
        }

        return true;
    }

    /**
     * Gets the underyling request context.
     */
    public get request(): http.RequestOptions {
        return this.result.request;
    }

    /**
     * Gets the underyling response context.
     */
    public get response(): http.ClientResponse {
        return this.result.response;
    }
}
