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

import * as childProcess from 'child_process';
import * as ego_helpers from '../helpers';
import * as ego_workspace from '../workspace';
import * as path from 'path';
import * as util from 'util';
import * as vscode from 'vscode';


/**
 * Runs NPM tasks on startup.
 */
export async function runNPMStartupTasks() {
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

    if (!ego_helpers.toBooleanSafe(SETTINGS.runNPMInstall)) {
        return;
    }

    const PACKAGE_JSON = path.resolve(
        path.join(
            WORKSPACE.rootPath, 'package.json'
        )
    );

    if (!(await ego_helpers.isFile(PACKAGE_JSON, false))) {
        return;  // no 'package.json' file
    }

    const NODE_MODULES = path.resolve(
        path.join(
            WORKSPACE.rootPath, 'node_modules'
        )
    );

    if (await ego_helpers.exists(NODE_MODULES)) {
        return;  // 'node_modules' already exists
    }

    try {
        await vscode.window.withProgress({
            cancellable: false,
            location: vscode.ProgressLocation.Window,
            title: 'Node.js',
        }, async (progress) => {
            progress.report({
                message: "Running 'npm install' ...",
            });

            await util.promisify(childProcess.exec)('npm install', {
                cwd: WORKSPACE.rootPath,
            });
        });
    } catch (e) {
        ego_helpers.showErrorMessage(e);
    }
}
