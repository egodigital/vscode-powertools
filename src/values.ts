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
import * as ego_helpers from './helpers';
import * as fsExtra from 'fs-extra';
import * as os from 'os';
import * as path from 'path';


/**
 * Resolve a full (existing) path.
 *
 * @param {string} path The input path.
 *
 * @return {string} The full path or (false) if not found.
 */
export type PathResolver = (path: string) => string | false;

/**
 * Options for 'replaceValues()' function.
 */
export interface ReplaceValuesOptions {
    /**
     * One or more build-in values.
     */
    buildInValues?: ego_contracts.Value | ego_contracts.Value[];
    /**
     * The file resolver.
     */
    pathResolver?: PathResolver;
}

/**
 * Options for 'toValues()' function.
 */
export interface ToValuesOptions {
    /**
     * The file resolver.
     */
    pathResolver?: PathResolver;
}


/**
 * A value running code.
 */
export class CodeValue implements ego_contracts.Value {
    /**
     * Initializes a new instance of that class.
     *
     * @param {string} code The code to execute.
     * @param {ego_contracts.ValueProvider} otherValues Provides the other values.
     * @param {string} [name] The optional name.
     */
    constructor(
        public readonly code: string,
        public readonly otherValues: ego_contracts.ValueProvider,
        public readonly name?: string,
    ) { }

    /**
     * @inheritdoc
     */
    public get value(): any {
        return ego_code.run({
            code: this.code,
            values: toValueStorage(
                this.otherValues()
            ),
        });
    }
}

/**
 * A value from an environment variable.
 */
export class EnvValue implements ego_contracts.Value {
    /**
     * Initializes a new instance of that class.
     *
     * @param {string} name The name of the variable.
     */
    constructor(
        public readonly name: string,
    ) { }

    /**
     * @inheritdoc
     */
    public get value(): any {
        return process.env[
            this.name
        ];
    }
}

/**
 * A value that loads its value from a file.
 */
export class FileValue implements ego_contracts.Value {
    /**
     * Initializes a new instance of that class.
     *
     * @param {string} file The path to the file.
     * @param {string} format The (target) data format.
     * @param {PathResolver} resolvePath The function that resolves a (relative) path.
     * @param {string} [name] The optional name.
     */
    constructor(
        public readonly file: string,
        public readonly format: string,
        public readonly resolvePath: PathResolver,
        public readonly name?: string,
    ) {
        if (!this.resolvePath) {
            this.resolvePath = (p) => {
                p = ego_helpers.toStringSafe(p);

                if (path.isAbsolute(p)) {
                    p = path.resolve(p);

                    if (fsExtra.existsSync(p)) {
                        return p;
                    }
                } else {
                    const LOOKUPS = [
                        // extension's suf folder
                        // inside user's home directory
                        ego_helpers.getExtensionDirInHome(),
                    ];

                    for (const LU of LOOKUPS) {
                        const FULL_PATH = path.resolve(
                            path.join(LU, p)
                        );

                        if (fsExtra.existsSync(FULL_PATH)) {
                            return FULL_PATH;
                        }
                    }
                }

                return false;
            };
        }
    }

    /**
     * @inheritdoc
     */
    public get value(): any {
        const FULL_PATH = this.resolvePath(
            this.file
        );
        if (false !== FULL_PATH) {
            const BLOB: Buffer = fsExtra.readFileSync(
                FULL_PATH
            );

            switch (ego_helpers.normalizeString(this.format)) {
                case '':
                case 'str':
                case 'string':
                    return BLOB.toString('utf8');

                case 'b64':
                case 'base64':
                    return BLOB.toString('base64');

                case 'json':
                    return JSON.parse(
                        BLOB.toString('utf8')
                    );

                default:
                    return BLOB;
            }
        }
    }
}

/**
 * A value that uses a function.
 */
export class FunctionValue implements ego_contracts.Value {
    /**
     * Initializes a new instance of that class.
     *
     * @param {Function} _FUNCTION The function that provides the value.
     * @param {string} [name] The optional name.
     */
    constructor(
        private readonly _FUNCTION: () => any,
        public readonly name?: string,
    ) { }

    /**
     * @inheritdoc
     */
    public get value(): any {
        return this._FUNCTION();
    }
}

/**
 * A static value.
 */
export class StaticValue implements ego_contracts.Value {
    /**
     * Initializes a new instance of that class.
     *
     * @param {any} value The value.
     * @param {string} [name] The optional name.
     */
    constructor(
        public readonly value: any,
        public readonly name?: string,
    ) { }
}


/**
 * Returns the list of global values.
 *
 * @return { ego_contracts.Value[]} The global values.
 */
export function getGlobalValues(): ego_contracts.Value[] {
    const VALUES: ego_contracts.Value[] = [
        // ${appDir}
        new FunctionValue(() => {
            return ego_helpers.getAppsDir();
        }, 'appDir'),
        // ${cwd}
        new FunctionValue(() => {
            return process.cwd();
        }, 'cwd'),
        // ${EOL}
        new FunctionValue(() => {
            return os.EOL;
        }, 'EOL'),
        // ${extensionDir}
        new FunctionValue(() => {
            return ego_helpers.getExtensionDirInHome();
        }, 'extensionDir'),
        // ${homeDir}
        new FunctionValue(() => {
            return os.homedir();
        }, 'homeDir'),
        // ${hostName}
        new FunctionValue(() => {
            return os.hostname();
        }, 'hostName'),
        // ${tempDir}
        new FunctionValue(() => {
            return os.tmpdir();
        }, 'tempDir'),
        // ${userName}
        new FunctionValue(() => {
            return os.userInfo()
                .username;
        }, 'userName'),
    ];

    // environment variables
    for (const ENV_NAME in process.env) {
        VALUES.push(new EnvValue(
            ENV_NAME
        ));
    }

    return VALUES;
}

/**
 * Handles a value as string and replaces placeholders.
 *
 * @param {ego_contracts.WithValues} obj The object with value entries.
 * @param {any} val The input value.
 * @param {opts} [opts] Additional options.
 *
 * @return {string} The output value.
 */
export function replaceValues(
    obj: ego_contracts.WithValues, val: any,
    opts?: ReplaceValuesOptions
): string {
    val = ego_helpers.toStringSafe(val);

    if (!opts) {
        opts = <any>{};
    }

    const ALL_VALUES = getGlobalValues().concat(
        ego_helpers.asArray(
            opts.buildInValues
        )
    ).concat(
        toValues(obj, {
            pathResolver: opts.pathResolver,
        })
    );

    return replaceValuesByObjects(
        ALL_VALUES, val
    );
}

/**
 * Handles a value as string and replaces placeholders (by objects).
 *
 * @param {ego_contracts.Value|ego_contracts.Value[]} objs One or more values.
 * @param {any} val The input value.
 *
 * @return {string} The output value.
 */
export function replaceValuesByObjects(
    objs: ego_contracts.Value | ego_contracts.Value[], val: any,
): string {
    objs = ego_helpers.asArray(objs);

    // ${VALUE_NAME}
    val = val.replace(/(\$)(\{)([^\}]*)(\})/gm, (match, varIdentifier, openBracket, varName: string, closedBracked) => {
        let newValue = ego_helpers.toStringSafe(
            match
        );

        varName = ego_helpers.normalizeString(varName);

        const LAST_VALUE = ego_helpers.from(<ego_contracts.Value[]>objs).lastOrDefault(v => {
            return ego_helpers.normalizeString(v.name) === varName;
        }, false);

        if (false !== LAST_VALUE) {
            newValue = ego_helpers.toStringSafe(
                LAST_VALUE.value
            );
        }

        return newValue;
    });

    return val;
}

/**
 * Creates value objects from a storage of value entries.
 *
 * @param {ego_contracts.WithValues} obj The object with value entries.
 * @param {ToValuesOptions} [opts] Custom options.
 *
 * @return {ego_contracts.Value[]} The list of value objects.
 */
export function toValues(
    obj: ego_contracts.WithValues,
    opts?: ToValuesOptions,
): ego_contracts.Value[] {
    if (!opts) {
        opts = <any>{};
    }

    const VALUES: ego_contracts.Value[] = [];

    if (obj) {
        const ALL_ENTRIES = obj.values;
        if (ALL_ENTRIES) {
            _.forIn(ALL_ENTRIES, (entry, key) => {
                const NAME = ego_helpers.normalizeString(key);

                let valueItem: ego_contracts.ValueItem | false = false;
                if (!_.isNil(entry)) {
                    if (_.isObjectLike(entry)) {
                        valueItem = <ego_contracts.ValueItem>entry;
                    } else {
                        valueItem = <ego_contracts.StaticValueItem>{
                            value: entry
                        };
                    }
                }

                if (false !== valueItem) {
                    if (ego_helpers.doesMatchPlatformCondition(valueItem)) {
                        if (ego_helpers.doesMatchFilterCondition(valueItem)) {
                            switch (ego_helpers.normalizeString(valueItem.type)) {
                                case '':
                                case 'static':
                                    {
                                        const STATIC_ITEM = <ego_contracts.StaticValueItem>valueItem;

                                        VALUES.push(
                                            new StaticValue(
                                                STATIC_ITEM.value,
                                                NAME,
                                            )
                                        );
                                    }
                                    break;

                                case 'code':
                                    {
                                        const CODE_ITEM = <ego_contracts.CodeValueItem>valueItem;

                                        VALUES.push(
                                            new CodeValue(
                                                CODE_ITEM.code,
                                                () => {
                                                    return VALUES.filter(v => {
                                                        return NAME !== ego_helpers.normalizeString(v.name);
                                                    });
                                                },
                                                NAME,
                                            )
                                        );
                                    }
                                    break;

                                case 'file':
                                    {
                                        const FILE_ITEM = <ego_contracts.FileValueItem>valueItem;

                                        VALUES.push(
                                            new FileValue(
                                                FILE_ITEM.file,
                                                FILE_ITEM.format,
                                                opts.pathResolver,
                                                NAME,
                                            )
                                        );
                                    }
                                    break;
                            }
                        }
                    }
                }
            });
        }
    }

    return VALUES;
}

/**
 * Converts a list of value objects to a grouped storage (object).
 *
 * @return {ego_contracts.ValueStorage} The storage.
 */
export function toValueStorage(values: ego_contracts.Value | ego_contracts.Value[]): ego_contracts.ValueStorage {
    values = ego_helpers.asArray(
        values
    );

    const STORAGE: ego_contracts.ValueStorage = {};
    values.forEach(v => {
        Object.defineProperty(STORAGE, v.name, {
            configurable: true,
            enumerable: true,
            get: () => {
                return v.value;
            },
        });
    });

    return STORAGE;
}
