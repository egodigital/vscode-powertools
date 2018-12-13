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
 * A startup entry.
 */
export type StartupEntry = string;

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
export type ValueEntry = string;

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
