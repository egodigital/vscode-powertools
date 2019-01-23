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
import * as ego_global_values from '../global/values';
import * as ego_helpers from '../helpers';
import * as ego_log from '../log';
import * as ego_pt from '../extension';
import * as vscode from 'vscode';


const GLOBAL_JOBS: ego_contracts.GlobalJob[] = [];
let nextJobButtonCommandId = Number.MIN_SAFE_INTEGER;


function createActionFunction(
    item: ego_contracts.CronJobItem,
    buttonProvider: () => vscode.StatusBarItem,
) {
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
                            await ego_pt.runShellCommand(
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
                            await ego_pt.executeScript<ego_contracts.JobItemScriptActionArguments>(
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
    const SETTINGS: ego_contracts.GlobalExtensionSettings = this;

    let newJob: ego_contracts.GlobalJob;

    const FORMAT = ego_helpers.normalizeString(
        ego_helpers.normalizeString(item.format)
    );

    let cronTime: string | Date | false = false;
    switch (FORMAT) {
        case '':
        case 'crontab':
            cronTime = ego_global_values.replaceValues(
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
                ego_pt.executeCode(
                    item.onDestroyed
                );
            }
        };

        const UPDATE_BUTTON_TEXT = () => {
            const ICON = newJob.isRunning ?
                'primitive-square' : 'triangle-right';

            newButton.text = `$(${ ICON })  ` + ego_global_values.replaceValues(
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
                SETTINGS,
                [
                    item,
                    () => newButton,
                ]
            );

            const GET_NAME = () => {
                let name = ego_global_values.replaceValues(
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

                        ego_log.CONSOLE.trace(
                            err, `global.jobs.reloadJobs(2:${ GET_NAME() })`
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
                const CMD_ID = `ego.power-tools.buttons.globalJobBtn${ ID }`;

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
                    btn.color = ego_global_values.replaceValues(btn.color);
                    btn.tooltip = ego_global_values.replaceValues(btn.tooltip);
                    btn.command = CMD_ID;
                });

                UPDATE_BUTTON();

                newButton.show();
            }
        } catch (e) {
            DISPOSE_BUTTON();

            ego_log.CONSOLE.trace(
                e, `global.jobs.reloadJobs(1)`
            );
        }
    }

    return newJob;
}

/**
 * Disposes all global jobs.
 */
export function disposeGlobalUserJobs() {
    while (GLOBAL_JOBS.length > 0) {
        ego_helpers.tryDispose(
            GLOBAL_JOBS.pop()
        );
    }
}

/**
 * Returns the list of global user jobs.
 *
 * @return {ego_contracts.GlobalJob[]} The list of jobs.
 */
export function getGlobalUserJobs(): ego_contracts.GlobalJob[] {
    return ego_helpers.asArray(
        GLOBAL_JOBS
    );
}

/**
 * Reloads all global jobs.
 */
export async function reloadGlobalUserJobs() {
    const SETTINGS: ego_contracts.GlobalExtensionSettings = this;

    disposeGlobalUserJobs.apply(
        this
    );

    const JOB_ENTRIES = ego_helpers.asArray(
        SETTINGS.jobs
    ).map(j => {
        return ego_pt.importValues(j);
    });
    if (JOB_ENTRIES.length < 1) {
        return;
    }

    const JOB_LIST: ego_contracts.GlobalJob[] = GLOBAL_JOBS;

    JOB_ENTRIES.forEach(entry => {
        if (!ego_helpers.doesMatchPlatformCondition(entry)) {
            return;
        }
        if (!ego_helpers.doesMatchFilterCondition(entry)) {
            return;
        }

        let newJob: ego_contracts.GlobalJob;

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
                ego_pt.executeCode(
                    entry.onCreated
                );
            }
        }
    });
}
