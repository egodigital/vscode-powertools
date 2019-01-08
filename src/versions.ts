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

import * as ego_helpers from './helpers';
import * as ego_markdown from './markdown';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';


const KEY_LAST_KNOWN_VERSION = 'vscptLastKnownVersion';


/**
 * Opens the CHANGELOG file, if needed.
 *
 * @param {vscode.ExtensionContext} context The underlying extension context.
 * @param {ego_helpers.PackageFile} packageFile The package file.
 */
export async function openChangelogIfNeeded(
    context: vscode.ExtensionContext,
    packageFile: ego_helpers.PackageFile,
) {
    if (!packageFile) {
        return;
    }

    const VERSION = ego_helpers.normalizeString( packageFile.version );
    if ('' === VERSION) {
        return;
    }

    let versionToUpdate: string | false = false;

    try {
        const LAST_VERSION = ego_helpers.normalizeString(
            context.globalState.get(KEY_LAST_KNOWN_VERSION, '')
        );
        if (LAST_VERSION !== VERSION) {
            const CHANGELOG_FILE = path.resolve(
                path.join(__dirname, '../CHANGELOG.md')
            );

            if (await ego_helpers.isFile(CHANGELOG_FILE)) {
                const MARKDOWN = await fsExtra.readFile(CHANGELOG_FILE, 'utf8');

                let changeLogView: ego_markdown.MarkdownWebView;
                try {
                    changeLogView = new ego_markdown.MarkdownWebView({
                        markdown: MARKDOWN,
                        title: 'CHANGELOG'
                    });

                    await changeLogView.open();
                } catch (e) {
                    ego_helpers.tryDispose( changeLogView );

                    throw e;
                }
            }

            versionToUpdate = VERSION;
        }
    } finally {
        try {
            if (false !== versionToUpdate) {
                await context.globalState.update(KEY_LAST_KNOWN_VERSION,
                                                 versionToUpdate);
            }
        } catch { }
    }
}
