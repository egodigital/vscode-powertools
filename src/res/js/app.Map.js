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


let currentMap;

function ego_init_map() {
    if (currentMap) {
        currentMap.remove();
        currentMap = null;
    }

    const MAP = $('#ego-map');
    MAP.html('');

    if (EGO_MAPBOX_API_TOKEN) {
        const NEW_MAP = new mapboxgl.Map({
            container: 'ego-map',
            center: [ 6.04715, 50.782077 ],
            style: 'mapbox://styles/mapbox/streets-v9', // stylesheet location
            zoom: 14 // starting zoom
        });

        currentMap = NEW_MAP;
    } else {
        MAP.text('Please setup the MapBox API token in your settings!');
    }
}

function ego_on_loaded() {
    mapboxgl.accessToken = EGO_MAPBOX_API_TOKEN;

    ego_init_map();
}
