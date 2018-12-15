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
 * Extension configuration.
 */
export interface ExtensionConfiguration extends WithValues {
    /**
     * One or more things to run at startup.
     */
    startup?: StartupEntry[];
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
export interface StartupItem {
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
export interface ValueItem {
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
