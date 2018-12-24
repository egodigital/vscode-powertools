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
import * as ego_values from './values';
import * as ego_workspaces_apps from './workspaces/apps';
import * as ego_workspaces_commands from './workspaces/commands';
import * as ego_workspaces_jobs from './workspaces/jobs';
import * as ego_workspaces_startup from './workspaces/startup';
import * as fsExtra from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as pQueue from 'p-queue';
import * as vscode from 'vscode';


/**
 * A context for a workspace instaqnce.
 */
export interface WorkspaceContext {
    /**
     * The extension context.
     */
    readonly extension: vscode.ExtensionContext;
    /**
     * The underlying file system watcher.
     */
    readonly fileWatcher: vscode.FileSystemWatcher;
    /**
     * The logger for that workspace.
     */
    readonly logger: ego_helpers.Logger;
    /**
     * The output channel.
     */
    readonly output: vscode.OutputChannel;
    /**
     * The underlying queue for handling concurrent actions between all workspaces.
     */
    readonly queue: pQueue<pQueue.DefaultAddOptions>;
}

/**
 * A function that provides workspaces.
 *
 * @return {Workspace|Workspace[]} The workspace(s).
 */
export type WorkspaceProvider = () => Workspace | Workspace[];

/**
 * Workspace settings.
 */
export interface WorkspaceSettings extends ego_contracts.ExtensionConfiguration, vscode.WorkspaceConfiguration {
}


let allWorkspacesProvider: WorkspaceProvider;


/**
 * Handles a workspace.
 */
export class Workspace extends ego_helpers.WorkspaceBase {
    private _configSrc: ego_helpers.WorkspaceConfigSource;
    private _isInitialized = false;
    private readonly _QUEUE = ego_helpers.createQueue();
    private _settings: WorkspaceSettings;

    /**
     * Initializes a new instance of that class.
     *
     * @param {number} id The ID of the workspace.
     * @param {vscode.WorkspaceFolder} folder The folder instance.
     * @param {WorkspaceContext} context The context.
     */
    public constructor(
        public readonly id: number,
        folder: vscode.WorkspaceFolder,
        public readonly context: WorkspaceContext,
    ) {
        super(folder);
    }

    /**
     * @inheritdoc
     */
    public get configSource() {
        return this._configSrc;
    }

    /**
     * Returns all apps of that workspace.
     *
     * @return {ego_contracts.WorkspaceApp[]} The list of apps.
     */
    public getApps(): ego_contracts.WorkspaceApp[] {
        return ego_helpers.asArray(
            this.instanceState[
                ego_workspaces_apps.KEY_APPS
            ]
        );
    }

    /**
     * Returns all commands of that workspace.
     *
     * @return {ego_contracts.WorkspaceCommand[]} The list of commands.
     */
    public getCommands(): ego_contracts.WorkspaceCommand[] {
        return ego_helpers.asArray(
            this.instanceState[
                ego_workspaces_commands.KEY_COMMANDS
            ]
        );
    }

    /**
     * Returns the full path of an existing file.
     *
     * @param {string} p The input path value.
     *
     * @return {string|false} The full path or (false) if not found.
     */
    public getExistingFullPath(p: string): string | false {
        p = ego_helpers.toStringSafe(p);
        if (path.isAbsolute(p)) {
            return fsExtra.existsSync(p) ? path.resolve(
                p
            ) : false;
        }

        const LOOKUPS = [
            // '.vscode' sub folder
            // insode workspace
            path.resolve(
                path.join(
                    this.rootPath, '.vscode'
                )
            ),

            // extension's suf folder
            // inside user's home directory
            path.resolve(
                path.join(
                    os.homedir(), ego_contracts.HOMEDIR_SUBFOLDER
                )
            ),
        ];

        for (const LU of LOOKUPS) {
            const FULL_PATH = path.resolve(
                path.join(
                    LU, p
                )
            );

            if (fsExtra.existsSync(FULL_PATH)) {
                return FULL_PATH;
            }
        }

        return false;
    }

    /**
     * Returns the information about that workspace.
     *
     * @return {ego_contracts.WorkspaceInfo} The workspace information.
     */
    public getInfo(): ego_contracts.WorkspaceInfo {
        return {
            index: this.folder.index,
            name: this.folder.name,
            rootPath: this.rootPath,
        };
    }

    /**
     * Returns all jobs of that workspace.
     *
     * @return {ego_contracts.WorkspaceJob[]} The list of jobs.
     */
    public getJobs(): ego_contracts.WorkspaceJob[] {
        return ego_helpers.asArray(
            this.instanceState[
                ego_workspaces_jobs.KEY_JOBS
            ]
        );
    }

    /**
     * Initializes the workspace.
     */
    public async initialize() {
        this._configSrc = {
            section: 'ego.power-tools',
            resource: vscode.Uri.file(path.join(this.rootPath,
                                                '.vscode/settings.json') ),
        };

        this.instanceState[
            ego_workspaces_commands.KEY_COMMANDS
        ] = [];
        this.instanceState[
            ego_workspaces_jobs.KEY_JOBS
        ] = [];
        this.instanceState[
            ego_workspaces_apps.KEY_APPS
        ] = [];

        // file change events
        {
            const RAISE_FILE_CHANGE = (type: ego_contracts.FileChangeType, file: vscode.Uri) => {
                this._QUEUE.add(async () => {
                    await this.onFileChange(type, file);
                }).then(() => {
                }).catch((err) => {

                });
            };

            this.context.fileWatcher.onDidChange((f) => {
                RAISE_FILE_CHANGE(ego_contracts.FileChangeType.Changed, f);
            });
            this.context.fileWatcher.onDidCreate((f) => {
                RAISE_FILE_CHANGE(ego_contracts.FileChangeType.Created, f);
            });
            this.context.fileWatcher.onDidDelete((f) => {
                RAISE_FILE_CHANGE(ego_contracts.FileChangeType.Deleted, f);
            });
        }

        try {
            this._isInitialized = true;
            await this.reloadConfiguration();
        } catch (e) {
            this.logger.err(
                e, 'workspace.initialize(1)'
            );

            return false;
        }

        return true;
    }

    /**
     * A key/value pair for data for that instance.
     */
    public readonly instanceState: { [key: string]: any } = {};

    /**
     * Gets if workspace has been initialized or not.
     */
    public get isInitialized() {
        return this._isInitialized;
    }

    /**
     * Checks if a path is inside the '.git' folder.
     *
     * @param {string} p The path to check.
     *
     * @return {boolean} Is in '.git' folder or not.
     */
    public isInGit(p: string): boolean {
        p = ego_helpers.toStringSafe(p);
        if (!path.isAbsolute(p)) {
            p = path.join(
                this.rootPath, p
            );
        }
        p = path.resolve(p);

        const GIT_FOLDER = path.resolve(
            path.join(
                this.rootPath, '.git'
            )
        );

        return p.startsWith(GIT_FOLDER + path.sep) ||
               GIT_FOLDER === p;
    }

    /**
     * Checks if a path is inside the '.vscode' folder.
     *
     * @param {string} p The path to check.
     *
     * @return {boolean} Is in '.vscode' folder or not.
     */
    public isInVscode(p: string): boolean {
        p = ego_helpers.toStringSafe(p);
        if (!path.isAbsolute(p)) {
            p = path.join(
                this.rootPath, p
            );
        }
        p = path.resolve(p);

        const VSCODE_FOLDER = path.resolve(
            path.join(
                this.rootPath, '.vscode'
            )
        );

        return p.startsWith(VSCODE_FOLDER + path.sep) ||
               VSCODE_FOLDER === p;
    }

    /**
     * Checks if a path is part of that workspace.
     *
     * @param {string} path The path to check.
     *
     * @return {boolean} Is part of that workspace or not.
     */
    public isPathOf(path: string) {
        return false !== this.toFullPath(path);
    }

    /**
     * Gets the logger of that workspace.
     */
    public get logger() {
        return this.context.logger;
    }

    /**
     * @inheritdoc
     */
    public async onDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
        await this._QUEUE.add(async () => {
            await this.reloadConfiguration();
        });
    }

    /**
     * Is invoked when a text document has been changed.
     *
     * @param {vscode.TextDocument} doc The underlying text document.
     */
    public async onDidSaveTextDocument(doc: vscode.TextDocument) {
        await this._QUEUE.add(async () => {
            await this.onFileChange(
                ego_contracts.FileChangeType.Saved, doc.uri
            );
        });
    }

    /**
     * @inheritdoc
     */
    protected onDispose() {
        if (!this.isInitialized) {
            return;
        }

        ego_helpers.tryDispose(this.context.fileWatcher);

        // apps
        ego_workspaces_apps.disposeApps.apply(
            this
        );
        // jobs
        ego_workspaces_jobs.disposeJobs.apply(
            this
        );
        // commands
        ego_workspaces_commands.disposeCommands.apply(
            this
        );
    }

    private async onFileChange(type: ego_contracts.FileChangeType, file: vscode.Uri) {
        if (this.isInFinalizeState) {
            return;
        }

        // do not handle items inside
        // the following folders
        if (this.isInGit(file.fsPath)) {
            return;
        }
        if (this.isInVscode(file.fsPath)) {
            return;
        }
    }

    /**
     * Gets the output channel.
     */
    public get output() {
        return this.context.output;
    }

    private async reloadConfiguration() {
        if (this.isInFinalizeState) {
            return;
        }
        if (!this.isInitialized) {
            return;
        }

        try {
            let loadedSettings: WorkspaceSettings = vscode.workspace.getConfiguration(this.configSource.section,
                                                                                      this.configSource.resource) || <any>{};

            this._settings = loadedSettings;

            // commands
            await ego_workspaces_commands.reloadCommands.apply(
                this
            );
            // startups
            await ego_workspaces_startup.onStartup.apply(
                this
            );
            // apps
            await ego_workspaces_apps.reloadApps.apply(
                this
            );
            // jobs
            await ego_workspaces_jobs.reloadJobs.apply(
                this
            );
        } finally {

        }
    }

    /**
     * Handles a value as string and replaces placeholders.
     *
     * @param {any} val The input value.
     *
     * @return {string} The output value.
     */
    public replaceValues(val: any): string {
        val = ego_helpers.toStringSafe(val);

        if (!this.isInFinalizeState) {
            if (this.isInitialized) {
                val = ego_values.replaceValues(this.settings, val, {
                    buildInValues: [
                        new ego_values.FunctionValue(() => {
                            return this.id;
                        }, 'workspaceId'),
                        new ego_values.FunctionValue(() => {
                            return this.folder.index;
                        }, 'workspaceIndex'),
                        new ego_values.FunctionValue(() => {
                            return this.folder.name;
                        }, 'workspaceName'),
                        new ego_values.FunctionValue(() => {
                            return this.rootPath;
                        }, 'workspaceRoot'),
                        new ego_values.FunctionValue(() => {
                            return this.folder.uri;
                        }, 'workspaceUri'),
                    ]
                });
            }
        }

        return val;
    }

    /**
     * Gets the current settings.
     */
    public get settings() {
        return this._settings;
    }

    /**
     * Converts to a full path.
     *
     * @param {string} p The path to convert.
     *
     * @return {string|false} The pull path or (false) if 'path' could not be converted.
     */
    public toFullPath(p: string): string | false {
        const RELATIVE_PATH = this.toRelativePath(p);
        if (false === RELATIVE_PATH) {
            return false;
        }

        return path.resolve(
            path.join(
                this.rootPath,
                RELATIVE_PATH
            )
        );
    }

    /**
     * Converts to a relative path.
     *
     * @param {string} p The path to convert.
     *
     * @return {string|false} The relative path or (false) if 'path' could not be converted.
     */
    public toRelativePath(p: string): string | false {
        p = ego_helpers.toStringSafe(p);
        p = path.resolve(p)
                .split(path.sep)
                .join('/');

        const WORKSPACE_DIR =
            this.rootPath
                .split(path.sep)
                .join('/');

        if (!p.startsWith(WORKSPACE_DIR)) {
            return false;
        }

        let relativePath = p.substr(WORKSPACE_DIR.length);
        while (relativePath.startsWith('/')) {
            relativePath = relativePath.substr(1);
        }
        while (relativePath.endsWith('/')) {
            relativePath = relativePath.substr(0, relativePath.length - 1);
        }

        return relativePath;
    }
}


/**
 * Returns a list of all workspaces.
 *
 * @return {Workspace[]} The list of all workspaces.
 */
export function getAllWorkspaces(): Workspace[] {
    const PROVIDER = allWorkspacesProvider;
    if (PROVIDER) {
        return sortWorkspaces(
            PROVIDER()
        );
    }
}

/**
 * Sets the global function for providing the list of all workspaces.
 *
 * @param {WorkspaceProvider} newProvider The new function.
 */
export function setAllWorkspacesProvider(newProvider: WorkspaceProvider) {
    allWorkspacesProvider = newProvider;
}

function sortWorkspaces(workspaces: Workspace | Workspace[]) {
    return ego_helpers.asArray(workspaces).sort((x, y) => {
        return ego_helpers.compareValuesBy(x, y, ws => {
            return ws.folder.index;
        });
    });
}
