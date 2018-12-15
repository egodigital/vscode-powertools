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
import * as ego_helpers from './helpers';
import * as fsExtra from 'fs-extra';
import * as os from 'os';
import * as path from 'path';


const NEW_CONSOLE_LOGGER = ego_helpers.createLogger();

// write to console
NEW_CONSOLE_LOGGER.addAction((ctx) => {
    let msg: string;
    if (_.isObjectLike(ctx.message)) {
        msg = JSON.stringify(ctx.message, null, 2);
    } else {
        msg = ego_helpers.toStringSafe(ctx.message);
    }

    let func: (message?: any, ...optionalParams: any[]) => void = console.log;

    if (ctx.type <= ego_helpers.LogType.Err) {
        func = console.error;
    } else {
        switch (ctx.type) {
            case ego_helpers.LogType.Info:
            case ego_helpers.LogType.Notice:
                func = console.info;
                break;

            case ego_helpers.LogType.Trace:
                func = console.trace;
                break;

            case ego_helpers.LogType.Warn:
                func = console.warn;
                break;
        }
    }

    let typePrefix = '';

    let tagPrefix = '';
    if (!ego_helpers.isEmptyString(ctx.tag)) {
        tagPrefix = ' :: ' + ego_helpers.normalizeString(ctx.tag);
    }

    msg = `[vscode-powertools]\n[${ ctx.time.format('YYYY-MM-DD HH:mm:ss') }${ typePrefix }${ tagPrefix }] => ${ msg }\n`;

    func.apply(console,
               [ msg ]);
});

// write to file inside home directory
NEW_CONSOLE_LOGGER.addAction((ctx) => {
    const LOGS_DIR = ego_helpers.getExtensionDirInHome();
    if (!fsExtra.existsSync(LOGS_DIR)) {
        fsExtra.mkdirsSync(LOGS_DIR);
    }

    let logType = ctx.type;
    if (_.isNil(logType)) {
        logType = ego_helpers.LogType.Debug;
    }

    const TIME = ego_helpers.asUTC(ctx.time);

    if (ego_helpers.LogType.Trace !== ctx.type) {
        if (ctx.type > ego_helpers.LogType.Info) {
            return;
        }
    }

    let msg = `${ ego_helpers.LogType[logType].toUpperCase().trim() }`;

    const TAG = ego_helpers.normalizeString(
        _.replace(
            ego_helpers.normalizeString(ctx.tag),
            /\s/ig,
            '_'
        )
    );
    if ('' !== TAG) {
        msg += ' ' + TAG;
    }

    let logMsg = ego_helpers.toStringSafe(ctx.message);
    if (ego_helpers.LogType.Trace === ctx.type) {
        const STACK = ego_helpers.toStringSafe(
            (new Error()).stack
        ).split("\n").filter(l => {
            return l.toLowerCase()
                    .trim()
                    .startsWith('at ');
        }).join("\n");

        logMsg += `\n\nStack:\n${ STACK }`;
    }

    msg += ` - [${ TIME.format('DD/MMM/YYYY:HH:mm:ss') } +0000] "${
        _.replace(logMsg, /"/ig, '\\"')
    }"${ os.EOL }`;

    const LOG_FILE = path.resolve(
        path.join(
            LOGS_DIR,
            `${TIME.format('YYYYMMDD')}.log`
        )
    );

    fsExtra.appendFileSync(LOG_FILE, msg, 'utf8');
});



/**
 * The global console logger.
 */
export const CONSOLE: ego_helpers.Logger = NEW_CONSOLE_LOGGER;

/**
 * List of log icons.
 */
export const LOG_ICONS: { [type: number]: string } = {
};
LOG_ICONS[ego_helpers.LogType.Emerg] = '🚑';
LOG_ICONS[ego_helpers.LogType.Alert] = '🚨';
LOG_ICONS[ego_helpers.LogType.Crit] = '🌡';
LOG_ICONS[ego_helpers.LogType.Err] = '❌';
LOG_ICONS[ego_helpers.LogType.Warn] = '⚠️';
LOG_ICONS[ego_helpers.LogType.Notice] = '📢';
// LOG_ICONS[vscode_helpers.LogType.Info] = 'ℹ️';
LOG_ICONS[ego_helpers.LogType.Debug] = '🐞';
LOG_ICONS[ego_helpers.LogType.Trace] = '🧾';
