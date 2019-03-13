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
import * as ego_settings_global from '../settings/global';
import * as ego_slack from '../slack';
const opn = require('opn');
import * as path from 'path';
import * as sanitizeFilename from 'sanitize-filename';
import * as vscode from 'vscode';


/**
 * Sends the current file to a Slack channel.
 *
 * @param {vscode.ExtensionContext} extension The underlying extension (context).
 * @param {vscode.OutputChannel} output The underlying output channel.
 */
export async function sendToSlack(
    extension: vscode.ExtensionContext,
    output: vscode.OutputChannel,
) {
    const NOW = ego_helpers.utcNow();

    const CLIENT = ego_slack.getSlackClient(extension);
    if (!CLIENT) {
        vscode.window.showWarningMessage(
            'Please define the API credentials in the global settings!'
        );

        await ego_settings_global.openGlobalSettings(extension, 'slack');

        return;
    }

    let doc: vscode.TextDocument;

    const ACTIVE_EDITOR = vscode.window.activeTextEditor;
    if (ACTIVE_EDITOR) {
        doc = ACTIVE_EDITOR.document;
    }

    if (!doc) {
        vscode.window.showWarningMessage(
            'No active editor found!'
        );

        return;
    }

    let fileName = doc.fileName;
    if (ego_helpers.isEmptyString(fileName)) {
        fileName = `vscode-powertools-${ NOW.format('YYYYMMDDHHmmss') }.txt`;
    } else {
        fileName = path.basename(fileName);
    }
    fileName = sanitizeFilename(fileName).trim();

    let channelList: any;
    let teamInfo: any;
    let userList: any;

    const DO_CANCEL = await vscode.window.withProgress({
        cancellable: true,
        location: vscode.ProgressLocation.Notification,
        title: 'Slack',
    }, async (progress, cancelToken) => {
        progress.report({
            message: 'Loading team info ...'
        });

        teamInfo = await CLIENT.team
            .info();

        progress.report({
            message: 'Loading channels ...'
        });

        if (cancelToken.isCancellationRequested) {
            return true;
        }

        channelList = await CLIENT.channels
            .list();

        progress.report({
            message: 'Loading users ...'
        });

        if (cancelToken.isCancellationRequested) {
            return true;
        }

        userList = await CLIENT.users
            .list();

        return false;
    });

    if (DO_CANCEL) {
        return;
    }

    const USERS = ego_helpers.asArray(
        userList.members
    );
    const GET_USER_DISPLAY_NAME = (uid: string) => {
        let name: string;

        const MATCHING_USER = ego_helpers.from(
            USERS
        ).lastOrDefault((u: any) => u.id === uid, false);
        if (MATCHING_USER) {
            name = ego_helpers.toStringSafe(MATCHING_USER.real_name)
                .trim();
            if ('' === name) {
                name = ego_helpers.toStringSafe(MATCHING_USER.name)
                    .trim();
            }
        }

        return name;
    };

    // collect channels and users
    const CHANNELS = ego_helpers.from(
        channelList.channels
    ).pipe((c: any) => {
        c['__tm_displayName'] = c.name;
        c['__tm_prefix'] = '$(comment-discussion) #';
        c['__tm_sortOrder0'] = 1;
    }).concat(
        ego_helpers.from(
            USERS
        ).pipe(u => {
            u['__tm_sortOrder0'] = 0;
            u['__tm_displayName'] = GET_USER_DISPLAY_NAME(u.id);
            u['__tm_prefix'] = '';
        })
    ).pipe(ch => {
        if (_.isNil(ch['__tm_sortOrder1'])) {
            ch['__tm_sortOrder1'] = 0;
        }
    }).orderBy(ch => {
        return ch['__tm_sortOrder0'];
    }).thenBy(ch => {
        return ch['__tm_sortOrder1'];
    }).thenBy(ch => {
        return ego_helpers.normalizeString(
            ch['__tm_displayName']
        );
    }).toArray();

    const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = ego_helpers.from(
        CHANNELS
    ).select(ch => {
        return {
            action: async () => {
                let comment = await vscode.window.showInputBox({
                    ignoreFocusOut: true,
                    prompt: `Define an optional comment for ${ fileName } ...`,
                });

                if (_.isNil(comment)) {
                    return;
                }

                comment = ego_helpers.toStringSafe(comment)
                    .trim();
                if ('' === comment) {
                    comment = undefined;
                }

                await vscode.window.withProgress({
                    cancellable: false,
                    location: vscode.ProgressLocation.Notification,
                    title: 'Slack',
                }, async (progress) => {
                    progress.report({
                        message: `Uploading file '${ fileName }' to '${ ch['__tm_displayName'] }' ...`
                    });

                    await CLIENT.files.upload({
                        channels: ch.id,
                        content: doc.getText(),
                        filename: fileName,
                        initial_comment: comment,
                    });
                });

                // open channel in browser?
                const OPEN_OR_NOT = await vscode.window.showInformationMessage(
                    `The file '${ fileName }' has been uploaded to '${ ch['__tm_displayName'] }'.

Do you like to open it?`,
                    'Yes', 'No'
                );
                if ('Yes' === OPEN_OR_NOT) {
                    opn(
                        `https://${ encodeURIComponent(
                            teamInfo.team.domain
                        ) }.slack.com/messages/${
                            encodeURIComponent(
                                ch.id
                            )
                        }/`, {
                            wait: false,
                        }
                    );
                }
            },
            label: `${
                ego_helpers.toStringSafe(ch.__tm_prefix)
            }${
                ego_helpers.toStringSafe(ch.__tm_displayName)
                    .trim()
            }`,
        };
    }).toArray();

    if (!CHANNELS.length) {
        vscode.window.showWarningMessage(
            'No Slack channels found!'
        );

        return;
    }

    const SELECTED_ITEM = await vscode.window.showQuickPick(
        QUICK_PICKS,
        {
            canPickMany: false,
            ignoreFocusOut: true,
            placeHolder: 'Please select a Slack channel or user ...'
        }
    );

    if (SELECTED_ITEM) {
        await SELECTED_ITEM.action();
    }
}
