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
import * as ego_code from './code';
import * as ego_contracts from './contracts';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import {
    asArray,
    normalizeString,
    toBooleanSafe,
    toStringSafe
} from 'vscode-helpers';

export * from 'vscode-helpers';


/**
 * Builds a button for the status bar.
 *
 * @param {TButton} button The button (settings).
 * @param {Function} [setup] The setup function.
 *
 * @return {vscode.StatusBarItem} The new status bar item.
 */
export function buildButtonSync<TButton extends ego_contracts.Button = ego_contracts.Button>(
    button: TButton,
    setup?: (newStatusBarItem: vscode.StatusBarItem, button: TButton) => void
): vscode.StatusBarItem {
    if (_.isNil(button)) {
        return null;
    }

    const ALIGNMENT = toBooleanSafe(
        button.isRight
    ) ? vscode.StatusBarAlignment.Right : vscode.StatusBarAlignment.Left;

    let priority = parseInt(
        toStringSafe(button.priority)
            .trim()
    );
    if (isNaN(priority)) {
        priority = undefined;
    }

    const NEW_BUTTON = vscode.window.createStatusBarItem(
        ALIGNMENT, priority
    );

    let color: string | vscode.ThemeColor = normalizeString(
        button.color
    ).trim();
    if ('' === color) {
        color = new vscode.ThemeColor('button.foreground');
    }

    let text = toStringSafe(
        button.text
    ).trim();
    if ('' === text) {
        text = undefined;
    }

    let tooltip = toStringSafe(
        button.tooltip
    ).trim();
    if ('' === tooltip) {
        tooltip = undefined;
    }

    NEW_BUTTON.color = color;
    NEW_BUTTON.text = text;
    NEW_BUTTON.tooltip = tooltip;

    if (setup) {
        setup(
            NEW_BUTTON, button
        );
    }

    if (_.isString(NEW_BUTTON.color)) {
        if (!NEW_BUTTON.color.startsWith('#')) {
            NEW_BUTTON.color = '#' + NEW_BUTTON.color;
        }
    }

    return NEW_BUTTON;
}

/**
 * Checks if a conditional object does match items condition.
 *
 * @param {ego_contracts.Conditional} obj The object to check.
 *
 * @return {boolean} Matches condition or not.
 */
export function doesMatchFilterCondition(obj: ego_contracts.Conditional): boolean {
    return filterConditionals(
        obj
    ).length > 0;
}

/**
 * Checks if a platform object does match the (current) platform.
 *
 * @param {ego_contracts.Conditional} obj The object to check.
 *
 * @return {boolean} Matches condition or not.
 */
export function doesMatchPlatformCondition(obj: ego_contracts.ForPlatforms): boolean {
    return filterForPlatform(
        obj
    ).length > 0;
}

/**
 * Converts an error value to a string.
 *
 * @param {any} err The error.
 *
 * @return {string} The error as string.
 */
export function errorToString(err: any): string {
    if (err) {
        if (err instanceof Error) {
            return `[${ err.name }] '${ err.message }'`;
        } else {
            return toStringSafe(err);
        }
    }

    return '';
}

/**
 * Filters "conditional" items.
 *
 * @param {TObj|TObj[]} objs The objects to check.
 *
 * @return {TObj[]} The filtered items.
 */
export function filterConditionals<TObj extends ego_contracts.Conditional = ego_contracts.Conditional>(
    objs: TObj | TObj[]
): TObj[] {
    return asArray(objs).filter(o => {
        try {
            const IF = toStringSafe(o.if);
            if ('' !== IF.trim()) {
                return toBooleanSafe(
                    ego_code.run({
                        code: IF,
                    }),
                    true
                );
            }

            return true;
        } catch (e) {
            require('./log').CONSOLE
                .trace(e, 'helpers.filterConditionals(1)');

            return false;
        }
    });
}

/**
 * Filters "platform" items.
 *
 * @param {TObj|TObj[]} objs The objects to check.
 *
 * @return {TObj[]} The filtered items.
 */
export function filterForPlatform<TObj extends ego_contracts.ForPlatforms>(
    objs: TObj | TObj[]
): TObj[] {
    return asArray(objs).filter(o => {
        const OBJ_PLATFORMS = asArray(o.platforms).map(p => {
            return normalizeString(p);
        });

        return OBJ_PLATFORMS.length < 1 ? true
            : OBJ_PLATFORMS.indexOf(process.platform) > -1;
    });
}

/**
 * Returns the (possible path) of the extension's global apps sub folder.
 *
 * @return {string} The path of the extension's global apps sub folder.
 */
export function getAppsDir(): string {
    return path.resolve(
        path.join(getExtensionDirInHome(),
                  ego_contracts.HOMEDIR_SUBFOLDER)
    );
}

/**
 * Returns the (possible path) of the extension's sub folder inside the home directory.
 *
 * @return {string} The path of the extension's sub folder inside the home directory.
 */
export function getExtensionDirInHome(): string {
    return path.resolve(
        path.join(os.homedir(),
                  ego_contracts.HOMEDIR_SUBFOLDER)
    );
}

/**
 * Imports a module from the extension's context.
 *
 * @param {string} id The ID of the module.
 *
 * @return {TModule} The module.
 */
export function requireModule<TModule = any>(id: string): TModule {
    return require(
        toStringSafe(id)
    );
}

/**
 * Shows an error message.
 *
 * @param {any} err The message to show.
 *
 * @return {Promise<string>} The promise with the result.
 */
export async function showErrorMessage(err: any) {
    if (err) {
        return await vscode.window.showErrorMessage(
            errorToString(err).trim()
        );
    }
}
