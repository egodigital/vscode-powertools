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
import * as slack from '@slack/client';
import * as vscode from 'vscode';


/**
 * Tries to create a Slack client.
 *
 * @param {vscode.ExtensionContext} extension The underlying extension (context).
 *
 * @return {slack.WebClient|false} The client or (false) if not enough data is available.
 */
export function getSlackClient(extension: vscode.ExtensionContext): slack.WebClient | false {
    let token: string;

    // first try workspace
    try {
        const CREDENTIALS = extension.workspaceState
            .get<any>(ego_contracts.KEY_GLOBAL_SETTING_SLACK_API_CREDENTIALS);
        if (CREDENTIALS) {
            token = ego_helpers.toStringSafe(
                CREDENTIALS.token
            ).trim();
        }
    } catch (e) {
        ego_log.CONSOLE
            .trace(e, 'slack.getSlackClient(1)');
    }

    if (ego_helpers.isEmptyString(token)) {
        // now try global

        try {
            const CREDENTIALS = extension.globalState
                .get<any>(ego_contracts.KEY_GLOBAL_SETTING_SLACK_API_CREDENTIALS);
            if (CREDENTIALS) {
                token = ego_helpers.toStringSafe(
                    CREDENTIALS.token
                ).trim();
            }
        } catch (e) {
            ego_log.CONSOLE
                .trace(e, 'slack.getSlackClient(2)');
        }
    }

    if (ego_helpers.isEmptyString(token)) {
        return false;
    }

    return new slack.WebClient(token);
}
