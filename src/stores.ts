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
import * as ego_contracts from './contracts';
import * as ego_helpers from './helpers';
import * as fsExtra from 'fs-extra';
import * as path from 'path';


type StoreFile = {
    [category: string]: { [key: string]: StoreFileEntry };
};

interface StoreFileEntry {
    type: "binary" | "json";
    value: any;
}


/**
 * A basic store.
 */
export abstract class StoreBase implements ego_contracts.Store {
    /**
     * @inheritdoc
     */
    public get<TValue = any, TDefault = TValue>(key: any, defaultValue?: TDefault): TValue | TDefault {
        const VALUE_TO_RETURN: ego_contracts.BoxedValue<any> = {
            value: defaultValue,
        };

        this.getValue(
            normalizeStoreKey(key), VALUE_TO_RETURN
        );

        return VALUE_TO_RETURN.value;
    }

    /**
     * The logic for the 'get()' method.
     *
     * @param {string} key The key.
     * @param {ego_contracts.BoxedValue<any>} valueToReturn Stores the value to return.
     */
    protected abstract getValue(key: string, valueToReturn: ego_contracts.BoxedValue<any>): void;

    /**
     * @inheritdoc
     */
    public async set(key: any, value: any) {
        const SUCCEEDED: ego_contracts.BoxedValue<boolean> = {
            value: true,
        };

        try {
            await this.setValue(
                normalizeStoreKey(key), value,
                SUCCEEDED
            );
        } catch (e) {
            SUCCEEDED.value = false;
        }

        return ego_helpers.toBooleanSafe(
            SUCCEEDED.value, true
        );
    }

    /**
     * The logic for the 'set()' method.
     *
     * @param {string} key The key.
     * @param {any} value The value to set.
     * @param {ego_contracts.BoxedValue<boolean>} succeeded Indicates if operation was successful or not.
     */
    protected abstract async setValue(key: string, value: any,
                                      succeeded: ego_contracts.BoxedValue<boolean>): Promise<void>;
}

/**
 * Stores data.
 */
export class UserStore extends StoreBase {
    private static readonly _USER_QUEUE = ego_helpers.createQueue();

    /**
     * Initializes a new instance of that class.
     *
     * @param {string} [category] The custom category.
     */
    public constructor(
        public readonly category?: string
    ) {
        super();

        this.file = path.resolve(
            path.join(
                ego_helpers.getExtensionDirInHome(), '.store'
            )
        );

        this.category = ego_helpers.toStringSafe(category);
    }

    /**
     * The file that stores the data.
     */
    public readonly file: string;

    /**
     * @inheritdoc
     */
    protected getValue(key: string, valueToReturn: ego_contracts.BoxedValue<any>): void {
        if (!fsExtra.existsSync(this.file)) {
            return;
        }

        const STORE: StoreFile = JSON.parse(
            fsExtra.readFileSync(
                this.file, 'utf8'
            )
        ) || <any>{};

        const VALUES = STORE[this.category];
        if (!_.isNil(VALUES)) {
            const ENTRY = VALUES[key];
            if (!_.isNil(ENTRY)) {
                switch (ego_helpers.normalizeString(ENTRY.type)) {
                    case 'binary':
                        valueToReturn.value = Buffer.from(
                            ENTRY.value,
                            'base64'
                        );
                        break;

                    default:
                        valueToReturn.value = ENTRY.value;
                        break;
                }
            }
        }
    }

    /**
     * @inheritdoc
     */
    protected async setValue(key: string, value: any, succeeded: ego_contracts.BoxedValue<boolean>) {
        await UserStore._USER_QUEUE.add(async () => {
            let store: StoreFile;
            if (await ego_helpers.isFile(this.file, false)) {
                store = JSON.parse(
                    await fsExtra.readFile(
                        this.file, 'utf8'
                    )
                );
            }
            if (_.isNil(store)) {
                store = <any>{};
            }

            let values = store[this.category];
            if (_.isNil(values)) {
                store[this.category] = values = {};
            }

            if (_.isUndefined(value)) {
                values[key] = undefined;
            } else {
                values[key] = {
                    type: Buffer.isBuffer(value) ? 'binary' : 'json',
                    value: Buffer.isBuffer(value) ? value.toString('base64') : value,
                };
            }

            const DIR = path.dirname(this.file);
            if (!(await ego_helpers.exists(DIR))) {
                await fsExtra.mkdirs(DIR);
            }

            await fsExtra.writeFile(
                this.file,
                JSON.stringify(store, null, 2),
                'utf8'
            );
        });
    }
}


function normalizeStoreKey(key: any): string {
    return ego_helpers.normalizeString(key);
}
