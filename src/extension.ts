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

import * as childProcess from 'child_process';
import * as ego_code from './code';
import * as ego_commands from './commands';
import * as ego_contracts from './contracts';
import * as ego_global_config from './global/config';
import * as ego_global_values from './global/values';
import * as ego_helpers from './helpers';
import * as ego_log from './log';
import * as ego_states from './states';
import * as ego_stores from './stores';
import * as ego_values from './values';
import * as ego_versions from './versions';
import * as ego_workspace from './workspace';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';


let currentContext: vscode.ExtensionContext;
let isDeactivating = false;
let nextWorkspaceId = Number.MAX_SAFE_INTEGER;
let outputChannel: vscode.OutputChannel;
let packageFile: ego_helpers.PackageFile;
const WORKSPACE_QUEUE = ego_helpers.createQueue();
let workspaceWatcher: ego_helpers.WorkspaceWatcherContext<ego_workspace.Workspace>;


async function createNewWorkspace(folder: vscode.WorkspaceFolder): Promise<ego_workspace.Workspace> {
    let newWorkspace: ego_workspace.Workspace;
    let fileWatcher: vscode.FileSystemWatcher;
    try {
        fileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, '**'),
            false, false, false,
        );

        const LOGGER = ego_helpers.createLogger();

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

            if (!ego_helpers.isEmptyString(ICON)) {
                fullMsg += ICON + ' ';
            }

            let tagPrefix = '';
            if (!ego_helpers.isEmptyString(log.tag)) {
                tagPrefix = `${ ego_helpers.normalizeString(log.tag) } :: `;
            }

            CONTEXT.output.appendLine(
                `${ fullMsg }${ tagPrefix }${ ego_helpers.toStringSafe(log.message).trim() }`
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

        ego_helpers.tryDispose(fileWatcher);
        ego_helpers.tryDispose(newWorkspace);

        newWorkspace = null;
    }

    return newWorkspace;
}

/**
 * Executes code (globally).
 *
 * @param {string} code The code to execute.
 *
 * @return {any} The result of the execution.
 */
export function executeCode(code: string): any {
    code = ego_helpers.toStringSafe(code);
    if ('' === code.trim()) {
        return;
    }

    return ego_code.run({
        code: code,
        values: ego_values.toValueStorage(
            ego_global_values.getGlobalUserValues()
        ),
    });
}

/**
 * Executes a script (globally).
 *
 * @param {TSettings} settings The object with the settings.
 * @param {Function} argsFactory The function that produces the argument object for the execution.
 *
 * @return {Promise<any>} The promise with the result of the execution.
 */
export async function executeScript<
    TArgs extends ego_contracts.WorkspaceScriptArguments,
    TSettings extends ego_contracts.WithScript = ego_contracts.WithScript
>(
    settings: TSettings,
    argsFactory: (args: TArgs, settings: TSettings) => TArgs | PromiseLike<TArgs>
): Promise<any> {
    const SETTINGS = ego_global_config.getGlobalSettings();

    let scriptPath = ego_global_values.replaceValues(
        settings.script
    );
    if (!path.isAbsolute(scriptPath)) {
        scriptPath = path.join(
            ego_helpers.getExtensionDirInHome(), scriptPath
        );
    }
    scriptPath = path.resolve(scriptPath);

    if (!(await ego_helpers.exists(scriptPath))) {
        throw new Error(`Script '${ scriptPath }' not found!`);
    }

    const SCRIPT_MODULE = ego_helpers.loadScriptModule<ego_contracts.ScriptModule>(
        scriptPath
    );
    if (SCRIPT_MODULE) {
        if (SCRIPT_MODULE.execute) {
            const BASE_ARGS: ego_contracts.WorkspaceScriptArguments = {
                extension: currentContext,
                globals: ego_helpers.cloneObject(SETTINGS.globals),
                globalState: ego_states.GLOBAL_STATE,
                globalStore: new ego_stores.UserStore(),
                logger: ego_log.CONSOLE,
                options: ego_helpers.cloneObject(settings.options),
                output: outputChannel,
                replaceValues: (val) => {
                    return ego_global_values.replaceValues(val);
                },
                require: (id) => {
                    return ego_helpers.requireModule(id);
                },
                state: undefined,
                store: new ego_stores.UserStore(scriptPath),
            };

            // BASE_ARGS.state
            const STATE_GETTER_SETTER = ego_states.getScriptState(
                scriptPath, null,
                ego_helpers.getInitialStateValue(settings)
            );
            Object.defineProperty(BASE_ARGS, 'state', {
                enumerable: true,
                get: STATE_GETTER_SETTER.get,
                set: STATE_GETTER_SETTER.set,
            });

            const ARGS: TArgs = await Promise.resolve(
                argsFactory(
                    <any>BASE_ARGS, settings
                )
            );

            return await Promise.resolve(
                SCRIPT_MODULE.execute(ARGS)
            );
        }
    }
}

/**
 * Returns the current extension context.
 *
 * @return {vscode.ExtensionContext} The current extension context.
 */
export function getContext(): vscode.ExtensionContext {
    return currentContext;
}

/**
 * Imports values to an object.
 *
 * @param {TObj} obj The object where to import the values in.
 * @param {boolean} [clone] Clone input object or not. Default: (true)
 *
 * @return {TObj} The object that contains the imported values.
 */
export function importValues<TObj extends ego_contracts.CanImportValues = ego_contracts.CanImportValues>(
    obj: TObj,
    clone?: boolean,
): TObj {
    return ego_helpers.importValues(
        obj,
        () => ego_global_values.getGlobalUserValues(),
        clone,
    );
}

async function onDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
    for (const WS of ego_workspace.getAllWorkspaces()) {
        try {
            if (e.affectsConfiguration(WS.configSource.section, WS.configSource.resource)) {
                await WS.onDidChangeConfiguration(e);
            }
        } catch (e) {
            ego_log.CONSOLE
                   .trace(e, 'extension.onDidChangeConfiguration(1)');
        }
    }
}

async function onDidOpenTextDocument(doc: vscode.TextDocument) {
    await withTextDocument(doc, async (ws, d) => {
        await ws.onDidOpenTextDocument(d);
    });
}

async function onDidSaveTextDocument(doc: vscode.TextDocument) {
    await withTextDocument(doc, async (ws, d) => {
        await ws.onDidSaveTextDocument(d);
    });
}

/**
 * Runs a shell command and shows it progress in the GUI (globally).
 *
 * @param {ego_contracts.WithShellCommand} settings Settings with the command to run.
 * @param {ego_contracts.RunShellCommandOptions} [opts] Custom options.
 */
export async function runShellCommand(settings: ego_contracts.WithShellCommand, opts?: ego_contracts.RunShellCommandOptions) {
    if (!opts) {
        opts = <any>{};
    }

    const COMMAND_TO_EXECUTE = ego_global_values.replaceValues(
        settings.command
    );

    let cwd = ego_global_values.replaceValues(
        settings.cwd
    );
    if (ego_helpers.isEmptyString(cwd)) {
        cwd = ego_helpers.getExtensionDirInHome();
    }
    if (!path.isAbsolute(cwd)) {
        cwd = path.join(
            ego_helpers.getExtensionDirInHome(), cwd
        );
    }
    cwd = path.resolve(cwd);

    const SILENT = ego_helpers.toBooleanSafe(settings.silent, true);
    const WAIT = ego_helpers.toBooleanSafe(settings.wait, true);

    const WRITE_RESULT = (result: string) => {
        if (!SILENT) {
            if (!ego_helpers.isEmptyString(result)) {
                outputChannel
                    .appendLine(ego_helpers.toStringSafe(result));
                outputChannel
                    .appendLine('');
            }
        }
    };

    const COMMAND_ACTION = (progress: ego_contracts.ProgressContext) => {
        return new Promise<void>((resolve, reject) => {
            const COMPLETED = (err: any, result?: string) => {
                if (err) {
                    outputChannel
                        .appendLine(`[FAILED: '${ ego_helpers.errorToString(err) }']`);

                    WRITE_RESULT(result);

                    reject(err);
                } else {
                    outputChannel
                        .appendLine('[OK]');

                    WRITE_RESULT(result);

                    resolve();
                }
            };

            try {
                outputChannel
                    .append(`Running shell command '${ COMMAND_TO_EXECUTE }' ... `);

                if (progress) {
                    progress.report({
                        message: `Running '${ COMMAND_TO_EXECUTE }' ...`,
                    });
                }

                childProcess.exec(COMMAND_TO_EXECUTE, {
                    cwd: cwd,
                }, (err, result) => {
                    if (WAIT) {
                        COMPLETED(err, result);
                    } else {
                        if (err) {
                            require('./log')
                                .CONSOLE
                                .trace(err, 'helpers.runShellCommand(1)');

                            ego_helpers.showErrorMessage(err);
                        }

                        WRITE_RESULT(result);
                    }
                });

                if (!WAIT) {
                    COMPLETED(null, '');
                }
            } catch (e) {
                COMPLETED(e);
            }
        });
    };

    // run command
    if (ego_helpers.toBooleanSafe(opts.noProgress)) {
        await COMMAND_ACTION(null);
    } else {
        await vscode.window.withProgress({
            cancellable: false,
            location: vscode.ProgressLocation.Notification,
            title: '(Global) Shell Command',
        }, async (progress) => {
            await COMMAND_ACTION(progress);
        });
    }
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
    const WF = ego_helpers.buildWorkflow();

    // create extenstion directory, if needed
    WF.next(async () => {
        try {
            await ego_helpers.createExtensionDirectoryIfNeeded();
        } catch (e) { }
    });

    // session
    WF.next(() => {
        context.subscriptions.push(
            ego_helpers.SESSION_DISPOSER
        );
    });

    // extension's root directory
    WF.next(() => {
        ego_helpers.setExtensionRoot(__dirname);
    });

    WF.next(() => {
        currentContext = context;
    });

    // package file
    WF.next(async () => {
        try {
            packageFile = await ego_helpers.getPackageFile();
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

        const NOW = ego_helpers.now();

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

    // global stuff
    WF.next(() => {
        context.subscriptions.push({
            dispose: () => {
                ego_global_config.disposeGlobalStuff();
            }
        });
    });

    // workspace watcher
    WF.next(() => {
        context.subscriptions.push(
            workspaceWatcher = ego_helpers.registerWorkspaceWatcher<ego_workspace.Workspace>(
                context,
                async (e, folder) => {
                    if (e === ego_helpers.WorkspaceWatcherEvent.Added) {
                        if (folder && folder.uri && (['', 'file'].indexOf(ego_helpers.normalizeString(folder.uri.scheme)) > -1)) {
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

            // onDidOpenTextDocument
            vscode.workspace.onDidOpenTextDocument((doc) => {
                onDidOpenTextDocument(doc).then(() => {
                }).catch((err) => {
                    ego_log.CONSOLE
                           .trace(err, 'vscode.workspace.onDidOpenTextDocument');
                });
            }),

            // onDidChangeConfiguration
            vscode.workspace.onDidChangeConfiguration((e) => {
                (async () => {
                    try {
                        await onDidChangeConfiguration(e);
                    } catch (e) {
                        ego_log.CONSOLE
                               .trace(e, 'vscode.workspace.onDidChangeConfiguration(1)');
                    }

                    await ego_global_config.reloadGlobalSettings();
                })().then(() => {
                }).catch(err => {
                    ego_log.CONSOLE
                           .trace(err, 'vscode.workspace.onDidChangeConfiguration(2)');
                });
            }),
        );
    });

    // global extension commands
    WF.next(() => {
        ego_commands.registerCommands(
            context, outputChannel
        );
    });

    WF.next(async () => {
        await workspaceWatcher.reload();

        await ego_global_config.reloadGlobalSettings();
    });

    WF.next(() => {
        outputChannel.appendLine('');
        outputChannel.appendLine(`Extension has been initialized.`);
        outputChannel.appendLine('');
    });

    // display network info
    WF.next(() => {
        try {
            const NETWORK_INTERFACES = os.networkInterfaces();

            outputChannel.appendLine('Hostname: ' + os.hostname());

            const LIST_OF_IFNAMES = Object.keys(NETWORK_INTERFACES).sort((x, y) => {
                return ego_helpers.compareValuesBy(x, y, n => {
                    return ego_helpers.normalizeString(n);
                });
            });

            if (Object.keys(NETWORK_INTERFACES).length > 0) {
                outputChannel.appendLine('Network interfaces:');

                for (const IFNAME of LIST_OF_IFNAMES) {
                    const IFACES = NETWORK_INTERFACES[IFNAME].filter(x => {
                        return !x.internal;
                    }).filter(x => {
                        let addr = ego_helpers.normalizeString(x.address);

                        if ('IPv4' === x.family) {
                            return !/^(127\.[\d.]+|[0:]+1|localhost)$/.test(addr);
                        }

                        if ('IPv6' === x.family) {
                            return '::1' !== addr;
                        }

                        return true;
                    }).sort((x, y) => {
                        return ego_helpers.compareValuesBy(x, y, (i) => {
                            return 'IPv4' === i.family ? 0 : 1;
                        });
                    });

                    if (IFACES.length > 0) {
                        outputChannel.appendLine(`    - '${IFNAME}':`);
                        IFACES.forEach(x => {
                                            outputChannel.appendLine(`      [${x.family}] '${x.address}' / '${x.netmask}' ('${x.mac}')`);
                                       });

                        outputChannel.appendLine('');
                    }
                }
            } else {
                outputChannel.appendLine('');
            }
        } catch (e) {
            ego_log.CONSOLE
                .trace(e, 'extension.displayNetworkInfo()');
        }
    });

    // CHANGELOG
    WF.next(async () => {
        try {
            const OPEN_CHANGELOG = ego_helpers.toBooleanSafe(
                context.globalState
                    .get(ego_contracts.KEY_GLOBAL_SETTING_OPEN_CHANGELOG_ON_STARTUP, true),
                true,
            );

            if (OPEN_CHANGELOG) {
                await ego_versions.openChangelogIfNeeded(
                    context,
                    packageFile,
                );
            }
        } catch (e) {
            ego_log.CONSOLE
                .trace(e, 'extension.activate(openChangelogIfNeeded)');
        }
    });

    // check for new apps
    WF.next(() => {
        require('./apps/store').checkForNewApps(context).then((newApps: string[]) => {
            if (newApps.length < 1) {
                return;
            }

            const NEW_APPS_MSG = 1 === newApps.length ?
                '[New App] One new app has been released in the store.' :
                `[New Apps] ${ newApps.length } new apps have been released in the store.`;

            vscode.window.showInformationMessage(
                NEW_APPS_MSG + ' Do you like to open the store?',
                'Yes!', 'No'
            ).then((selectedItem) => {
                if ('Yes!' !== selectedItem) {
                    return;
                }

                require('./apps/store').openAppStore(
                    context, outputChannel
                ).then(() => {
                }).catch((err) => {
                    ego_log.CONSOLE
                        .trace(err, 'extension.activate(checkForNewApps.3)');
                });
            }, (err) => {
                ego_log.CONSOLE
                    .trace(err, 'extension.activate(checkForNewApps.2)');
            });
        }).catch((err) => {
            ego_log.CONSOLE
                .trace(err, 'extension.activate(checkForNewApps.1)');
        });
    });

    await ego_helpers.QUEUE.add(async () => {
        if (isDeactivating) {
            return;
        }

        await WF.start();
    });
}

export async function deactivate() {
    const WF = ego_helpers.buildWorkflow();

    // TODO

    await ego_helpers.QUEUE.add(async () => {
        if (isDeactivating) {
            return;
        }

        await WF.start();
    });
}
