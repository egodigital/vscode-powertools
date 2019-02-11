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
import * as events from 'events';
import * as net from 'net';
import * as vscode from 'vscode';


/**
 * Options for a TCP proxy.
 */
export interface TcpProxyOptions {
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


const TCP_PROXIES: TcpProxy[] = [];


/**
 * A TCP proxy.
 */
export class TcpProxy extends events.EventEmitter {
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

    /** @inheritdoc */
    public toString(): string {
        return `${this.sourceHost}:${this.sourcePort} <===> ${this.destinationHost}:${this.destinationPort}`;
    }
}


/**
 * Shows actions for TCP proxies.
 */
export async function showTcpProxyActions() {
    const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = [
        {
            action: async () => {
                let fromPort = parseInt(
                    await vscode.window.showInputBox({
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
                    })
                );
                if (isNaN(fromPort)) {
                    fromPort = 80;
                }

                let toHost = ego_helpers.toStringSafe(
                    await vscode.window.showInputBox({
                        ignoreFocusOut: true,
                        placeHolder: 'Default: localhost',
                        prompt: 'Destination Host ...',
                    })
                ).trim();
                if ('' === toHost) {
                    toHost = 'localhost';
                }

                let toPort = parseInt(
                    await vscode.window.showInputBox({
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
                    })
                );
                if (isNaN(toPort)) {
                    toPort = fromPort;
                }

                const NEW_PROXY = new TcpProxy({
                    from: {
                        port: fromPort,
                    },
                    to: {
                        host: toHost,
                        port: toPort,
                    }
                });
                NEW_PROXY.on('started', () => {
                    vscode.window.showInformationMessage(
                        `TCP proxy '${ NEW_PROXY }' has been started.`
                    );
                });
                NEW_PROXY.on('stopped', () => {
                    vscode.window.showInformationMessage(
                        `TCP proxy '${ NEW_PROXY }' has been stopped.`
                    );
                });
                if (await NEW_PROXY.start()) {
                    TCP_PROXIES.push(
                        NEW_PROXY
                    );
                } else {
                    NEW_PROXY.removeAllListeners();

                    vscode.window.showWarningMessage(
                        `TCP proxy '${ NEW_PROXY }' not started!`
                    );
                }
            },
            label: '$(triangle-right)  New TCP proxy ...',
            description: 'Creates and starts a new TCP proxy.',
        },
    ];

    ego_helpers.from(
        TCP_PROXIES
    ).orderBy(tp => {
        return ego_helpers.normalizeString(
            tp.toString()
        );
    }).select(tp => {
        return {
            action: async () => {
                if (tp.isRunning) {
                    await tp.stop();
                } else {
                    await tp.start();
                }
            },
            label: `$(${ tp.isRunning ? 'primitive-square' : 'triangle-right' })  '${ tp.toString() }' ...`,
        };
    }).pushTo(QUICK_PICKS);

    const SELECTED_ITEM = await vscode.window.showQuickPick(
        QUICK_PICKS
    );

    if (SELECTED_ITEM) {
        await Promise.resolve(
            SELECTED_ITEM.action()
        );
    }
}
