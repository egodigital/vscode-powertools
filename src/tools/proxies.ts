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
import * as ego_log from '../log';
import * as net from 'net';
import * as vscode from 'vscode';


/**
 * Options for a TCP proxy.
 */
export interface TcpProxyOptions {
    /**
     * The optional display name.
     */
    displayName?: string;
    /**
     * The (local) address, the proxy should listen on.
     */
    from: {
        /**
         * The hostname. Default: 0.0.0.0
         */
        hostname?: string;
        /**
         * The TCP port. Default: 80
         */
        port?: number;
    };
    /**
     * The (remote) address, the proxy should connect to.
     */
    to: {
        /**
         * The hostname.
         */
        host: string;
        /**
         * The port. Default: (local) port.
         */
        port?: number;
    };
}


let globalTcpProxies: TcpProxy[] = [];
let nextTcpProxyButtonId = Number.MIN_SAFE_INTEGER;


/**
 * A TCP proxy.
 */
export class TcpProxy extends ego_helpers.DisposableBase {
    private _server: net.Server;

    /**
     * Initializes a new instance of that class.
     *
     * @param {TcpProxyOptions} options Options for the proxy.
     */
    public constructor(
        public readonly options: TcpProxyOptions,
    ) {
        super();
    }

    /**
     * The action to invoke AFTER object has been disposed.
     */
    public afterDisposed: () => void;

    /**
     * Gets the default display name.
     */
    public get defaultDisplayName(): string {
        return `${this.sourceHost}:${this.sourcePort} <===> ${this.destinationHost}:${this.destinationPort}`;
    }

    /**
     * Gets the destination host.
     */
    public get destinationHost(): string {
        let toHost = ego_helpers.toStringSafe(this.options.to.host)
            .trim();
        if ('' === toHost) {
            toHost = this.sourceHost;
        }

        return toHost;
    }

    /**
     * Gets the destination port.
     */
    public get destinationPort(): number {
        let toPort = parseInt(
            ego_helpers.toStringSafe(this.options.to.port)
                .trim()
        );
        if (isNaN(toPort)) {
            toPort = this.sourcePort;
        }

        return toPort;
    }

    /**
     * Gets if the proxy is running or not.
     */
    public get isRunning(): boolean {
        return !_.isNil(this._server);
    }

    /**
     * Loads the global list of TCP proxies.
     *
     * @param {vscode.ExtensionContext} extension The underlying extension (context).
     *
     * @return {ego_contracts.TcpProxyListItem[]} The list of items.
     */
    public static loadList(extension: vscode.ExtensionContext): ego_contracts.TcpProxyListItem[] {
        return ego_helpers.asArray(
            extension.globalState
                .get(ego_contracts.KEY_TCP_PROXIES, null)
        );
    }

    /** @inheritdoc */
    protected onDispose() {
        const OLD_SERVER = this._server;
        if (OLD_SERVER) {
            OLD_SERVER.close();
        }

        this._server = null;

        const AFTER_DISPOSED = this.afterDisposed;
        if (AFTER_DISPOSED) {
            AFTER_DISPOSED();
        }
    }

    /**
     * Reloads the global list of TCP proxies.
     *
     * @param {vscode.ExtensionContext} extension The underlying extension (context).
     */
    public static reloadGlobalList(extension: vscode.ExtensionContext) {
        while (globalTcpProxies.length) {
            ego_helpers.tryDispose(
                globalTcpProxies.pop()
            );
        }

        TcpProxy.loadList(extension).forEach(tp => {
            try {
                const NEW_PROXY = new TcpProxy({
                    displayName: tp.displayName,
                    from: {
                        hostname: tp.from.hostname,
                        port: tp.from.port,
                    },
                    to: {
                        host: tp.to.host,
                        port: tp.to.port,
                    }
                });

                setupTcpProxy(NEW_PROXY);

                globalTcpProxies.push(NEW_PROXY);
            } catch (e) {
                ego_log.CONSOLE
                    .trace(e, 'tools.proxies.TcpProxy.reloadGlobalList(1)');
            }
        });
    }

    /**
     * Gets the source host.
     */
    public get sourceHost(): string {
        let fromHost = ego_helpers.toStringSafe(this.options.from.hostname)
            .trim();
        if ('' === fromHost) {
            fromHost = '0.0.0.0';
        }

        return fromHost;
    }

    /**
     * Gets the source port.
     */
    public get sourcePort(): number {
        let fromPort = parseInt(
            ego_helpers.toStringSafe(this.options.from.port)
                .trim()
        );
        if (isNaN(fromPort)) {
            fromPort = 80;
        }

        return fromPort;
    }

    /**
     * Starts the proxy.
     *
     * @return {Promise<boolean>} The promise that indicates if operations was successful or not.
     */
    public start(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                if (this._server) {
                    resolve(false);
                    return;
                }

                const NEW_SERVER = net.createServer((localSocket) => {
                    try {
                        const REMOTE_SOCKET = new net.Socket();
                        const TRY_CLOSE_SOCKET = (socket: net.Socket) => {
                            try {
                                socket.end();
                            } catch { }
                        };

                        localSocket.once('error', (err) => {
                            TRY_CLOSE_SOCKET(localSocket);
                        });
                        REMOTE_SOCKET.once('error', (err) => {
                            TRY_CLOSE_SOCKET(REMOTE_SOCKET);
                        });

                        REMOTE_SOCKET.connect(this.destinationPort, this.destinationHost);

                        // close
                        localSocket.once('close', function() {
                            TRY_CLOSE_SOCKET(REMOTE_SOCKET);
                        });
                        REMOTE_SOCKET.once('close', function() {
                            TRY_CLOSE_SOCKET(localSocket);
                        });

                        // data
                        REMOTE_SOCKET.on('data', function(data) {
                            const FLUSHED = localSocket.write(data);
                            if (!FLUSHED) {
                                REMOTE_SOCKET.pause();
                            }
                        });
                        localSocket.on('data', function (data) {
                            const FLUSHED = REMOTE_SOCKET.write(data);
                            if (!FLUSHED) {
                                localSocket.pause();
                            }
                        });

                        // drain
                        localSocket.on('drain', function() {
                            REMOTE_SOCKET.resume();
                        });
                        REMOTE_SOCKET.on('drain', function() {
                            localSocket.resume();
                        });
                    } catch {
                        // this.emit('error', e);
                    }
                });

                NEW_SERVER.once('error', (err) => {
                    reject(err);
                });

                NEW_SERVER.listen(this.sourcePort, this.sourceHost, () => {
                    this._server = NEW_SERVER;

                    this.emit('started');

                    resolve(true);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Stops the proxy.
     *
     * @return {Promise<boolean>} The promise that indicates if operations was successful or not.
     */
    public stop(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const OLD_SERVER = this._server;
                if (!OLD_SERVER) {
                    resolve(false);
                    return;
                }

                OLD_SERVER.close(() => {
                    this._server = null;

                    this.emit('stopped');

                    resolve(true);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Updates the global list of TCP proxies.
     *
     * @param {vscode.ExtensionContext} extension The underlying extension (context).
     */
    public static async updateGlobalList(extension: vscode.ExtensionContext) {
        const LIST_ITEMS: ego_contracts.TcpProxyListItem[] = globalTcpProxies.map(tp => {
            return {
                displayName: tp.options.displayName,
                from: {
                    hostname: tp.sourceHost,
                    port: tp.sourcePort,
                },
                to: {
                    host: tp.destinationHost,
                    port: tp.destinationPort,
                },
            };
        });

        await extension.globalState
            .update(ego_contracts.KEY_TCP_PROXIES, LIST_ITEMS);
    }

    /** @inheritdoc */
    public toString(): string {
        let displayName = ego_helpers.toStringSafe(this.options.displayName);
        if ('' === displayName) {
            displayName = this.defaultDisplayName;
        }

        return displayName;
    }
}


/**
 * Shows actions for TCP proxies.
 *
 * @param {vscode.ExtensionContext} extension The underlying extension (context).
 * @param {vscode.OutputChannel} output The underlying output channel.
 */
export async function showTcpProxyActions(
    extension: vscode.ExtensionContext,
    output: vscode.OutputChannel,
) {
    const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = [
        // new TCP proxy
        {
            action: async () => {
                let fromPort: string | number = await vscode.window.showInputBox({
                    ignoreFocusOut: true,
                    placeHolder: 'Default: 80',
                    prompt: 'Source Port ...',
                    validateInput: (v) => {
                        const STR = ego_helpers.toStringSafe(v).trim();
                        if ('' !== STR) {
                            const NR = parseInt(STR);

                            if (isNaN(NR)) {
                                return 'Please enter a valid number!';
                            }

                            if (NR < 0 || NR > 65535) {
                                return 'Please enter a valid port number!';
                            }
                        }
                    }
                });
                if (_.isNil(fromPort)) {
                    return;
                }

                fromPort = parseInt(
                    fromPort.trim()
                );
                if (isNaN(fromPort)) {
                    fromPort = 80;
                }

                let toHost = await vscode.window.showInputBox({
                    ignoreFocusOut: true,
                    placeHolder: 'Default: localhost',
                    prompt: 'Destination Host ...',
                });
                if (_.isNil(toHost)) {
                    return;
                }

                toHost = toHost.trim();
                if ('' === toHost) {
                    toHost = 'localhost';
                }

                let toPort: string | number = await vscode.window.showInputBox({
                    ignoreFocusOut: true,
                    placeHolder: 'Default: ' + fromPort,
                    prompt: 'Destination Port ...',
                    value: String(fromPort),
                    validateInput: (v) => {
                        const STR = ego_helpers.toStringSafe(v).trim();
                        if ('' !== STR) {
                            const NR = parseInt(STR);

                            if (isNaN(NR)) {
                                return 'Please enter a valid number!';
                            }

                            if (NR < 0 || NR > 65535) {
                                return 'Please enter a valid port number!';
                            }
                        }
                    }
                });
                if (_.isNil(toPort)) {
                    return;
                }

                toPort = parseInt(
                    toPort.trim()
                );
                if (isNaN(toPort)) {
                    toPort = fromPort;
                }

                let displayName = await vscode.window.showInputBox({
                    ignoreFocusOut: true,
                    prompt: 'Display Name ...',
                });
                if (_.isNil(displayName)) {
                    return;
                }

                displayName = displayName.trim();
                if ('' === displayName) {
                    displayName = undefined;
                }

                const NEW_PROXY = new TcpProxy({
                    displayName: displayName,
                    from: {
                        port: fromPort,
                    },
                    to: {
                        host: toHost,
                        port: toPort,
                    }
                });

                setupTcpProxy(NEW_PROXY);

                globalTcpProxies.push(
                    NEW_PROXY
                );

                await TcpProxy.updateGlobalList(extension);

                const YES_OR_NOT = await vscode.window.showInformationMessage(
                    'Do you like to start the new TCP proxy?',
                    'Yes', 'No'
                );

                if ('Yes' === YES_OR_NOT) {
                    if (!(await NEW_PROXY.start())) {
                        vscode.window.showWarningMessage(
                            `TCP proxy '${ NEW_PROXY }' not started!`
                        );
                    }
                }
            },
            label: '$(new)  New TCP proxy ...',
            description: 'Creates a new TCP proxy.',
        },
    ];

    // list of TCP proxies
    ego_helpers.from(
        globalTcpProxies
    ).orderBy(tp => {
        return ego_helpers.normalizeString(
            tp.toString()
        );
    }).thenBy(tp => {
        return ego_helpers.normalizeString(
            tp.defaultDisplayName
        );
    }).select(tp => {
        let detail = tp.defaultDisplayName;
        if (detail === tp.toString()) {
            detail = undefined;
        }

        return {
            action: async () => {
                if (tp.isRunning) {
                    await tp.stop();
                } else {
                    await tp.start();
                }
            },
            detail: detail,
            label: `$(${ tp.isRunning ? 'primitive-square' : 'triangle-right' })  '${ tp.toString() }' ...`,
        };
    }).pushTo(QUICK_PICKS);

    // remove from global list
    if (globalTcpProxies.length) {
        QUICK_PICKS.push({
            action: async () => {
                const TCP_PROXY_QUICK_PICKS: ego_contracts.ActionQuickPickItem<TcpProxy>[] = globalTcpProxies.map(tp => {
                    return {
                        action: async () => {
                        },
                        label: `$(trashcan)   ${ tp.toString() }`,
                        tag: tp,
                    };
                });

                const SELECTED_TCP_PROXIES = await vscode.window.showQuickPick(
                    TCP_PROXY_QUICK_PICKS,
                    {
                        canPickMany: true,
                        ignoreFocusOut: true,
                        placeHolder: 'Select one or more proxies to remove from global list ...',
                    }
                );
                if (SELECTED_TCP_PROXIES && SELECTED_TCP_PROXIES.length) {
                    // remove selected
                    globalTcpProxies = globalTcpProxies.filter(tp => {
                        return SELECTED_TCP_PROXIES.map(qp => qp.tag)
                            .indexOf(tp) < 0;
                    });

                    // close / dispose selected
                    SELECTED_TCP_PROXIES.map(qp => qp.tag).forEach(tp => {
                        ego_helpers.tryDispose(tp);
                    });

                    await TcpProxy.updateGlobalList(extension);
                }
            },
            label: `$(trashcan)   Delete Proxies ....`,
        });
    }

    const SELECTED_ITEM = await vscode.window.showQuickPick(
        QUICK_PICKS
    );

    if (SELECTED_ITEM) {
        await Promise.resolve(
            SELECTED_ITEM.action()
        );
    }
}

function setupTcpProxy(proxy: TcpProxy) {
    let btn: vscode.StatusBarItem;
    let btnCmd: vscode.Disposable;
    const DISPOSE_BTN = () => {
        ego_helpers.tryDispose(btn);
        ego_helpers.tryDispose(btnCmd);
    };
    const UPDATE_BTN_VISIBILITY = () => {
        if (btn) {
            if (proxy.isRunning) {
                btn.show();
            } else {
                btn.hide();
            }
        }
    };

    try {
        const CMD_ID = `ego.power-tools.tcpProxies.btn${ nextTcpProxyButtonId++ }`;

        btnCmd = vscode.commands.registerCommand(CMD_ID, async () => {
            try {
                const YES_NO = await vscode.window.showWarningMessage(
                    `Do you really want to stop the TCP proxy '${ proxy }'?`,
                    'Yes', 'No'
                );

                if ('Yes' === YES_NO) {
                    await proxy.stop();
                }
            } catch (e) {
                ego_helpers.showErrorMessage(e);
            }
        });

        btn = vscode.window.createStatusBarItem();
        btn.text = `TCP Proxy: ${ proxy }`;
        btn.tooltip = `Click here to stop the proxy ...

${ proxy.defaultDisplayName }`;
        btn.command = CMD_ID;
    } catch (e) {
        DISPOSE_BTN();

        ego_log.CONSOLE
            .trace(e, 'tools.proxies.setupTcpProxy(1)');
    }

    proxy.afterDisposed = () => {
        DISPOSE_BTN();
    };

    proxy.on('started', () => {
        UPDATE_BTN_VISIBILITY();

        vscode.window.showInformationMessage(
            `TCP proxy '${ proxy }' has been started.`
        );
    });

    proxy.on('stopped', () => {
        UPDATE_BTN_VISIBILITY();

        vscode.window.showInformationMessage(
            `TCP proxy '${ proxy }' has been stopped.`
        );
    });

    UPDATE_BTN_VISIBILITY();
}
