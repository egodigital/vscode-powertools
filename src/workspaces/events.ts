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

import * as ego_contracts from '../contracts';
import * as ego_helpers from '../helpers';
import * as ego_log from '../log';
import * as ego_workspace from '../workspace';
import * as vscode from 'vscode';


/**
 * Name of the key for storing event instances.
 */
export const KEY_EVENTS = 'events';


/**
 * Disposes all workspace events.
 */
export function disposeEvents() {
    const WORKSPACE: ego_workspace.Workspace = this;

    const EVENT_LIST: ego_contracts.WorkspaceEvent[] = WORKSPACE.instanceState[
        KEY_EVENTS
    ];
    while (EVENT_LIST.length > 0) {
        const EVENT = EVENT_LIST.pop();

        ego_helpers.tryDispose(EVENT);
    }
}

/**
 * Reloads all workspace events.
 */
export async function reloadEvents() {
    const WORKSPACE: ego_workspace.Workspace = this;
    if (WORKSPACE.isInFinalizeState) {
        return;
    }
    if (!WORKSPACE.isInitialized) {
        return;
    }

    const SETTINGS = WORKSPACE.settings;
    if (!SETTINGS) {
        return;
    }

    disposeEvents.apply(
        this
    );

    const EVENTS = ego_helpers.asArray(SETTINGS.events);
    if (EVENTS.length < 1) {
        return;
    }

    const EVENT_LIST: ego_contracts.WorkspaceEvent[] = WORKSPACE.instanceState[
        KEY_EVENTS
    ];

    EVENTS.forEach(e => {
        try {
            if (!ego_helpers.doesMatchPlatformCondition(e)) {
                return;
            }
            if (!ego_helpers.doesMatchFilterCondition(e)) {
                return;
            }

            let executeAction: ((type: string, ...args: any[]) => void | PromiseLike<void>);
            let disposeAction: () => { };

            let type = ego_helpers.normalizeString(e.type);
            if ('' === type) {
                type = undefined;
            }

            const DOES_FILE_MATCH = (file: vscode.Uri, item: ego_contracts.FileEventItem): boolean => {
                const RELATIVE_PATH = WORKSPACE.toRelativePath(file.fsPath);
                if (false === RELATIVE_PATH) {
                    return false;
                }

                const FILES = ego_helpers.from(
                    ego_helpers.asArray(item.files)
                ).select(f => ego_helpers.toStringSafe(f).trim())
                 .where(f => '' !== f)
                 .toArray();

                const EXCLUDE = ego_helpers.from(
                    ego_helpers.asArray(item.exclude)
                ).select(e => ego_helpers.toStringSafe(e).trim())
                 .where(e => '' !== e)
                 .toArray();

                if (EXCLUDE.length > 0) {
                    if (
                        ego_helpers.doesMatch(RELATIVE_PATH, EXCLUDE) ||
                        ego_helpers.doesMatch('/' + RELATIVE_PATH, EXCLUDE)
                    ) {
                        return false;
                    }
                }

                if (FILES.length < 1) {
                    FILES.push('**');
                }

                return ego_helpers.doesMatch(RELATIVE_PATH, FILES) ||
                       ego_helpers.doesMatch('/' + RELATIVE_PATH, FILES);
            };

            switch (ego_helpers.normalizeString(e.action.type)) {
                case 'script':
                    {
                        const SCRIPT_ACTION = <ego_contracts.ScriptEventAction>e.action;

                        executeAction = async (eventType: string, ...args: any[]) => {
                            eventType = ego_helpers.normalizeString(eventType);

                            switch (eventType) {
                                case 'file.changed':
                                case 'file.created':
                                case 'file.deleted':
                                    if (DOES_FILE_MATCH(args[1], <ego_contracts.FileEventItem>e)) {
                                        const SCRIPT_PATH = WORKSPACE.replaceValues(
                                            SCRIPT_ACTION.script
                                        );

                                        const FULL_SCRIPT_PATH = WORKSPACE.getExistingFullPath(
                                            SCRIPT_PATH
                                        );

                                        if (false === FULL_SCRIPT_PATH) {
                                            throw new Error(`Script '${ SCRIPT_PATH }' not found!`);
                                        }

                                        const SCRIPT_MODULE = ego_helpers.loadModule<ego_contracts.FileChangeEventActionScriptModule>(
                                            FULL_SCRIPT_PATH
                                        );
                                        if (SCRIPT_MODULE) {
                                            if (SCRIPT_MODULE.execute) {
                                                const ARGS: ego_contracts.FileChangeEventActionScriptArguments = {
                                                    changeType: args[0],
                                                    document: args[2],
                                                    file: args[1],
                                                    logger: WORKSPACE.logger,
                                                    options: ego_helpers.cloneObject(SCRIPT_ACTION.options),
                                                    output: WORKSPACE.output,
                                                    replaceValues: (val) => {
                                                        return WORKSPACE.replaceValues(val);
                                                    },
                                                    require: (id) => {
                                                        return ego_helpers.requireModule(id);
                                                    },
                                                };

                                                await Promise.resolve(
                                                    SCRIPT_MODULE.execute(ARGS)
                                                );
                                            }
                                        }
                                    }
                                    break;

                                case 'file.saved':
                                    if (DOES_FILE_MATCH(args[1], <ego_contracts.FileEventItem>e)) {
                                        const SCRIPT_PATH = WORKSPACE.replaceValues(
                                            SCRIPT_ACTION.script
                                        );

                                        const FULL_SCRIPT_PATH = WORKSPACE.getExistingFullPath(
                                            SCRIPT_PATH
                                        );

                                        if (false === FULL_SCRIPT_PATH) {
                                            throw new Error(`Script '${ SCRIPT_PATH }' not found!`);
                                        }

                                        const SCRIPT_MODULE = ego_helpers.loadModule<ego_contracts.FileSavedEventActionScriptModule>(
                                            FULL_SCRIPT_PATH
                                        );
                                        if (SCRIPT_MODULE) {
                                            if (SCRIPT_MODULE.execute) {
                                                const ARGS: ego_contracts.FileSavedEventActionScriptArguments = {
                                                    changeType: args[0],
                                                    document: args[2],
                                                    file: args[1],
                                                    logger: WORKSPACE.logger,
                                                    options: ego_helpers.cloneObject(SCRIPT_ACTION.options),
                                                    output: WORKSPACE.output,
                                                    replaceValues: (val) => {
                                                        return WORKSPACE.replaceValues(val);
                                                    },
                                                    require: (id) => {
                                                        return ego_helpers.requireModule(id);
                                                    },
                                                };

                                                await Promise.resolve(
                                                    SCRIPT_MODULE.execute(ARGS)
                                                );
                                            }
                                        }
                                    }
                                    break;
                            }
                        };
                    }
                    break;
            }

            if (executeAction) {
                EVENT_LIST.push({
                    dispose: disposeAction,
                    execute: executeAction,
                    type: type,
                });
            }
        } catch (err) {
            ego_log.CONSOLE
                   .trace(err, 'events.reloadEvents(1)');
        }
    });
}
