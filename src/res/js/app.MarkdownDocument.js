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

function ego_update_markdown(md, fullWidth) {
    if (arguments.length < 1) {
        md = EGO_MARKDOWN_CONTENT;
    }

    if (arguments.length < 2) {
        fullWidth = EGO_FULL_WIDTH;
    }

    const DOCUMENT = $('<div />');
    if (fullWidth) {
        DOCUMENT.addClass('container-fluid');
    } else {
        DOCUMENT.addClass('container');
    }

    DOCUMENT.append(
        ego_from_markdown(md)
    );

    $('main').append(
        DOCUMENT
    );

    ego_apply_highlight(DOCUMENT);
}

$(() => {
    ego_update_markdown();
});
