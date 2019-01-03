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


/**
 * Applies syntax highlighting to the elements of the current selector.
 * 
 * @param {JQuery} selector The selector.
 */
function ego_apply_highlight(selector) {
    if (arguments.length < 1) {
        selector = $('main');
    }

    selector.find('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });
}


/**
 * Creates an element from Markdown.
 *
 * @param {String} md The markdown content.
 * @param {String} tag The name of the root tag. Default: div
 * 
 * @return {JQuery} The new element.
 */
function ego_from_markdown(md, tag) {
    if (arguments.length < 2) {
        tag = 'div';
    }

    const CONVERTER = new showdown.Converter();

    const HTML = CONVERTER.makeHtml( ego_to_string(md) );

    const CONTENT = $(`<${ tag } class="ego-markdown" />`);
    CONTENT.html( HTML );

    CONTENT.find('script')
           .remove();

    CONTENT.find('table')
           .addClass('table')
           .addClass('table-striped')
           .addClass('table-hover');

    // make images responsive
    CONTENT.find('img')
           .addClass('img-fluid');

    // task lists
    CONTENT.find('ul li.task-list-item input[type="checkbox"]').each(function() {
        const CHECKBOX = $(this);
        const LI = CHECKBOX.parent();

        const UL = LI.parent();
        UL.attr('class', 'ego-task-list');

        const IS_CHECKED = CHECKBOX.prop('checked');

        CHECKBOX.remove();

        const LABEL = ego_to_string(LI.text()).trim();

        LI.html('');
        LI.attr('style', null);

        const NEW_CHECKBOX = $('<div class="form-check">' + 
                               '<input class="form-check-input" type="checkbox" value="1">' + 
                               '<label class="form-check-label" />' + 
                               '</div>');
        NEW_CHECKBOX.find('input.form-check-input')
                    .prop('checked', IS_CHECKED)
                    .prop('disabled', true);

        NEW_CHECKBOX.find('.form-check-label')
                    .text( LABEL );

        NEW_CHECKBOX.appendTo( LI );
    });

    CONTENT.find('a').each(function() {
        const A = $(this);

        let text = ego_to_string( A.text() );
        let href = ego_to_string( A.attr('href') );

        if ('' === text.trim()) {
            text = href;
        }

        A.attr('href', '#');
        A.attr('ego-href', href);
        A.on('click', function() {
            ego_open_external_url(href, text);
        });
    });

    return CONTENT;
}

/**
 * Checks if a value is (null) or (undefined).
 *
 * @param {any} val The value to check.
 * 
 * @return {Boolean} Is (null) or (undefined).
 */
function ego_is_nil(val) {
    return null === val ||
           'undefined' === typeof val;
}

/**
 * Asks the user in Visual Studio Code, if an external URL should be opened.
 * 
 * @param {String} url The requested URL to open.
 * @param {String} text The display text.
 */
function ego_open_external_url(url, text) {
    ego_post('openExternalUrl', {
        text: ego_to_string(text),
        url: ego_to_string(url)
    });
}

/**
 * Converts a value to a string, which is NOT (null) or (undefined).
 *
 * @param {any} val The value to convert.
 * 
 * @return {String} Value as string.
 */
function ego_to_string(val) {
    if ('string' === typeof val) {
        return val;
    }

    if (ego_is_nil(val)) {
        return '';
    }

    return '' + val;
}


// default options for Markdown parser
$(() => {
    showdown.setFlavor('github');

    showdown.setOption('completeHTMLDocument', false);
    showdown.setOption('encodeEmails', true);
    showdown.setOption('ghCodeBlocks', true);
    showdown.setOption('ghCompatibleHeaderId', true);
    showdown.setOption('headerLevelStart', 3);
    showdown.setOption('openLinksInNewWindow', true);
    showdown.setOption('simpleLineBreaks', true);
    showdown.setOption('simplifiedAutoLink', true);
    showdown.setOption('strikethrough', true);
    showdown.setOption('tables', true);
    showdown.setOption('tasklists', true);
});

// message from extension
$(() => {
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

        if ('undefined' !== typeof ego_on_command) {
            Promise.resolve(
                ego_on_command(COMMAND, MESSAGE.data)
            ).then(() => {
            }).catch((err) => {
                ego_log(err);
            });
        }
    });
});

$(() => {
    if ('undefined' !== typeof ego_on_loaded) {
        Promise.resolve(
            ego_on_loaded()
        ).then(() => {
        }).catch((err) => {
            ego_log(err);
        });
    }

    ego_post('onLoaded');
});
