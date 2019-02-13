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
import * as ego_settings_global from './settings/global';
import * as ego_log from './log';
const opn = require('opn');
import * as vscode from 'vscode';


interface BoardReference {
    id: string;
    name: string;
    url: string;
}

interface BoardResult extends Result<BoardReference> {
}

interface TeamProjectReference {
    description: string;
    id: string;
    name: string;
    url: string;
}

interface TeamProjectResult extends Result<TeamProjectReference> {
}

interface Result<TObject> {
    count: number;
    value: TObject[];
}

interface WebApiTeamReference {
    description: string;
    id: string;
    name: string;
    url: string;
}

interface WebApiTeamResult extends Result<WebApiTeamReference> {
}


class TeamProject {
    constructor(
        public readonly credentials: ego_contracts.AzureDevOpsAPICredentials,
        public readonly azureObject: TeamProjectReference
    ) { }

    public async getTeams(): Promise<WebApiTeam[]> {
        const RESULT: WebApiTeamResult = await vscode.window.withProgress({
            cancellable: false,
            location: vscode.ProgressLocation.Window,
            title: 'Azure DevOps Teams',
        }, async (progress) => {
            progress.report({
                message: 'Loading teams ...',
            });

            const RESPONSE = await ego_helpers.GET(`https://dev.azure.com/${ encodeURIComponent(this.credentials.organization) }/_apis/projects/${ encodeURIComponent(this.azureObject.id) }/teams?api-version=5.0`, {
                'Authorization': 'Basic ' + this.credentials.toBase64(),
            });

            if (200 !== RESPONSE.code) {
                throw new Error(`Unexpected Response: [${ RESPONSE.code }] '${ RESPONSE.status }'`);
            }

            return JSON.parse(
                (await RESPONSE.readBody())
                    .toString('utf8')
            );
        });

        return ego_helpers.from(
            RESULT.value
        ).orderBy(t => ego_helpers.normalizeString(t.name))
         .select(t => new WebApiTeam(this, t))
         .toArray();
    }

    public async openInBrower() {
        const BORWSER_URL = `https://${ encodeURIComponent(this.credentials.organization) }.visualstudio.com/${ encodeURIComponent(this.azureObject.name) }`;

        opn(BORWSER_URL, {
            wait: false
        });
    }
}

class WebApiTeam {
    constructor(
        public readonly project: TeamProject,
        public readonly azureObject: WebApiTeamReference,
    ) { }

    public async getBoards(): Promise<Board[]> {
        const RESULT: BoardResult = await vscode.window.withProgress({
            cancellable: false,
            location: vscode.ProgressLocation.Window,
            title: 'Azure DevOps Boards',
        }, async (progress) => {
            progress.report({
                message: 'Loading boards ...',
            });

            const RESPONSE = await ego_helpers.GET(`https://dev.azure.com/${ encodeURIComponent(this.credentials.organization) }/${ encodeURIComponent(this.project.azureObject.id) }/${ encodeURIComponent(this.azureObject.id) }/_apis/work/boards?api-version=5.0`, {
                'Authorization': 'Basic ' + this.credentials.toBase64(),
            });

            if (200 !== RESPONSE.code) {
                throw new Error(`Unexpected Response: [${ RESPONSE.code }] '${ RESPONSE.status }'`);
            }

            return JSON.parse(
                (await RESPONSE.readBody())
                    .toString('utf8')
            );
        });

        return ego_helpers.from(
            RESULT.value
        ).orderBy(b => ego_helpers.normalizeString(b.name))
         .select(b => new Board(this, b))
         .toArray();
    }

    public get credentials() {
        return this.project
            .credentials;
    }
}

class Board {
    constructor(
        public readonly team: WebApiTeam,
        public readonly azureObject: BoardReference,
    ) { }

    public get credentials() {
        return this.team
            .credentials;
    }

    public async openInBrowser() {
        const BROWSER_URL = `https://egodigital.visualstudio.com/${
            encodeURIComponent(this.team.project.azureObject.name)
        }/_boards/board/t/${
            encodeURIComponent(this.team.azureObject.name)
        }/${
            encodeURIComponent(this.azureObject.name)
        }`;

        await opn(BROWSER_URL, {
            wait: false,
        });
    }
}


/**
 * Tries to return the Azure DevOps API credentials.
 *
 * @param {vscode.ExtensionContext} extension The underlying extension (context).
 *
 * @return {string|false} The credentials or (false) if not found.
 */
export function getAzureDevOpsAPICredentials(extension: vscode.ExtensionContext): ego_contracts.AzureDevOpsAPICredentials | false {
    let organization: string;
    let username: string;
    let pat: string;

    // first try workspace
    try {
        organization = ego_helpers.normalizeString(
            extension.workspaceState
                .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_WORKSPACE_ORG)
        );

        username = ego_helpers.normalizeString(
            extension.workspaceState
                .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_WORKSPACE_USERNAME)
        );

        pat = ego_helpers.toStringSafe(
            extension.workspaceState
                .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_WORKSPACE_PAT)
        ).trim();
    } catch (e) {
        ego_log.CONSOLE
            .trace(e, 'azure.getAzureDevOpsPAT(1)');
    }

    if (ego_helpers.isEmptyString(pat)) {
        // now try global

        try {
            organization = ego_helpers.normalizeString(
                extension.globalState
                    .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_GLOBAL_ORG)
            );

            username = ego_helpers.normalizeString(
                extension.globalState
                    .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_GLOBAL_USERNAME)
            );

            pat = ego_helpers.toStringSafe(
                extension.globalState
                    .get(ego_contracts.KEY_GLOBAL_SETTING_AZURE_DEVOPS_GLOBAL_PAT)
            ).trim();
        } catch (e) {
            ego_log.CONSOLE
                .trace(e, 'azure.getAzureDevOpsPAT(2)');
        }
    }

    if (ego_helpers.isEmptyString(organization) || ego_helpers.isEmptyString(username) || ego_helpers.isEmptyString(pat)) {
        return false;
    }

    return {
        organization: organization,
        pat: pat,
        toBase64: function() {
            return (new Buffer(`${ this.username }:${ this.pat }`, 'ascii'))
                .toString('base64');
        },
        username: username,
    };
}

/**
 * Shows actions for Azure DevOps operations.
 *
 * @param {vscode.ExtensionContext} extension The underlying extension (context).
 * @param {vscode.OutputChannel} output The underlying output channel.
 */
export async function showAzureDevOpsActions(
    extension: vscode.ExtensionContext,
    output: vscode.OutputChannel,
) {
    const API_CRED = getAzureDevOpsAPICredentials(extension);
    if (!API_CRED) {
        vscode.window.showWarningMessage(
            'Please define the API credentials in the global settings!'
        );

        await ego_settings_global.openGlobalSettings(extension, 'azuredevops');

        return;
    }

    const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = [
        {
            'action': async () => {
                await showAzureDevOpsProjectActions(API_CRED);
            },
            'label': 'Projects ...',
            'description': 'Opens a project.'
        }
    ];

    const SELECTED_ITEM = await vscode.window.showQuickPick(
        QUICK_PICKS
    );

    if (SELECTED_ITEM) {
        await Promise.resolve(
            SELECTED_ITEM.action()
        );
    }
}

async function showAzureDevOpsBoardSelector(team: WebApiTeam) {
    const BOARDS = await team.getBoards();

    const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = ego_helpers.from(
        BOARDS.map(b => {
            return {
                action: async () => {
                    await b.openInBrowser();
                },
                label: b.azureObject.name,
            };
        })
    ).orderBy(qp => ego_helpers.normalizeString(qp.label))
     .toArray();

     if (!QUICK_PICKS.length) {
        vscode.window.showWarningMessage(
            'No board found!'
        );

        return;
    }

    let selectedItem: ego_contracts.ActionQuickPickItem;
    if (1 === QUICK_PICKS.length) {
        selectedItem = QUICK_PICKS[0];
    } else {
        selectedItem = await vscode.window.showQuickPick(
            QUICK_PICKS,
            {
                canPickMany: false,
                ignoreFocusOut: true,
                placeHolder: 'Please select a board ...'
            }
        );
    }

    if (selectedItem) {
        await selectedItem.action();
    }
}

async function showAzureDevOpsProjectActions(cred: ego_contracts.AzureDevOpsAPICredentials) {
    const RESULT: TeamProjectResult = await vscode.window.withProgress({
        cancellable: false,
        location: vscode.ProgressLocation.Window,
        title: 'Azure DevOps Projects',
    }, async (progress) => {
        progress.report({
            message: 'Loading projects ...',
        });

        const RESPONSE = await ego_helpers.GET(`https://dev.azure.com/${ encodeURIComponent(cred.organization) }/_apis/projects?api-version=5.0`, {
            'Authorization': 'Basic ' + cred.toBase64(),
        });

        if (200 !== RESPONSE.code) {
            throw new Error(`Unexpected Response: [${ RESPONSE.code }] '${ RESPONSE.status }'`);
        }

        return JSON.parse(
            (await RESPONSE.readBody())
                .toString('utf8')
        );
    });

    const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = ego_helpers.from(
        RESULT.value.map(p => {
            const PROJ = new TeamProject(cred, p);

            return {
                action: async () => {
                    await showAzureDevOpsTeamSelector(PROJ);
                },
                description: p.description,
                label: p.name,
            };
        })
    ).orderBy(qp => ego_helpers.normalizeString(qp.label))
     .toArray();

    if (!QUICK_PICKS.length) {
        vscode.window.showWarningMessage(
            'No project found!'
        );

        return;
    }

    let selectedItem: ego_contracts.ActionQuickPickItem;
    if (1 === QUICK_PICKS.length) {
        selectedItem = QUICK_PICKS[0];
    } else {
        selectedItem = await vscode.window.showQuickPick(
            QUICK_PICKS,
            {
                canPickMany: false,
                ignoreFocusOut: true,
                placeHolder: 'Please select a project ...'
            }
        );
    }

    if (selectedItem) {
        await selectedItem.action();
    }
}

async function showAzureDevOpsTeamActions(team: WebApiTeam) {
    const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = [
        {
            action: async () => {
                await showAzureDevOpsBoardSelector(team);
            },
            label: 'Boards ...',
            description: 'Selects a board.'
        }
    ];

    const SELECTED_ITEM = await vscode.window.showQuickPick(
        QUICK_PICKS,
        {
            canPickMany: false,
            ignoreFocusOut: true,
            placeHolder: 'Please select a board ...'
        }
    );

    if (SELECTED_ITEM) {
        await SELECTED_ITEM.action();
    }
}

async function showAzureDevOpsTeamSelector(proj: TeamProject) {
    const TEAMS = await proj.getTeams();

    const QUICK_PICKS: ego_contracts.ActionQuickPickItem[] = ego_helpers.from(
        TEAMS.map(t => {
            return {
                action: async () => {
                    await showAzureDevOpsTeamActions(t);
                },
                description: t.azureObject.description,
                label: t.azureObject.name,
            };
        })
    ).orderBy(qp => ego_helpers.normalizeString(qp.label))
     .toArray();

    if (!QUICK_PICKS.length) {
        vscode.window.showWarningMessage(
            'No team found!'
        );

        return;
    }

    let selectedItem: ego_contracts.ActionQuickPickItem;
    if (1 === QUICK_PICKS.length) {
        selectedItem = QUICK_PICKS[0];
    } else {
        selectedItem = await vscode.window.showQuickPick(
            QUICK_PICKS,
            {
                canPickMany: false,
                ignoreFocusOut: true,
                placeHolder: 'Please select a team ...'
            }
        );
    }

    if (selectedItem) {
        await selectedItem.action();
    }
}
