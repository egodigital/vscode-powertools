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
 * Arguments for an app script event.
 */
export interface AppEventScriptArguments<TData = any> extends WorkspaceScriptArguments {
    /**
     * The data.
     */
    readonly data?: TData;
    /**
     * The name of the event.
     */
    readonly event: string;
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
     * The label / title.
     */
    title?: string;
    /**
     * The tooltip.
     */
    tooltip?: string;
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
     * Detail information.
     */
    detail?: string;
    /**
     * Options for running the script.
     */
    options?: any;
    /**
     * The path to the script that should be executed.
     */
    script: string;
    /**
     * The title for display.
     */
    title?: string;
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
 * Extension configuration.
 */
export interface ExtensionConfiguration extends WithValues {
    /**
     * One or more apps to register.
     */
    apps?: AppEntry[];
    /**
     * One or more commands to register.
     */
    commands?: { [id: string]: CommandEntry };
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
 * An object for specific platforms.
 */
export interface ForPlatforms {
    /**
     * One or more platform names, the object is for.
     */
    platforms?: string[];
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
     * Detail information.
     */
    readonly detail: string;
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
     * The title for display.
     */
    readonly title: string;
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
 * A workspace job.
 */
export interface WorkspaceJob extends vscode.Disposable {
    /**
     * Gets if the job is currently running or not.
     */
    readonly isRunning: boolean;
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
 * (Display) Name of the extension.
 */
export const EXTENSION_NAME = 'Power Tools by e.GO';

/**
 * The name of the extension's subfolder inside the home directory of the current user.
 */
export const HOMEDIR_SUBFOLDER = '.vscode-powertools';
