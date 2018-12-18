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
import * as childProcess from 'child_process';
import * as cron from 'cron';
import * as ego_contracts from '../contracts';
import * as ego_helpers from '../helpers';
import * as ego_log from '../log';
import * as ego_workspace from '../workspace';
import * as path from 'path';


/**
 * Name of the key for storing job instances.
 */
export const KEY_JOBS = 'jobs';


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
    );

    if (JOB_ENTRIES.length < 1) {
        return;
    }

    const JOB_LIST: ego_contracts.WorkspaceJob[] = WORKSPACE.instanceState[
        KEY_JOBS
    ];

    JOB_ENTRIES.forEach(entry => {
        if (!ego_helpers.doesMatchPlatformCondition(entry)) {
            return;
        }
        if (!ego_helpers.doesMatchFilterCondition(entry)) {
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
        }
    });
}


function createActionFunction(
    item: ego_contracts.CronJobItem
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
                        const SHELL_ACTION = <ego_contracts.JobItemShellCommandAction>item.action;

                        func = () => {
                            return new Promise((resolve, reject) => {
                                try {
                                    let currentWorkDirectory = WORKSPACE.replaceValues(SHELL_ACTION.cwd);
                                    if ('' === currentWorkDirectory.trim()) {
                                        currentWorkDirectory = WORKSPACE.rootPath;
                                    }
                                    if (!path.isAbsolute(currentWorkDirectory)) {
                                        currentWorkDirectory = path.join(
                                            WORKSPACE.rootPath, currentWorkDirectory
                                        );
                                    }

                                    childProcess.exec(
                                        WORKSPACE.replaceValues(SHELL_ACTION.command),
                                        {
                                            cwd: path.resolve(
                                                currentWorkDirectory
                                            ),
                                        },
                                        (err) => {
                                            if (err) {
                                                reject(err);
                                            } else {
                                                resolve();
                                            }
                                        }
                                    );
                                } catch (e) {
                                    reject(e);
                                }
                            });
                        };
                    }
                    break;

                case 'script':
                    {
                        const SCRIPT_ACTION = <ego_contracts.JobItemScriptAction>item.action;

                        func = async () => {
                            const SCRIPT_PATH = WORKSPACE.replaceValues(
                                SCRIPT_ACTION.script
                            );

                            const FULL_SCRIPT_PATH = WORKSPACE.getExistingFullPath(
                                SCRIPT_PATH
                            );

                            if (false === FULL_SCRIPT_PATH) {
                                throw new Error(`Script '${ SCRIPT_PATH }' not found!`);
                            }

                            const SCRIPT_MODULE = ego_helpers.loadModule<ego_contracts.JobItemScriptActionModule>(
                                FULL_SCRIPT_PATH
                            );
                            if (SCRIPT_MODULE) {
                                if (SCRIPT_MODULE.execute) {
                                    const ARGS: ego_contracts.JobItemScriptActionArguments = {
                                        logger: WORKSPACE.logger,
                                        options: ego_helpers.cloneObject(SCRIPT_ACTION.options),
                                        output: WORKSPACE.output,
                                        replaceValues: (val) => {
                                            return WORKSPACE.replaceValues(val);
                                        },
                                        require: (id) => {
                                            return ego_helpers.requireModule(id);
                                        }
                                    };

                                    await Promise.resolve(
                                        SCRIPT_MODULE.execute
                                            .apply(WORKSPACE, [ ARGS ])
                                    );
                                }
                            }
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

    let cronTime: string | Date | false = false;
    switch (ego_helpers.normalizeString(item.format)) {
        case '':
        case 'crontab':
            cronTime = ego_helpers.toStringSafe(
                item.time
            ).trim();
            break;
    }

    if (false !== cronTime) {
        try {
            const TICK_ACTION = createActionFunction.apply(
                WORKSPACE,
                [ item ]
            );

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
                    }).catch(() => {
                        isExecutingJob = false;
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
                dispose: function() {
                    this.stop();
                },
                isRunning: undefined,
                start: function () {
                    if (!this.isRunning) {
                        NEW_CRON.start();
                        return true;
                    }

                    return false;
                },
                stop: function () {
                    if (this.isRunning) {
                        NEW_CRON.stop();
                        return true;
                    }

                    return false;
                }
            };

            // newJob.isRunning
            Object.defineProperty(newJob, 'isRunning', {
                get: () => {
                    return NEW_CRON.running;
                }
            });
        } catch (e) {
            ego_log.CONSOLE.trace(
                e, `workspaces.reloadJobs(1)`
            );

            ego_helpers.showErrorMessage(
                e
            );
        }
    }

    return newJob;
}
