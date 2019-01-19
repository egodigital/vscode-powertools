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


let isLoadingWikiPage = false;

function ego_load_wiki_page(name) {
    if (isLoadingWikiPage) {
        return;
    }
    isLoadingWikiPage = true;

    ego_post(
        'loadWikiPage',
        {
            name: name,
        }
    );
}

function ego_on_command(command, data) {
    const CONTENT = $('.ego-content');

    const CONTENT_RIGHT = CONTENT.find('.ego-right');

    switch (command) {
        case 'wikiPageLoaded':
            {
                isLoadingWikiPage = false;

                CONTENT_RIGHT.html('');

                if (data.success) {
                    const MARKDOWN = ego_from_markdown(
                        data.data,
                    );

                    CONTENT_RIGHT.append(
                        MARKDOWN
                    );

                    ego_apply_highlight(
                        MARKDOWN
                    );

                    MARKDOWN.find('a').each(function() {
                        const A = $(this);

                        const HREF = A.attr('ego-href');

                        if (!HREF) {
                            return;
                        }

                        if (!HREF.startsWith('http://') && !HREF.startsWith('https://')) {
                            A.off('click').on('click', function() {
                                ego_select_area(HREF);
                            });
                        }
                    });
                } else {
                    const ALERT = $('<div class="alert alert-danger" role="alert" />');
                    ALERT.text(`Could not load page: '${ data.error }'`);

                    ALERT.appendTo(CONTENT_RIGHT);
                }
            }
            break;
    }
}

function ego_on_loaded() {
    ego_select_area('');
}

function ego_select_area(name) {
    const CONTENT = $('.ego-content');

    const CONTENT_LEFT = CONTENT.find('.ego-left');
    const CONTENT_RIGHT = CONTENT.find('.ego-right');

    CONTENT_LEFT.find('.ego-item')
                .removeClass('active');

    if (name) {
        CONTENT_LEFT.find(`.ego-item.ego-item-${ name.split(' ').join('') }`)
            .addClass('active');
    }

    CONTENT_RIGHT.html('')
        .append( $('<div class="loader small border-top-info ego-ajax-loader" />') );

    ego_load_wiki_page(name);
}
