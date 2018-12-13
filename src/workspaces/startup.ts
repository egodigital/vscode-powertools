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
import * as ego_workspace from '../workspace';
import * as vscode_helpers from 'vscode-helpers';


/**
 * Runs things on startup.
 */
export async function onStartup() {
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

    const STARTUPS = vscode_helpers.asArray(
        SETTINGS.startup
    );

    if (STARTUPS.length < 1) {
        return;
    }

    for (const S of STARTUPS) {
        const CMD = WORKSPACE.replaceValues(S);
        if ('' === CMD.trim()) {
            continue;
        }

        try {
            WORKSPACE.logger
                     .info(`Executing '${ CMD }' ...`);

            childProcess.execSync(CMD, {
                cwd: WORKSPACE.rootPath,
            });
        } catch (e) {
            WORKSPACE.logger
                     .err(e, 'workspaces.onStartup(1)');
        }
    }

    WORKSPACE.logger
             .info(`Executed all startups.`);
}
