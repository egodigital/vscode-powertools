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


let isDeactivating = false;
let nextWorkspaceId = Number.MAX_SAFE_INTEGER;
let outputChannel: vscode.OutputChannel;
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

        const CONTEXT: ego_workspace.WorkspaceContext = {
            fileWatcher: fileWatcher,
            logger: ego_log.CONSOLE,
            queue: WORKSPACE_QUEUE,
        };

        newWorkspace = new ego_workspace.Workspace(
            nextWorkspaceId--, folder, CONTEXT
        );

        outputChannel.append(
            `Initializing workspace '${folder.uri.fsPath}' ... `
        );
        try {
            const HAS_BEEN_INITIALIZED = await newWorkspace.initialize();
            if (HAS_BEEN_INITIALIZED) {
                outputChannel.appendLine(`[OK]`);
            } else {
                outputChannel.appendLine(`[FAILED!]`);

                throw new Error(
                    `Failed to initialize workspace '${folder.uri.fsPath}'!`
                );
            }
        } catch (e) {
            ego_log.CONSOLE
                   .trace(e, 'extension.createNewWorkspace(2)');
        }
        outputChannel.appendLine('');
    } catch (e) {
        ego_log.CONSOLE
               .trace(e, 'extension.createNewWorkspace(1)');

        vscode_helpers.tryDispose(fileWatcher);
        vscode_helpers.tryDispose(newWorkspace);

        newWorkspace = null;
    }

    return newWorkspace;
}

async function onDidSaveTextDocument(e: vscode.TextDocument) {
    if (isDeactivating) {
        return;
    }

    for (const WS of ego_workspace.getAllWorkspaces()) {
        try {
            if (WS.isPathOf(e.fileName)) {
                await WS.onDidSaveTextDocument(e);
            }
        } catch (e) {
            ego_log.CONSOLE
                   .trace(e, 'extension.onDidSaveTextDocument(1)');
        }
    }
}

export async function activate(context: vscode.ExtensionContext) {
    const WF = vscode_helpers.buildWorkflow();

    // output channel
    WF.next(() => {
        context.subscriptions.push(
            outputChannel = vscode.window.createOutputChannel('Power Tools by e.GO')
        );

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

    await vscode_helpers.QUEUE.add(async () => {
        if (isDeactivating) {
            return;
        }

        await WF.start();
    });
}

export async function deactivate() {
    const WF = vscode_helpers.buildWorkflow();

    WF.next(() => {
        const WS_WATCHER = workspaceWatcher;
        if (WS_WATCHER) {
            vscode_helpers.asArray(
                WS_WATCHER.workspaces
            ).forEach(ws => {
                vscode_helpers.tryDispose(ws);
            });
        }
    });

    await vscode_helpers.QUEUE.add(async () => {
        if (isDeactivating) {
            return;
        }

        await WF.start();
    });
}
