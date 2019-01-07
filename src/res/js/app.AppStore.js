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


function ego_install_app(app) {
    ego_post('installApp', {
        name: app.name,
        source: app.source,
    });
}

function ego_on_command(command, data) {
    switch (command) {
        case 'appListUpdated':
            ego_reload_apps();
            break;

        case 'appsLoaded':
            ego_update_app_list(data);
            break;

        case 'appUninstalled':
            if (data && data.success) {
                ego_reload_apps();
            }
            break;
    }
}

function ego_on_loaded() {
    ego_reload_apps();
}

function ego_open_app(app) {
    ego_post('openApp', {
        name: app.name
    });
}

function ego_reload_apps() {
    $('#ego-app-list').html('')
        .append($('<div class="loader small border-top-info ego-ajax-loader" />'));

    ego_post('reloadApps');
}

function ego_update_app_list(data) {
    const LIST = $('#ego-app-list');
    LIST.html('');

    if (!data) {
        return;
    }

    if (data.success) {
        if (data.apps && data.apps.length) {
            const CARD_LIST = $('<div class="row" />');

            data.apps.forEach(a => {
                const NEW_CARD = $('<div class="col col-4">' + 
                                   '<div class="card ego-app-card">' + 
                                   '<div class="card-body">' + 
                                   '<h4 class="card-title" />' + 
                                   '</div>' + 
                                   '<div class="card-footer" />' + 
                                   '</div>' +
                                   '</div>');

                const CARD_BODY = NEW_CARD.find('.card-body');
                const CARD_FOOTER = NEW_CARD.find('.card-footer');

                const CARD_MORE_BTN = $('<div class="btn-group ego-btn-group" role="group">' + 
                                        '<a class="btn btn-dark btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + 
                                        '<i class="fa fa-bars" aria-hidden="true"></i>' + 
                                        '</a>' + 
                                        '<div class="dropdown-menu" />' + 
                                        '</div>');

                CARD_MORE_BTN.appendTo(
                    CARD_FOOTER
                );

                const DISPLAY_NAME = ego_to_string(a.displayName).trim();
                NEW_CARD.find('.card-title')
                        .text(DISPLAY_NAME);

                const DESCRIPTION_MARKDOWN = ego_to_string(a.description).trim();
                if ('' !== DESCRIPTION_MARKDOWN) {
                    const DESCRIPTION = ego_from_markdown(
                        DESCRIPTION_MARKDOWN, 'p'
                    );

                    DESCRIPTION.appendTo(
                        CARD_BODY
                    );
                }

                const ICON = ego_to_string(a.icon).trim();
                if ('' !== ICON) {
                    const CARD_IMAGE = $('<img class="card-img-top ego-app-icon">');
                    CARD_IMAGE.attr('src', ICON);

                    CARD_IMAGE.prependTo(
                        NEW_CARD.find('.ego-app-card')
                    );
                }

                // show details button
                const DETAILS_MARKDOWN = ego_to_string(a.details).trim();
                if ('' !== DETAILS_MARKDOWN) {
                    const INFO_ITEM = $('<a class="dropdown-item" href="#">' + 
                                        '<i class="fa fa-info-circle" aria-hidden="true"></i>' + 
                                        'Details' + 
                                        '</a>');

                    INFO_ITEM.on('click', function() {
                        const DETAIL_MODAL = $('#ego-app-details-modal');

                        DETAIL_MODAL.find('.modal-title')
                                    .text(`App '${ DISPLAY_NAME }'`);

                        const DETAILS = ego_from_markdown(DETAILS_MARKDOWN);

                        DETAIL_MODAL.find('.modal-body')
                                    .html('')
                                    .append(DETAILS);
                        ego_apply_highlight(DETAILS);

                        DETAIL_MODAL.modal('show');
                    });

                    CARD_MORE_BTN.find('.dropdown-menu').append(
                        INFO_ITEM
                    );
                }

                // install / uninstall button
                if (a.isInstalled) {
                    const UNINSTALL_ITEM = $('<a class="dropdown-item" href="#">' + 
                                             '<i class="fa fa-trash" aria-hidden="true"></i>' + 
                                             'Uninstall' + 
                                             '</a>');

                    UNINSTALL_ITEM.on('click', function() {
                        const UNINSTALL_MODAL = $('#ego-uninstall-app-modal');

                        const MODAL_BODY = $('<div>' + 
                                             'Do you really want to UNINSTALL the app <strong />?' + 
                                             '</div>');

                        MODAL_BODY.find('strong')
                                  .text(DISPLAY_NAME);

                        UNINSTALL_MODAL.find('.modal-body')
                                       .html('')
                                       .append(MODAL_BODY);

                        UNINSTALL_MODAL.find('.ego-yes-btn').off('click').on('click', function() {
                            ego_post('uninstallApp', {
                                name: a.name,
                                source: a.source,
                            });

                            UNINSTALL_MODAL.modal('hide');
                        });

                        UNINSTALL_MODAL.modal('show');
                    });

                    CARD_MORE_BTN.find('.dropdown-menu').append(
                        UNINSTALL_ITEM
                    );
                }

                // open app or install button
                if (a.isInstalled) {
                    const OPEN_BTN = $('<a class="btn btn-sm btn-primary ego-btn" title="Open App ...">' + 
                                       '<i class="fa fa-play" aria-hidden="true"></i>' + 
                                       '</a>');

                    OPEN_BTN.on('click', function() {
                        ego_open_app(a);
                    });

                    OPEN_BTN.appendTo(
                        CARD_FOOTER
                    );
                } else {
                    const INSTALL_BTN = $('<a class="btn btn-sm ego-btn" />');

                    INSTALL_BTN.append(
                        '<i class="fa fa-plus" aria-hidden="true"></i>'
                    );
                    INSTALL_BTN.attr('title', 'Install ...');
                    INSTALL_BTN.addClass('btn-primary');

                    INSTALL_BTN.on('click', function() {
                        ego_install_app(a);
                    });

                    INSTALL_BTN.appendTo(
                        CARD_FOOTER
                    );
                }

                const UPGRADE_SOURCE = ego_to_string(a.upgradeSource)
                    .trim();
                if ('' !== UPGRADE_SOURCE) {
                    const UPGRADE_BTN = $('<a class="btn btn-sm btn-primary ego-btn" title="Upgrade App ...">' + 
                                          '<i class="fa fa-arrow-circle-up" aria-hidden="true"></i>' + 
                                          '</a>');

                    UPGRADE_BTN.on('click', function() {
                        ego_upgrade_app(a);
                    });

                    UPGRADE_BTN.appendTo(
                        CARD_FOOTER
                    );
                }

                if (CARD_MORE_BTN.find('.dropdown-menu .dropdown-item').length < 1) {
                    CARD_MORE_BTN.remove();
                }

                NEW_CARD.appendTo(CARD_LIST);
            });

            CARD_LIST.appendTo(LIST);

            ego_apply_highlight(LIST);
        } else {
            LIST.text('No apps found.');
        }
    } else {
        const ALERT = $('<div class="alert alert-danger" role="alert" />');
        ALERT.text(`Could not load apps: '${ data.error }'`);

        ALERT.appendTo(LIST);
    }
}

function ego_upgrade_app(app) {
    ego_post('upgradeApp', {
        name: app.name,
        source: app.upgradeSource,
    });
}
