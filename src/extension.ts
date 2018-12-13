'use strict';

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

import * as ego_log from './log';
import * as ego_workspace from './workspace';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';


let currentContext: vscode.ExtensionContext;
let isDeactivating = false;
let nextWorkspaceId = Number.MAX_SAFE_INTEGER;
let outputChannel: vscode.OutputChannel;
let packageFile: vscode_helpers.PackageFile;
const WORKSPACE_QUEUE = vscode_helpers.createQueue();
let workspaceWatcher: vscode_helpers.WorkspaceWatcherContext<ego_workspace.Workspace>;


async function createNewWorkspace(folder: vscode.WorkspaceFolder): Promise<ego_workspace.Workspace> {
    let newWorkspace: ego_workspace.Workspace;
    let fileWatcher: vscode.FileSystemWatcher;
    try {
        fileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, '**'),
            false, false, false,
        );

        const LOGGER = vscode_helpers.createLogger();

        const CONTEXT: ego_workspace.WorkspaceContext = {
            extension: currentContext,
            fileWatcher: fileWatcher,
            logger: LOGGER,
            output: outputChannel,
            queue: WORKSPACE_QUEUE,
        };

        LOGGER.addAction((log) => {
            let fullMsg = `[${ folder.name }] `;

            const ICON = ego_log.LOG_ICONS[log.type];

            if (!vscode_helpers.isEmptyString(ICON)) {
                fullMsg += ICON + ' ';
            }

            let tagPrefix = '';
            if (!vscode_helpers.isEmptyString(log.tag)) {
                tagPrefix = `${ vscode_helpers.normalizeString(log.tag) } :: `;
            }

            CONTEXT.output.appendLine(
                `${ fullMsg }${ tagPrefix }${ vscode_helpers.toStringSafe(log.message).trim() }`
            );
        });

        newWorkspace = new ego_workspace.Workspace(
            nextWorkspaceId--, folder, CONTEXT
        );

        LOGGER.info(
            `Initializing workspace ...`
        );
        try {
            const HAS_BEEN_INITIALIZED = await newWorkspace.initialize();
            if (HAS_BEEN_INITIALIZED) {
                LOGGER.info(
                    `Workspace initialized.`,
                );
            } else {
                throw new Error(
                    `Failed to initialize workspace '${folder.uri.fsPath}'!`
                );
            }
        } catch (e) {
            LOGGER.err(e, 'extension.createNewWorkspace(2)');
        }
    } catch (e) {
        ego_log.CONSOLE
               .trace(e, 'extension.createNewWorkspace(1)');

        vscode_helpers.tryDispose(fileWatcher);
        vscode_helpers.tryDispose(newWorkspace);

        newWorkspace = null;
    }

    return newWorkspace;
}

async function onDidSaveTextDocument(doc: vscode.TextDocument) {
    await withTextDocument(doc, async (ws, d) => {
        await ws.onDidSaveTextDocument(d);
    });
}

async function withTextDocument(
    doc: vscode.TextDocument,
    action: (ws: ego_workspace.Workspace, d: vscode.TextDocument) => void | PromiseLike<void>,
) {
    if (isDeactivating) {
        return;
    }

    for (const WS of ego_workspace.getAllWorkspaces()) {
        try {
            if (WS.isPathOf(doc.fileName)) {
                await Promise.resolve(
                    action(WS, doc)
                );
            }
        } catch (e) {
            WS.logger
              .err(e, 'extension.withTextDocument(1)');
        }
    }
}


export async function activate(context: vscode.ExtensionContext) {
    const WF = vscode_helpers.buildWorkflow();

    // extension's root directory
    WF.next(() => {
        vscode_helpers.setExtensionRoot(__dirname);
    });

    WF.next(() => {
        currentContext = context;
    });

    // package file
    WF.next(async () => {
        try {
            packageFile = await vscode_helpers.getPackageFile();
        } catch (e) {
            ego_log.CONSOLE
                   .trace(e, 'extension.activate(package file)');
        }
    });

    // output channel
    WF.next(() => {
        context.subscriptions.push(
            outputChannel = vscode.window.createOutputChannel('Power Tools by e.GO')
        );

        const NOW = vscode_helpers.now();

        if (packageFile) {
            outputChannel.appendLine(`${packageFile.displayName} (${packageFile.name}) - v${packageFile.version}`);
        }

        outputChannel.appendLine(`Copyright (c) 2018-${NOW.format('YYYY')}  e.GO Digital GmbH <hello@e-go-digital.com>`);
        outputChannel.appendLine('');
        outputChannel.appendLine(`GitHub   : https://github.com/egodigital`);
        outputChannel.appendLine(`Twitter  : https://twitter.com/ego_mobile_ag`);
        outputChannel.appendLine(`Facebook : https://facebook.com/egomobileag`);
        outputChannel.appendLine(`Instagram: https://instagram.com/egomobileag`);

        outputChannel.appendLine('');
        outputChannel.appendLine('');
        outputChannel.appendLine(`Initializing extension ...`);
        outputChannel.appendLine('');

        outputChannel.hide();
    });

    // workspace watcher
    WF.next(() => {
        context.subscriptions.push(
            workspaceWatcher = vscode_helpers.registerWorkspaceWatcher<ego_workspace.Workspace>(
                context,
                async (e, folder) => {
                    if (e === vscode_helpers.WorkspaceWatcherEvent.Added) {
                        if (folder && folder.uri && (['', 'file'].indexOf(vscode_helpers.normalizeString(folder.uri.scheme)) > -1)) {
                            // only if local URI
                            return await createNewWorkspace(folder);
                        }
                    }
                },
                async (err, ev, folder, workspace) => {
                    if (err) {
                        ego_log.CONSOLE
                               .trace(err, 'extension.activate.registerWorkspaceWatcher(remove)');

                        return;
                    }
                },
            )
        );

        ego_workspace.setAllWorkspacesProvider(() => {
            return workspaceWatcher.workspaces;
        });
    });

    // global VSCode events
    WF.next(() => {
        context.subscriptions.push(
            // onDidSaveTextDocument
            vscode.workspace.onDidSaveTextDocument((e) => {
                onDidSaveTextDocument(e).then(() => {
                }).catch((err) => {
                    ego_log.CONSOLE
                           .trace(err, 'vscode.workspace.onDidSaveTextDocument');
                });
            }),
        );
    });

    WF.next(async () => {
        await workspaceWatcher.reload();
    });

    WF.next(() => {
        outputChannel.appendLine('');
        outputChannel.appendLine(`Extension has been initialized.`);
        outputChannel.appendLine('');
    });

    await vscode_helpers.QUEUE.add(async () => {
        if (isDeactivating) {
            return;
        }

        await WF.start();
    });
}

export async function deactivate() {
    const WF = vscode_helpers.buildWorkflow();

    // TODO

    await vscode_helpers.QUEUE.add(async () => {
        if (isDeactivating) {
            return;
        }

        await WF.start();
    });
}
