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
import * as ego_contracts from '../contracts';
import * as ego_helpers from '../helpers';
import * as ego_workspace from '../workspace';


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

    const STARTUPS = ego_helpers.asArray(
        SETTINGS.startup
    );

    if (STARTUPS.length < 1) {
        return;
    }

    for (const S of STARTUPS) {
        try {
            let entry: ego_contracts.StartupItem;
            if (_.isObjectLike(S)) {
                entry = <ego_contracts.StartupItem>S;
            } else {
                entry = <ego_contracts.ShellCommandStartupItem>{
                    command: ego_helpers.toStringSafe(S),
                };
            }
            entry = WORKSPACE.importValues(entry);

            if (!WORKSPACE.doesMatchPlatformCondition(entry)) {
                continue;
            }
            if (!WORKSPACE.doesMatchFilterCondition(entry)) {
                continue;
            }

            switch (ego_helpers.normalizeString(entry.type)) {
                case '':
                case 'shell':
                    await WORKSPACE.runShellCommand(
                        <ego_contracts.ShellCommandStartupItem>entry
                    );
                    break;

                case 'script':
                    await WORKSPACE.executeScript<ego_contracts.ScriptCommandStartupArguments>(
                        <ego_contracts.ScriptCommandStartupItem>entry,
                        (args) => args,
                    );
                    break;
            }
        } catch (e) {
            WORKSPACE.logger
                     .trace(e, 'startups.onStartup(1)');
        }
    }

    WORKSPACE.logger
             .info(`Executed all startups.`);
}
