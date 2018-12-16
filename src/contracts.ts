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
 * A possible value for a command entry.
 */
export type CommandEntry = CommandItem;

/**
 * A command item.
 */
export interface CommandItem extends Conditional {
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
 * Extension configuration.
 */
export interface ExtensionConfiguration extends WithValues {
    /**
     * One or more commands to register.
     */
    commands?: { [id: string]: CommandEntry };
    /**
     * One or more things to run at startup.
     */
    startup?: StartupEntry[];
}

/**
 * Arguments for a script.
 */
export interface ScriptArguments {
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
 * A startup item running a (shell) command.
 */
export interface ShellCommandStartupItem extends StartupItem {
    /**
     * The command to execute.
     */
    command?: string;
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
export interface StartupItem extends Conditional {
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
export interface ValueItem extends Conditional {
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
 * A workspace command.
 */
export interface WorkspaceCommand extends vscode.Disposable {
    /**
     * The command instance.
     */
    readonly command: vscode.Disposable;
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
export interface WorkspaceCommandScriptArguments extends ScriptArguments {
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
