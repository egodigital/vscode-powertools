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
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as vscode from 'vscode';


/**
 * A message item for a popup with an action.
 */
export interface ActionMessageItem extends vscode.MessageItem {
    /**
     * The (optional) action to invoke.
     */
    action?: () => any;
}

/**
 * A quick pick item with an action.
 */
export interface ActionQuickPickItem extends vscode.QuickPickItem {
    /**
     * The (optional) action to invoke.
     */
    action?: () => any;
}

/**
 * An app entry.
 */
export type AppEntry = AppItem | string;

/**
 * An event function for an app.
 *
 * @param {AppEventScriptArguments} args The arguments.
 *
 * @return {TResult} The result.
 */
export type AppEventFunction<TResult = any> = (args: AppEventScriptArguments) => TResult;

/**
 * Arguments for an app script event.
 */
export interface AppEventScriptArguments<TData = any> extends WorkspaceScriptArguments {
    /**
     * Clears the '.temp' sub folder.
     *
     * @return {boolean} Temp folder has been cleared or not.
     */
    readonly clearTemp: () => boolean;
    /**
     * The data.
     */
    readonly data?: TData;
    /**
     * The name of the event.
     */
    readonly event: string;
    /**
     * Checks if a file or folder exists, relative to '.data' sub folder.
     *
     * @param {string} path The path of the file / folder to check.
     *
     * @return {boolean} Indicates if file / folder exists or not.
     */
    readonly exists: (path: string) => boolean;
    /**
     * The underlying extension context.
     */
    readonly extension: vscode.ExtensionContext;
    /**
     * Returns the list of all workspaces.
     *
     * @return {WorkspaceInfo[]} The list of workspaces.
     */
    readonly getAllWorkspaces: () => WorkspaceInfo[];
    /**
     * Returns an URI from the 'resources' directory.
     *
     * @param {string} path The (relative) path.
     * @param {boolean} [asString] Return as string or object. Default: (true)
     *
     * @return {vscode.Uri} The URI.
     */
    readonly getFileResourceUri: (path: string, asString?: boolean) => vscode.Uri | string;
    /**
     * Posts a command to the web view.
     *
     * @param {string} command The name of the command.
     * @param {any} [data] The data for the command.
     *
     * @return {Promise<boolean>} A promise that indicates if operation was successful or not.
     */
    readonly post: (command: string, data?: any) => Promise<boolean>;
    /**
     * Reads a file, relative to '.data' sub folder.
     *
     * @param {string} path The path of the file.
     *
     * @return {Buffer} The read data.
     */
    readonly readFile: (path: string) => Buffer;
    /**
     * Reads a file or folder, relative to '.data' sub folder.
     *
     * @param {string} path The path of the file / folder.
     */
    readonly remove: (path: string) => void;
    /**
     * Renders an 'ejs' template.
     *
     * @param {string} source The (template) source.
     * @param {ejs.Data} [data] The data for the template.
     *
     * @return string The rendered template.
     */
    readonly render: (source: string, data?: ejs.Data) => string;
    /**
     * Renders an 'ejs' template from a file.
     *
     * @param {string} file The path to the file with the (template) source.
     * @param {ejs.Data} [data] The data for the template.
     *
     * @return string The rendered template.
     */
    readonly renderFile: (file: string, data?: ejs.Data) => string;
    /**
     * Returns file system information of a file or folder, relative to the '.data' sub folder.
     *
     * @param {string} path The path of the item.
     * @param {boolean} [lstat] Use 'fs.lstat()' instead of 'fs.stat()'. Default: (true)
     *
     * @return {fs.Stats|false} The information or (false) if not found.
     */
    readonly stat: (path: string, lstat?: boolean) => fs.Stats | false;
    /**
     * Creates a new temp file, inside the '.temp' sub folder.
     *
     * @return {string} The full path of the new file.
     */
    readonly tempFile: () => string;
    /**
     * Returns a full path, relative to the '.data' sub folder.
     *
     * @param {string} path The input path.
     *
     * @return {string} The full path.
     */
    readonly toDataPath: (path: string) => string;
    /**
     * The list of workspaces, grouped by name.
     */
    readonly workspaces: WorkspaceList;
    /**
     * Write data to a file, relative to '.data' sub folder.
     *
     * @param {string} path The path of the file.
     * @param {any} data The data write.
     */
    readonly writeFile: (path: string, data: any) => void;
}

/**
 * An app item.
 */
export interface AppItem extends Conditional, ForPlatforms {
    /**
     * A description for the app.
     */
    description?: string;
    /**
     * The (display) name.
     */
    name?: string;
    /**
     * Options for the script execution.
     */
    options?: any;
    /**
     * The path to the script, that should be invoked.
     */
    script: string;
}

/**
 * An app module.
 */
export interface AppModule {
    /**
     * Returns the HTML content for the app.
     *
     * @param {AppEventScriptArguments} args Arguments for the event.
     *
     * @return {string} The HTML (body) content.
     */
    readonly getHtml: (args: AppEventScriptArguments) => string;
    /**
     * Returns the title of the app (view).
     *
     * @param {AppEventScriptArguments} args Arguments for the event.
     *
     * @return {string} The title.
     */
    readonly getTitle: (args: AppEventScriptArguments) => string;
    /**
     * Is invoked on an app event.
     *
     * @param {AppEventScriptArguments} args Arguments for the event.
     */
    readonly onEvent?: (args: AppEventScriptArguments) => any;
    /**
     * Is invoked after web page inside view has been loaded.
     *
     * @param {AppEventScriptArguments} args Arguments for the event.
     */
    readonly onLoaded?: (args: AppEventScriptArguments) => any;
    /**
     * Is invoked when a message received from the web view.
     */
    readonly onMessage?: (args: AppEventScriptArguments) => any;
}

/**
 * The 'package.json' file of an app.
 */
export interface AppPackageJSON {
    /**
     * Information about the author.
     */
    author?: {
        /**
         * The email address.
         */
        email?: string;
        /**
         * The name.
         */
        name?: string;
        /**
         * The (homepage) URL.
         */
        url?: string;
    };
    /**
     * A list of one or more dependencies.
     */
    dependencies?: { [module: string]: string };
    /**
     * A list of one or more dev dependencies.
     */
    devDependencies?: { [module: string]: string };
    /**
     * The description.
     */
    description?: string;
    /**
     * The display name.
     */
    displayName?: string;
    /**
     * The software license (ID).
     */
    license?: string;
    /**
     * The (internal) name.
     */
    name?: string;
    /**
     * Options for the script.
     */
    options?: { [key: string]: any };
    /**
     * The version number.
     */
    version?: string;
}

/**
 * Describes an app store.
 */
export interface AppStore {
    /**
     * One or more app entries.
     */
    apps: AppStoreApp[];
    /**
     * The name of the store.
     */
    name: string;
}

/**
 * An app entry in an spp atore.
 */
export interface AppStoreApp {
    /**
     * A description of the app.
     */
    description?: string;
    /**
     * The display name of the app.
     */
    displayName?: string;
    /**
     * URL to an app icon.
     */
    icon?: string;
    /**
     * The name of the app.
     */
    name: string;
    /**
     * The source, where the package can downloaded.
     */
    source: string;
}

/**
 * Settings for a button in the status bar.
 */
export interface Button {
    /**
     * The color.
     */
    color?: string;
    /**
     * Display button on the right side or not.
     */
    isRight?: boolean;
    /**
     * The priority.
     */
    priority?: number;
    /**
     * The label / text.
     */
    text?: string;
    /**
     * The tooltip.
     */
    tooltip?: string;
}

/**
 * A button action.
 */
export interface ButtonAction {
    type?: string;
}

/**
 * A module for a script based button action.
 */
export interface ButtonActionScriptModule {
    /**
     * Executes the module.
     *
     * @return {ButtonActionScriptArguments} args The arguments for the execution.
     */
    readonly execute: (args: ButtonActionScriptArguments) => any;
}

/**
 * Arguments for a script based button action.
 */
export interface ButtonActionScriptArguments extends WorkspaceScriptArguments {
    /**
     * The underlying button instance.
     */
    readonly button: vscode.StatusBarItem;
}

/**
 * A possible value for a button entry in the settings.
 */
export type ButtonEntry = ButtonItem;

/**
 * A button item in the settings.
 */
export interface ButtonItem extends Button, Conditional, ForPlatforms {
    /**
     * The action to invoke, when clicked.
     */
    action: string | ButtonAction;
}

/**
 * A value item running (JavaScript) code.
 */
export interface CodeValueItem extends ValueItem {
    /**
     * The code to execute.
     */
    code: string;
}

/**
 * A possible value for a command entry.
 */
export type CommandEntry = CommandItem;

/**
 * A command item.
 */
export interface CommandItem extends Conditional, ForPlatforms {
    /**
     * Settings for an optional button.
     */
    button?: Button;
    /**
     * A description for the command.
     */
    description?: string;
    /**
     * The name for display.
     */
    name?: string;
    /**
     * Options for running the script.
     */
    options?: any;
    /**
     * The path to the script that should be executed.
     */
    script: string;
}

/**
 * An item that uses optional JavaScript code, to check if it is available or not.
 */
export interface Conditional {
    /**
     * The JavaScript code that checks the avaibility.
     */
    'if'?: string;
}

/**
 * A cron job.
 */
export interface CronJobItem extends JobItem {
    /**
     * Run on startup or not.
     */
    autoStart?: boolean;
    /**
     * The format of the value in 'time'.
     */
    format?: string;
    /**
     * The pattern.
     */
    time?: string;
}

/**
 * An event action.
 */
export interface EventAction {
    /**
     * The type.
     */
    type?: string;
}

/**
 * A possible value for an event entry.
 */
export type EventEntry = EventItem;

/**
 * An event item.
 */
export interface EventItem extends Conditional, ForPlatforms {
    /**
     * The action.
     */
    action: EventAction;
    /**
     * The event type.
     */
    type?: string;
}

/**
 * Extension configuration.
 */
export interface ExtensionConfiguration extends WithValues {
    /**
     * One or more apps to register.
     */
    apps?: AppEntry[];
    /**
     * One or more buttons to register.
     */
    buttons?: ButtonEntry[];
    /**
     * One or more commands to register.
     */
    commands?: { [id: string]: CommandEntry };
    /**
     * One or more events to register.
     */
    events?: EventEntry[];
    /**
     * One or more jobs to run.
     */
    jobs?: JobEntry[];
    /**
     * One or more things to run at startup.
     */
    startup?: StartupEntry[];
}

/**
 * Arguments for script that is executed on a file / folder change.
 */
export interface FileChangeEventActionScriptArguments extends WorkspaceScriptArguments {
    /**
     * The type of change.
     */
    readonly changeType: FileChangeType;
    /**
     * The underlying document (if available).
     */
    readonly document: vscode.TextDocument;
    /**
     * The changed file / folder.
     */
    readonly file: vscode.Uri;
}

/**
 * A script module that is executed on a file / folder change.
 */
export interface FileChangeEventActionScriptModule {
    /**
     * Executes the script.
     *
     * @param {FileChangeEventActionScriptArguments} args Arguments for the execution.
     */
    readonly execute: (args: FileChangeEventActionScriptArguments) => any;
}

/**
 * An action for a file / folder based event.
 */
export interface FileEventItem extends EventItem {
    /**
     * One or more glob patterns that describe, what files should be EXCLUDED.
     */
    exclude?: string[];
    /**
     * One or more glob patterns that describe, what files should be INCLUDED.
     */
    files?: string[];
}

/**
 * Arguments for script that is executed when a file has been saved.
 */
export interface FileSavedEventActionScriptArguments extends FileChangeEventActionScriptArguments {
}

/**
 * A script module that is executed when a file has been saved.
 */
export interface FileSavedEventActionScriptModule {
    /**
     * Executes the script.
     *
     * @param {FileSavedEventActionScriptArguments} args Arguments for the execution.
     */
    readonly execute: (args: FileSavedEventActionScriptArguments) => any;
}

/**
 * An object for specific platforms.
 */
export interface ForPlatforms {
    /**
     * One or more platform names, the object is for.
     */
    platforms?: string[];
}

/**
 * An installed app.
 */
export interface InstalledApp {
    /**
     * Tries to load the icon file of the app.
     *
     * @return {Promise<string|false>} The promise with the data URI or (false) if it does not exist.
     */
    readonly loadIcon: () => Promise<string | false>;
    /**
     * Tries to load the '.egoignore' file of the app.
     *
     * @return {Promise<string|false>} The promise with the entries or (false) if it does not exist.
     */
    readonly loadIgnoreFile: () => Promise<string[] | false>;
    /**
     * Tries to load the 'package.json' file of the app.
     *
     * @return {Promise<AppPackageJSON|false>} The promise with the data or (false) if it does not exist.
     */
    readonly loadPackageJSON: () => Promise<AppPackageJSON | false>;
    /**
     * Tries to load the 'README.md' file of the app.
     *
     * @return {Promise<string|false>} The promise with the content or (false) if it does not exist.
     */
    readonly loadREADME: () => Promise<string | false>;
    /**
     * The directory, where the app is installed.
     */
    readonly path: string;
}

/**
 * A possible value for a job entry.
 */
export type JobEntry = JobItem;

/**
 * A job item.
 */
export interface JobItem extends Conditional, ForPlatforms {
    /**
     * The action to invoke.
     */
    action: string | JobItemAction;
    /**
     * A description for the job.
     */
    description?: string;
    /**
     * A (display) name.
     */
    name?: string;
    /**
     * The type of the job item.
     */
    type?: string;
}

/**
 * A job item action.
 */
export interface JobItemAction {
    /**
     * The type.
     */
    type?: string;
}

/**
 * A job item action running a script.
 */
export interface JobItemScriptAction extends JobItemAction {
    /**
     * Options for running the script.
     */
    options?: any;
    /**
     * The path to the script to invoke.
     */
    script: string;
}

/**
 * Arguments for a job item script.
 */
export interface JobItemScriptActionArguments extends WorkspaceScriptArguments {
}

/**
 * Job item script module.
 */
export interface JobItemScriptActionModule {
    /**
     * Executes the module.
     *
     * @param {JobItemScriptArguments} args Arguments for the execution.
     */
    readonly execute: (args: JobItemScriptActionArguments) => any;
}

/**
 * A job item action running a shell command.
 */
export interface JobItemShellCommandAction extends JobItemAction {
    /**
     * The custom working directory.
     */
    cwd?: string;
    /**
     * The shell command to execute.
     */
    command: string;
}

/**
 * Arguments for a script.
 */
export interface ScriptArguments {
    /**
     * The logger.
     */
    readonly logger: ego_helpers.Logger;
    /**
     * Options for running the script.
     */
    readonly options: any;
    /**
     * The output channel.
     */
    readonly output: vscode.OutputChannel;
    /**
     * Handles a value as string and replaces placeholders.
     *
     * @param {any} val The input value.
     *
     * @return {string} The output value.
     */
    readonly replaceValues: (val: any) => string;
    /**
     * Imports a module from the extension's context.
     *
     * @param {string} id The ID of the module.
     *
     * @return {any} The module.
     */
    readonly require: (id: string) => any;
}

/**
 * A button action based on a script.
 */
export interface ScriptButtonAction extends ButtonAction {
    /**
     * Options for the script.
     */
    options?: any;
    /**
     * The path of the script to execute.
     */
    script: string;
}

/**
 * A button action based on a shell command.
 */
export interface ShellCommandButtonAction extends ButtonAction {
    /**
     * The command to execute.
     */
    command: string;
    /**
     * The custom working directory.
     */
    cwd?: string;
    /**
     * Do not write result to output.
     */
    silent?: boolean;
}

/**
 * Arguments for a startup script.
 */
export interface ScriptCommandStartupArguments extends WorkspaceScriptArguments {
}

/**
 * A startup item running a script.
 */
export interface ScriptCommandStartupItem extends StartupItem {
    /**
     * Options for running the script.
     */
    options?: any;
    /**
     * The path to the script to invoke.
     */
    script: string;
}

/**
 * A startup script module.
 */
export interface ScriptCommandStartupModule {
    /**
     * Executes the module.
     *
     * @param {ScriptCommandStartupArguments} args Arguments for the execution.
     */
    readonly execute: (args: ScriptCommandStartupArguments) => any;
}

/**
 * A script based event action.
 */
export interface ScriptEventAction extends EventAction {
    /**
     * Options for the script.
     */
    options?: any;
    /**
     * The path to the script, that should be executed.
     */
    script: string;
}

/**
 * A startup item running a (shell) command.
 */
export interface ShellCommandStartupItem extends StartupItem {
    /**
     * The custom working directory.
     */
    cwd?: string;
    /**
     * The command to execute.
     */
    command: string;
    /**
     * Do not write result to output.
     */
    silent?: boolean;
}

/**
 * A startup entry.
 */
export type StartupEntry = string | StartupItem;

/**
 * A startup item.
 */
export interface StartupItem extends Conditional, ForPlatforms {
    /**
     * The type.
     */
    type?: string;
}

/**
 * A static value item.
 */
export interface StaticValueItem extends ValueItem {
    /**
     * The value.
     */
    value: any;
}

/**
 * A value.
 */
export interface Value {
    /**
     * The name of the value (if available).
     */
    readonly name?: string;
    /**
     * The value.
     */
    readonly value: any;
}

/**
 * A value entry.
 */
export type ValueEntry = string | ValueItem;

/**
 * A value item.
 */
export interface ValueItem extends Conditional, ForPlatforms {
    /**
     * The value type.
     */
    type?: string;
}

/**
 * Settings for view columns.
 */
export type ViewColumnSettings = vscode.ViewColumn | { viewColumn: vscode.ViewColumn, preserveFocus?: boolean };

/**
 * A message from and for a WebView.
 */
export interface WebViewMessage<TData = any> {
    /**
     * The command.
     */
    command: string;
    /**
     * The data.
     */
    data?: TData;
}

/**
 * Data of log message from a web view.
 */
export interface WebViewLogMessageData {
    /**
     * The message as serialized data.
     */
    message: string;
}

/**
 * Options for a web view with a panel.
 */
export type WebViewWithPanelOptions = vscode.WebviewPanelOptions & vscode.WebviewOptions;

/**
 * An object which contains one or more value entries.
 */
export interface WithValues {
    /**
     * One or more values.
     */
    values?: { [name: string]: ValueEntry };
}

/**
 * A workspace app.
 */
export interface WorkspaceApp extends vscode.Disposable {
    /**
     * A description of the app.
     */
    readonly description: string;
    /**
     * Detail information.
     */
    readonly detail: string;
    /**
     * The (display) name.
     */
    readonly name: string;
    /**
     * Opens the app.
     *
     * @return {Promise<vscode.Disposable | false>} The promise that stores the new web view instance or (false) if operation failed.
     */
    readonly open: () => Promise<vscode.Disposable | false>;
    /**
     * Gets the current web view instance.
     */
    readonly view: vscode.Disposable;
}

/**
 * A workspace button.
 */
export interface WorkspaceButton extends vscode.Disposable {
}

/**
 * A workspace command.
 */
export interface WorkspaceCommand extends vscode.Disposable {
    /**
     * The optional button.
     */
    readonly button?: vscode.StatusBarItem;
    /**
     * The command instance.
     */
    readonly command: vscode.Disposable;
    /**
     * A description of the command.
     */
    readonly description: string;
    /**
     * Executes the command.
     *
     * @param {any[]} [args] One or more argument for the execution.
     *
     * @return {any} The result of the execution.
     */
    readonly execute: (...args: any[]) => any;
    /**
     * The ID of the command.
     */
    readonly id: string;
    /**
     * The item from the settings.
     */
    readonly item: CommandItem;
    /**
     * The name for display.
     */
    readonly name: string;
}

/**
 * Arguments for a workspace command script.
 */
export interface WorkspaceCommandScriptArguments extends WorkspaceScriptArguments {
    /**
     * The ID of the command.
     */
    readonly command: string;
}

/**
 * A workspace command script module.
 */
export interface WorkspaceCommandScriptModule {
    /**
     * Executes the script.
     *
     * @param {WorkspaceCommandScriptArguments} args Arguments for the execution.
     */
    readonly execute: (args: WorkspaceCommandScriptArguments) => any;
}

/**
 * A workspace event.
 */
export interface WorkspaceEvent extends vscode.Disposable {
    /**
     * Executes the event.
     *
     * @param {string} type The type for what the event should be executed.
     * @param {any[]} [args] One or more arguments for the execution.
     */
    readonly execute: (type: string, ...args: any[]) => void | PromiseLike<void>;
    /**
     * Gets the type.
     */
    readonly type: string;
}

/**
 * Information about a workspace.
 */
export interface WorkspaceInfo {
    /**
     * The zero based index.
     */
    readonly index: number;
    /**
     * The name of the workspace.
     */
    readonly name: string;
    /**
     * The root path.
     */
    readonly rootPath: string;
}

/**
 * A workspace job.
 */
export interface WorkspaceJob extends vscode.Disposable {
    /**
     * A description for the job.
     */
    readonly description: string;
    /**
     * Gets if the job is currently running or not.
     */
    readonly isRunning: boolean;
    /**
     * The (display) name.
     */
    readonly name: string;
    /**
     * Starts the job.
     *
     * @return {boolean} Operation was successful or not.
     */
    readonly start: () => boolean;
    /**
     * Stops the job.
     *
     * @return {boolean} Operation was successful or not.
     */
    readonly stop: () => boolean;
}

/**
 * A list of workspace infos.
 */
export type WorkspaceList = { [name: string]: WorkspaceInfo | WorkspaceInfo[] };

/**
 * Arguments for a workspace based script.
 */
export interface WorkspaceScriptArguments extends ScriptArguments {
}


/**
 * List of file change events.
 */
export enum FileChangeType {
    /**
     * Changed
     */
    Changed,
    /**
     * Created / new
     */
    Created,
    /**
     * Deleted
     */
    Deleted,
    /**
     * Saved / updated by user
     */
    Saved,
}

/**
 * The name folder with apps inside of the extension's subfolder of the current user.
 */
export const APPS_SUBFOLDER = '.apps';

/**
 * Name of the event for a new app.
 */
export const EVENT_APP_LIST_UPDATED = 'apps.updated-list';

/**
 * (Display) Name of the extension.
 */
export const EXTENSION_NAME = 'Power Tools by e.GO';

/**
 * The name of the file that is the entry for a global app.
 */
export const GLOBAL_APP_ENTRY = 'index.js';

/**
 * The name of the extension's subfolder inside the home directory of the current user.
 */
export const HOMEDIR_SUBFOLDER = '.vscode-powertools';

/**
 * Name of an ignore file.
 */
export const IGNORE_FILE = '.egoignore';

/**
 * The key for the global setting that stores the app store URL.
 */
export const KEY_GLOBAL_SETTING_APP_STORE_URL = 'egoPTAppStoreUrl';
