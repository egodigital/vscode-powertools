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

function ego_init_map(opts) {
    if (currentMap) {
        currentMap.remove();
        currentMap = null;
    }

    mapboxgl.accessToken = EGO_MAPBOX_API_TOKEN;

    const MAP = $('#ego-map');
    MAP.html('');

    const MAP_INFO = $('#ego-map-info');
    MAP_INFO.html('');

    if (EGO_MAPBOX_API_TOKEN) {
        let md = '';

        const NEW_MAP = new mapboxgl.Map({
            container: 'ego-map',
            center: opts.center ? opts.center : undefined,
            style: 'mapbox://styles/mapbox/streets-v9',
            zoom: 10
        });

        if (opts.markers && opts.markers.length) {
            md += `# Markers

Index | Location (lat, lng)
----- | -------------------\n`

            for (let i = 0; i < opts.markers.length; i++) {
                const M = opts.markers[i];

                const NEW_MARKER = new mapboxgl.Marker()
                    .setLngLat(M)
                    .addTo(NEW_MAP);

                md += `${ i + 1 } | [${ M.lat }, ${ M.lng }](ego-map-marker:${ M.lat },${ M.lng })\n`;
            }
        }

        currentMap = NEW_MAP;

        if ('' !== md) {
            const MARKDOWN = ego_from_markdown(md);

            MARKDOWN.find('a').each(function() {
                const A = $(this);

                const HREF = A.attr('ego-href');
                if (HREF && HREF.trim().startsWith('ego-map-marker:')) {
                    const LAT_LNG = HREF.trim().substr(15).trim()
                        .split(',');

                    A.off('click').on('click', function() {
                        NEW_MAP.setCenter({
                            lat: parseFloat(LAT_LNG[0].trim()),
                            lng: parseFloat(LAT_LNG[1].trim()),
                        });
                    });
                }
            });

            MAP_INFO.append(
                MARKDOWN
            );
        }
    } else {
        const TEXT = $('<span>Please setup the MapBox API token in your <a href="#">settings</a>!</span>');

        const LINK = TEXT.find('a');
        LINK.on('click', function() {
            ego_post('openMapBoxSettings');
        });

        MAP.append(TEXT);
    }
}

function ego_on_command(command, data) {
    switch (command) {
        case 'initMap':
            ego_init_map(data);
            break;
    }
}
