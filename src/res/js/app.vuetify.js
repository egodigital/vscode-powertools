

/**
 * Checks if a value is (null) or (undefined).
 *
 * @param {any} val The balue to check.
 * 
 * @return {Boolean} Is (null) or (undefined).
 */
function ego_is_nil(val) {
    return 'undefined' === typeof val ||
        null === val;
}

/**
 * Converts a value to a string, which is not (null) and (undefined), if needed.
 *
 * @param {any} val The value to convert.
 * 
 * @return {String} The value as string.
 */
function ego_to_string(val) {
    if ('string' === typeof val) {
        return val;
    }

    if (ego_is_nil(val)) {
        return '';
    }

    if (val instanceof Error) {
        return `[${val.name}] '${val.message}'

${val.stack}`;
    }

    if ('function' === typeof val['toString']) {
        return String(val.toString());
    }

    return String(val);
}


// message from VSCode (code behind)
window.addEventListener('message', (e) => {
    if (!e) {
        return;
    }

    const MESSAGE = e.data;
    if (!MESSAGE) {
        return;
    }

    const COMMAND = ego_to_string(MESSAGE.command)
        .trim();
    if ('' === COMMAND) {
        return;
    }

    if ('undefined' === typeof EGO_VUE) {
        return;
    }

    if (!EGO_VUE.onCommand) {
        return;
    }

    try {
        Promise.resolve(
            EGO_VUE.onCommand(COMMAND, MESSAGE.data)
        ).catch((err) => {
            ego_log(err);
        });
    } catch (e) {
        ego_log(e);
    }
});
