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
import * as cron from 'cron';
import * as ego_contracts from '../contracts';
import * as ego_helpers from '../helpers';
import * as ego_workspace from '../workspace';
import * as vscode from 'vscode';


/**
 * Name of the key for storing job instances.
 */
export const KEY_JOBS = 'jobs';
let nextJobButtonCommandId = Number.MIN_SAFE_INTEGER;


function createActionFunction(
    item: ego_contracts.CronJobItem,
    buttonProvider: () => vscode.StatusBarItem,
) {
    const WORKSPACE: ego_workspace.Workspace = this;

    let func: Function;

    if (item.action) {
        let jobAction: ego_contracts.JobItemAction;
        if (_.isObjectLike(item.action)) {
            jobAction = <ego_contracts.JobItemAction>item.action;
        } else {
            jobAction = <ego_contracts.JobItemShellCommandAction>{
                command: ego_helpers.toStringSafe(
                    item.action
                ),
            };
        }

        if (jobAction) {
            switch (ego_helpers.normalizeString(jobAction.type)) {
                case '':
                case 'shell':
                    {
                        func = async () => {
                            await WORKSPACE.runShellCommand(
                                <ego_contracts.JobItemShellCommandAction>item.action,
                                {
                                    noProgress: true,
                                }
                            );
                        };
                    }
                    break;

                case 'script':
                    {
                        func = async () => {
                            await WORKSPACE.executeScript<ego_contracts.JobItemScriptActionArguments>(
                                <ego_contracts.JobItemScriptAction>item.action,
                                (args) => {
                                    // args.button
                                    Object.defineProperty(args, 'button', {
                                        enumerable: true,
                                        get: () => {
                                            return buttonProvider();
                                        }
                                    });

                                    return args;
                                },
                            );
                        };
                    }
                    break;
            }
        }
    }

    return func;
}

function createNewCronJob(item: ego_contracts.CronJobItem) {
    const WORKSPACE: ego_workspace.Workspace = this;

    let newJob: ego_contracts.WorkspaceJob;

    const FORMAT = ego_helpers.normalizeString(
        ego_helpers.normalizeString(item.format)
    );

    let cronTime: string | Date | false = false;
    switch (FORMAT) {
        case '':
        case 'crontab':
            cronTime = WORKSPACE.replaceValues(
                item.time
            ).trim();
            break;
    }

    if (false !== cronTime) {
        let newButton: vscode.StatusBarItem;
        let newButtonCommand: vscode.Disposable;

        const DISPOSE_BUTTON = () => {
            ego_helpers.tryDispose(newButton);
            ego_helpers.tryDispose(newButtonCommand);
        };
        const EXECUTE_ON_DESTROYED = () => {
            if (!_.isNil(item.onDestroyed)) {
                WORKSPACE.executeCode(
                    item.onDestroyed
                );
            }
        };

        const UPDATE_BUTTON_TEXT = () => {
            const ICON = newJob.isRunning ?
                'primitive-square' : 'triangle-right';

            newButton.text = `$(${ ICON })  ` + WORKSPACE.replaceValues(
                item.button.text
            ).trim();
        };

        const UPDATE_BUTTON = () => {
            if (newButton && item.button) {
                UPDATE_BUTTON_TEXT();
            }
        };

        try {
            const TICK_ACTION = createActionFunction.apply(
                WORKSPACE,
                [
                    item,
                    () => newButton,
                ]
            );

            const GET_NAME = () => {
                let name = WORKSPACE.replaceValues(
                    item.name
                ).trim();
                if ('' === name) {
                    name = <string>cronTime;
                }

                return name;
            };

            const GET_DESCRIPTION = () => {
                let description = ego_helpers.toStringSafe(
                    item.description
                ).trim();
                if ('' === description) {
                    description = undefined;
                }

                return description;
            };

            let isExecutingJob = false;
            const NEW_CRON = new cron.CronJob(
                cronTime,
                () => {
                    if (isExecutingJob) {
                        return;
                    }

                    isExecutingJob = true;
                    (async () => {
                        if (TICK_ACTION) {
                            return await Promise.resolve(
                                TICK_ACTION()
                            );
                        }
                    })().then(() => {
                        isExecutingJob = false;
                    }).catch((err) => {
                        isExecutingJob = false;

                        WORKSPACE.logger.trace(
                            err, `jobs.reloadJobs(2:${ GET_NAME() })`
                        );
                    });
                },
                null,  // onComplete()
                false,  // start
                null,  // timeZone
                null,  // context
                false,  // runOnInit
            );

            if (ego_helpers.toBooleanSafe(item.autoStart, true)) {
                NEW_CRON.start();
            }

            newJob = {
                description: undefined,
                dispose: function() {
                    DISPOSE_BUTTON();

                    if (this.isRunning) {
                        this.stop();
                    }

                    EXECUTE_ON_DESTROYED();
                },
                isRunning: undefined,
                name: undefined,
                start: function () {
                    if (!this.isRunning) {
                        isExecutingJob = false;
                        NEW_CRON.start();

                        UPDATE_BUTTON();
                        return true;
                    }

                    return false;
                },
                stop: function () {
                    if (this.isRunning) {
                        NEW_CRON.stop();
                        isExecutingJob = false;

                        UPDATE_BUTTON();
                        return true;
                    }

                    return false;
                }
            };

            // newJob.description
            Object.defineProperty(newJob, 'description', {
                enumerable: true,
                get: () => {
                    return GET_DESCRIPTION();
                }
            });

            // newJob.isRunning
            Object.defineProperty(newJob, 'isRunning', {
                enumerable: true,
                get: () => {
                    return NEW_CRON.running;
                }
            });

            // newJob.name
            Object.defineProperty(newJob, 'name', {
                enumerable: true,
                get: () => {
                    return GET_NAME();
                }
            });

            if (item.button) {
                const ID = nextJobButtonCommandId++;
                const CMD_ID = `ego.power-tools.buttons.jobBtn${ ID }`;

                newButtonCommand = vscode.commands.registerCommand(CMD_ID, async () => {
                    try {
                        if (newJob.isRunning) {
                            newJob.stop();
                        } else {
                            newJob.start();
                        }
                    } catch (e) {
                        ego_helpers.showErrorMessage(e);
                    }
                });

                newButton = ego_helpers.buildButtonSync(item.button, (btn) => {
                    btn.color = WORKSPACE.replaceValues(btn.color);
                    btn.tooltip = WORKSPACE.replaceValues(btn.tooltip);
                    btn.command = CMD_ID;
                });

                UPDATE_BUTTON();

                newButton.show();
            }
        } catch (e) {
            DISPOSE_BUTTON();

            WORKSPACE.logger.trace(
                e, `jobs.reloadJobs(1)`
            );
        }
    }

    return newJob;
}

/**
 * Disposes all workspace jobs.
 */
export function disposeJobs() {
    const WORKSPACE: ego_workspace.Workspace = this;

    const COMMAND_LIST: ego_contracts.WorkspaceJob[] = WORKSPACE.instanceState[
        KEY_JOBS
    ];
    while (COMMAND_LIST.length > 0) {
        const CMD = COMMAND_LIST.pop();

        ego_helpers.tryDispose(CMD);
    }
}

/**
 * Reloads all workspace jobs.
 */
export async function reloadJobs() {
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

    disposeJobs.apply(
        this
    );

    const JOB_ENTRIES = ego_helpers.asArray(
        SETTINGS.jobs
    ).map(j => {
        return WORKSPACE.importValues(j);
    });
    if (JOB_ENTRIES.length < 1) {
        return;
    }

    const JOB_LIST: ego_contracts.WorkspaceJob[] = WORKSPACE.instanceState[
        KEY_JOBS
    ];

    JOB_ENTRIES.forEach(entry => {
        if (!WORKSPACE.doesMatchPlatformCondition(entry)) {
            return;
        }
        if (!WORKSPACE.doesMatchFilterCondition(entry)) {
            return;
        }

        let newJob: ego_contracts.WorkspaceJob;

        switch (ego_helpers.normalizeString(entry.type)) {
            case '':
            case 'cron':
            case 'scheduled':
                newJob = createNewCronJob.apply(
                    this,
                    [ entry ]
                );
                break;
        }

        if (newJob) {
            JOB_LIST.push(
                newJob
            );

            if (!_.isNil(entry.onCreated)) {
                WORKSPACE.executeCode(
                    entry.onCreated
                );
            }
        }
    });
}

/**
 * Restarts all running workspace jobs.
 */
export async function restartAllJobs() {
    const JOBS = ego_helpers.from(
        ego_workspace.getAllWorkspaces()
    ).selectMany(ws => ws.getJobs())
     .where(j => j.isRunning)
     .toArray();

    await vscode.window.withProgress({
        cancellable: true,
        location: vscode.ProgressLocation.Notification,
    }, async (progress, token) => {
        for (let i = 0; i < JOBS.length; i++) {
            if (token.isCancellationRequested) {
                return;
            }

            const J = JOBS[i];

            try {
                progress.report({
                    message: `Restarting job '${ J.name }' ...`,
                    increment: 1 / JOBS.length * 100.0,
                });

                if (J.isRunning) {
                    J.stop();
                }

                if (!J.isRunning) {
                    J.start();
                }
            } catch (e) {
                ego_helpers.showErrorMessage(e);
            }
        }
    });
}

/**
 * Starts all non-running workspace jobs.
 */
export async function startAllJobs() {
    const JOBS = ego_helpers.from(
        ego_workspace.getAllWorkspaces()
    ).selectMany(ws => ws.getJobs())
     .where(j => !j.isRunning)
     .toArray();

    await vscode.window.withProgress({
        cancellable: true,
        location: vscode.ProgressLocation.Notification,
    }, async (progress, token) => {
        for (let i = 0; i < JOBS.length; i++) {
            if (token.isCancellationRequested) {
                return;
            }

            const J = JOBS[i];

            try {
                progress.report({
                    message: `Starting job '${ J.name }' ...`,
                    increment: 1 / JOBS.length * 100.0,
                });

                if (!J.isRunning) {
                    J.start();
                }
            } catch (e) {
                ego_helpers.showErrorMessage(e);
            }
        }
    });
}

/**
 * Stops all running workspace jobs.
 */
export async function stopAllJobs() {
    const JOBS = ego_helpers.from(
        ego_workspace.getAllWorkspaces()
    ).selectMany(ws => ws.getJobs())
     .where(j => j.isRunning)
     .toArray();

    await vscode.window.withProgress({
        cancellable: true,
        location: vscode.ProgressLocation.Notification,
    }, async (progress, token) => {
        for (let i = 0; i < JOBS.length; i++) {
            if (token.isCancellationRequested) {
                return;
            }

            const J = JOBS[i];

            try {
                progress.report({
                    message: `Stopping job '${ J.name }' ...`,
                    increment: 1 / JOBS.length * 100.0,
                });

                if (J.isRunning) {
                    J.stop();
                }
            } catch (e) {
                ego_helpers.showErrorMessage(e);
            }
        }
    });
}
