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


let isReloadingSettings = false;

function ego_on_command(command, data) {
    switch (command) {
        case 'selectSection':
            {
                const SECTION_TO_SELECT = ego_to_string(
                    data
                ).trim();

                if ('' !== SECTION_TO_SELECT) {
                    ego_select_area(
                        SECTION_TO_SELECT
                    );    
                }
            }
            break;

        case 'settingsReloaded':
            {
                isReloadingSettings = false;

                if (data.success) {
                    $('#ego-app-store-url').val(
                        data.settings.appStoreUrl
                    );

                    $('#ego-open-changelog-on-startup').prop(
                        'checked', data.settings.openChangelogOnStartup
                    );

                    $('#ego-global-azuredevops-org').val(
                        data.settings.globalAzureDevOpsOrg
                    );
                    $('#ego-global-azuredevops-username').val(
                        data.settings.globalAzureDevOpsUsername
                    );
                    $('#ego-global-azuredevops-pat').val(
                        data.settings.globalAzureDevOpsPAT
                    );
                    $('#ego-workspace-azuredevops-org').val(
                        data.settings.workspaceAzureDevOpsOrg
                    );
                    $('#ego-workspace-azuredevops-username').val(
                        data.settings.workspaceAzureDevOpsUsername
                    );
                    $('#ego-workspace-azuredevops-pat').val(
                        data.settings.workspaceAzureDevOpsPAT
                    );
                }
            }
            break;

        case 'settingsSaved':
            $('#ego-save-settings-btn').removeClass('disabled');
            break;
    }
}

function ego_on_loaded() {
    $('[data-toggle="popover"]').popover();

    $('#ego-save-settings-btn').on('click', function() {
        const BTN = $(this);
        BTN.addClass('disabled');

        ego_post('saveSettings', {
            appStoreUrl: $('#ego-app-store-url').val(),
            globalAzureDevOpsOrg: $('#ego-global-azuredevops-org').val(),
            globalAzureDevOpsPAT: $('#ego-global-azuredevops-pat').val(),
            globalAzureDevOpsUsername: $('#ego-global-azuredevops-username').val(),
            openChangelogOnStartup: $('#ego-open-changelog-on-startup').prop('checked'),
            workspaceAzureDevOpsOrg: $('#ego-workspace-azuredevops-org').val(),
            workspaceAzureDevOpsPAT: $('#ego-workspace-azuredevops-pat').val(),
            workspaceAzureDevOpsUsername: $('#ego-workspace-azuredevops-username').val(),
        });
    });

    ego_select_area('apps');

    ego_reload_settings();
}

function ego_reload_settings() {
    if (isReloadingSettings) {
        return;
    }
    isReloadingSettings = true;

    ego_post('reloadSettings');
}

function ego_select_area(name) {
    const CONTENT = $('.ego-content');

    const CONTENT_LEFT = CONTENT.find('.ego-left');
    const CONTENT_RIGHT = CONTENT.find('.ego-right');

    CONTENT_LEFT.find('.ego-item')
                .removeClass('active');
    CONTENT_RIGHT.find('.ego-area')
                 .hide();

    CONTENT_LEFT.find(`.ego-item.ego-item-${ name }`)
                .addClass('active');
    CONTENT_RIGHT.find(`.ego-area.ego-area-${ name }`)
                 .show();
}
