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
import * as csvParse from 'csv-parse';
import * as ego_helpers from './helpers';
import * as ego_webview from './webview';
import * as htmlEntities from 'html-entities';


/**
 * A web view that displays CSV data.
 */
export class CsvTableWebView extends ego_webview.WebViewBase {
    /**
     * Initializes a new instance of that class.
     *
     * @param {any} csv The CSV data.
     * @param {csvParse.Options} [opts] Custom parser options.
     */
    public constructor(
        public readonly csv: any,
        public readonly parserOptions?: csvParse.Options
    ) {
        super();

        this.csv = ego_helpers.toStringSafe(this.csv);
        if (!this.parserOptions) {
            this.parserOptions = {
            };
        }
    }

    /**
     * @inheritdoc
     */
    protected generateHtmlBody(): string {
        return this.htmlContent;
    }

    /**
     * @inheritdoc
     */
    protected getTitle(): string {
        return `CSV Data`;
    }

    /**
     * @inheritdoc
     */
    protected getType(): string {
        return `CsvTable`;
    }

    /**
     * The HTML code, that should be shown in the web view.
     */
    public htmlContent: string;

    /**
     * Initializes the web view.
     */
    public async initialize() {
        const HTML_ENC = new htmlEntities.AllHtmlEntities();

        this.htmlContent = HTML_ENC.encode('No data found.');

        const RESULT = await (() => {
            return new Promise<any>((resolve, reject) => {
                try {
                    csvParse(
                        this.csv,
                        this.parserOptions,
                        (err, records) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(records);
                            }
                        },
                    );
                } catch (e) {
                    reject(e);
                }
            });
        })();

        if (RESULT) {
            if (RESULT.length) {
                this.htmlContent = '';
                this.htmlContent += '<div class="container-fluid">';
                this.htmlContent += '<div class="row">';
                this.htmlContent += '<div class="col col-12">';

                this.htmlContent += '<table class="table table-striped table-hover">';
                this.htmlContent += '<tbody>';

                RESULT.forEach((row: any[], index: number) => {
                    this.htmlContent += '<tr>';
                    if (row) {
                        this.htmlContent += `<td>${ index + 1 }</td>`;

                        row.forEach(cell => {
                            this.htmlContent += '<td>';
                            this.htmlContent += HTML_ENC.encode(
                                ego_helpers.toStringSafe(cell)
                            );
                            this.htmlContent += '</td>';
                        });
                    }
                    this.htmlContent += '</tr>';
                });

                this.htmlContent += '</tbody>';
                this.htmlContent += '</table>';

                this.htmlContent += '</div>';  // col
                this.htmlContent += '</div>';  // row
                this.htmlContent += '</div>';  // container
            }
        }
    }
}
