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
const deepMerge = require('deepmerge');
import * as ego_contracts from '../contracts';
import * as ego_helpers from '../helpers';
import * as ego_workspace from '../workspace';
import * as fsExtra from 'fs-extra';
import * as vscode from 'vscode';


/**
 * Name of the key for storing config imports.
 */
export const KEY_CONFIG_IMPORTS = 'configImports';


function cloneSettingsOnly(settings: any): ego_workspace.WorkspaceSettings {
    if (!_.isNil(settings)) {
        const CLONED_SETTINGS: any = {};
        for (const PROP in settings) {
            const VALUE = settings[PROP];

            if (!_.isFunction(VALUE)) {
                CLONED_SETTINGS[PROP] = ego_helpers.cloneObject(
                    VALUE
                );
            }
        }

        return CLONED_SETTINGS;
    }

    return settings;
}

/**
 * Disposes all workspace config imports.
 */
export async function disposeConfigImports() {
    const WORKSPACE: ego_workspace.Workspace = this;

    const IMPORT_LIST: ego_contracts.WorkspaceConfigImport[] = WORKSPACE.instanceState[
        KEY_CONFIG_IMPORTS
    ];
    while (IMPORT_LIST.length > 0) {
        ego_helpers.tryDispose(
            IMPORT_LIST.pop()
        );
    }
}

/**
 * Loads the settings of a workspace.
 *
 * @return {Promise<ego_workspace.WorkspaceSettings>} The promise with the loaded settings.
 */
export async function loadSettings(): Promise<ego_workspace.WorkspaceSettings> {
    const WORKSPACE: ego_workspace.Workspace = this;
    if (WORKSPACE.isInFinalizeState) {
        return;
    }
    if (!WORKSPACE.isInitialized) {
        return;
    }

    disposeConfigImports.apply(
        this
    );

    const IMPORT_LIST: ego_contracts.WorkspaceConfigImport[] = WORKSPACE.instanceState[
        KEY_CONFIG_IMPORTS
    ];

    const RELOAD_CONFIG = () => {
        WORKSPACE.raiseConfigImportsChanged().then(() => {
        }).catch((err) => {
            WORKSPACE.logger
                .trace(err, 'workspaces.config.loadSettings(3)');
        });
    };

    try {
        let loadedSettings = cloneSettingsOnly(
            vscode.workspace.getConfiguration(
                WORKSPACE.configSource.section,
                WORKSPACE.configSource.resource,
            ) || <any>{}
        );

        const IMPORTS = ego_helpers.from(
            ego_helpers.asArray(loadedSettings.imports)
        ).select(i => {
            return ego_helpers.toStringSafe(i);
        }).where(i => {
            return '' !== i.trim();
        }).select(i => {
            return {
                item: i,
                path: WORKSPACE.getExistingFullPath(i),
            };
        }).toArray();

        delete loadedSettings['imports'];

        IMPORTS.forEach(i => {
            if (false === i.path) {
                WORKSPACE.logger
                    .warn(`External config file '${ i.item }' not found!`, 'workspaces.config.loadSettings(1)');

                return;
            }

            let fileWatcher: vscode.FileSystemWatcher;
            const DISPOSE_FILE_WATCHER = () => {
                ego_helpers.tryDispose(fileWatcher);

                fileWatcher = null;
            };

            try {
                const CONFIG_FILE = JSON.parse(
                    fsExtra.readFileSync(
                        <string>i.path,
                        'utf8'
                    )
                );

                if (!_.isNil(CONFIG_FILE)) {
                    const CONFIG: ego_workspace.WorkspaceSettings = CONFIG_FILE[WORKSPACE.configSource.section];

                    if (!_.isNil(CONFIG)) {
                        delete CONFIG['imports'];

                        loadedSettings = deepMerge(loadedSettings, CONFIG);

                        fileWatcher = vscode.workspace.createFileSystemWatcher(
                            <string>i.path,
                            true, false, false,
                        );

                        fileWatcher.onDidChange(() => {
                            RELOAD_CONFIG();
                        });
                        fileWatcher.onDidDelete(() => {
                            RELOAD_CONFIG();
                        });

                        IMPORT_LIST.push({
                            dispose: () => {
                                DISPOSE_FILE_WATCHER();
                            }
                        });
                    }
                }
            } catch (e) {
                DISPOSE_FILE_WATCHER();

                WORKSPACE.logger
                    .trace(e, 'workspaces.config.loadSettings(2)');

                throw e;
            }
        });

        return loadedSettings;
    } catch (e) {
        disposeConfigImports.apply(
            this
        );

        throw e;
    }
}
