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
import * as path from 'path';
import * as vscode from 'vscode';


interface LoadWikiPageData {
    name: string;
}


/**
 * A view showing extension help page.
 */
export class HelpViewView extends ego_webview.WebViewWithContextBase {
    /**
     * @inheritdoc
     */
    protected generateHtmlBody(): string {
        const FILE = this.getFileResourceUri('tpl/Help.ejs')
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
        return `Help`;
    }

    /**
     * @inheritdoc
     */
    protected getType(): string {
        return 'Help';
    }

    /**
     * @inheritdoc
     */
    protected async onWebViewMessage(msg: ego_contracts.WebViewMessage): Promise<boolean> {
        switch (msg.command) {
            case 'loadWikiPage':
                {
                    let err: any;
                    let pageData: string;

                    const DATA: LoadWikiPageData = msg.data;
                    try {
                        let pageName = ego_helpers.toStringSafe(DATA.name)
                            .trim()
                            .split(' ')
                            .join('-');
                        if ('' !== pageName) {
                            let url = `https://github.com/egodigital/vscode-powertools/wiki/${ encodeURIComponent(pageName) }.md`;

                            let depth = 0;
                            let response: ego_helpers.HTTPRequestResult;
                            const LOAD_PAGE = async () => {
                                ++depth;
                                if (depth > 16) {
                                    throw new Error(`Too many redirections!`);
                                }

                                response = await ego_helpers.GET(url);

                                if (response.code >= 300 && response.code < 400) {
                                    const NEW_LOCATION = ego_helpers.toStringSafe(
                                        response.response.headers['location']
                                    ).trim();

                                    if ('' === NEW_LOCATION) {
                                        throw new Error(`Redirection failed! No data!`);
                                    }

                                    url = NEW_LOCATION;
                                    await LOAD_PAGE();
                                }
                            };

                            await LOAD_PAGE();
                            if (200 !== response.code) {
                                if (404 === response.code) {
                                    throw new Error(`Page '${ pageName }' not found!`);
                                } else {
                                    throw new Error(`Unexpected response: [${ response.code }] '${ response.status }'`);
                                }
                            }

                            pageData = (await response.readBody())
                                .toString('utf8');
                        } else {
                            // CHANGELOG.md

                            pageData = (await fsExtra.readFile(
                                path.resolve(
                                    path.join(__dirname, '../CHANGELOG.md')
                                )
                            , 'utf8'));
                        }
                    } catch (e) {
                        err = e;
                    }

                    await this.postMessage(
                        'wikiPageLoaded',
                        {
                            success: _.isNil(err),
                            data: pageData,
                            error: _.isNil(err) ? undefined : ego_helpers.errorToString(err),
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
 * Options the help.
 *
 * @param {vscode.ExtensionContext} extension The extension (context).
 */
export async function openHelp(extension: vscode.ExtensionContext) {
    const VIEW = new HelpViewView(extension);

    await VIEW.open();
}
