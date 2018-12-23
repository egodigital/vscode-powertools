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

function ego_on_command(command, data) {
    switch (command) {
        case 'scriptCancellationAborted':
            $('#ego-run-script-btn').removeClass('disabled');
            break;

        case 'scriptCancelled':
            ego_change_play_button_state(false);
            break;

        case 'scriptFinished':
            ego_change_play_button_state(false);
            break;

        case 'writeHtml':
            {
                $('#ego-script-console .card-body').append(
                    ego_to_string(data)
                );
            }
            break;
    }
}

function ego_on_loaded() {
    $('#ego-clear-console-btn').on('click', function() {
        $('#ego-script-console .card-body').html('');
    });

    ego_change_play_button_state(false);
}

function ego_change_play_button_state(isRunning) {
    const BTN = $('#ego-run-script-btn');
    BTN.removeClass('disabled');

    if (isRunning) {
        BTN.off('click').on('click', function() {
            ego_post('cancelScript');

            BTN.addClass('disabled');
        });

        BTN.html('<i class="fa fa-stop" aria-hidden="true"></i>');
    } else {
        BTN.off('click').on('click', function() {
            ego_post('runScript');

            ego_change_play_button_state(true);
        });

        BTN.html('<i class="fa fa-play" aria-hidden="true"></i>');
    }
}
