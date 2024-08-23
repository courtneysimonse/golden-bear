import 'https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import * as turf from 'https://cdn.jsdelivr.net/npm/@turf/turf@7.0.0/+esm';

const map = new maplibregl.Map({
    container: 'map', // container id
    style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json', // style URL
    center: [-180, 12], // starting position [lng, lat]
    zoom: 2 // starting zoom
});

const tripsJson = await d3.json('./data/tripLineStrings_split.geojson');

const portsFeatures = await d3.csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=Ports%20Geocoded', (d) => {
    
    return turf.point([+d['Lng'], +d['Lat']], {
        city: d['Cleaned Port'],
        count: +d['Frequency']
    });
});


map.on('load', () => {

    map.addSource('elevation', {
        "type": "raster-dem",
        "tiles": ["https://tiles.stadiamaps.com/data/terrarium/{z}/{x}/{y}.png"],
        "minzoom": 0,
        "maxzoom": 14,
        "encoding": "terrarium"
    }).addLayer({
        "id": "hillshade",
        "type": "hillshade",
        "source": "elevation",
        "maxzoom": 14,
        "paint": {
            "hillshade-exaggeration": 0.2,
            "hillshade-shadow-color": "#5b4128",
            "hillshade-accent-color": "#5b4128",
            "hillshade-highlight-color": "#e1e1e1"
        }
    })

// Terrain attribution
//     * ArcticDEM terrain data DEM(s) were created from DigitalGlobe, Inc., imagery and
//   funded under National Science Foundation awards 1043681, 1559691, and 1542736;
// * Australia terrain data © Commonwealth of Australia (Geoscience Australia) 2017;
// * Austria terrain data © offene Daten Österreichs – Digitales Geländemodell (DGM)
//   Österreich;
// * Canada terrain data contains information licensed under the Open Government
//   Licence – Canada;
// * Europe terrain data produced using Copernicus data and information funded by the
//   European Union - EU-DEM layers;
// * Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration
// * Mexico terrain data source: INEGI, Continental relief, 2016;
// * New Zealand terrain data Copyright 2011 Crown copyright (c) Land Information New
//   Zealand and the New Zealand Government (All rights reserved);
// * Norway terrain data © Kartverket;
// * United Kingdom terrain data © Environment Agency copyright and/or database right
//   2015. All rights reserved;
// * United States 3DEP (formerly NED) and global GMTED2010 and SRTM terrain data
//   courtesy of the U.S. Geological Survey.

    map.addSource('trips', {
        'type': 'geojson',
        'data': tripsJson
    }).addLayer({
        'id': 'trips',
        'source': 'trips',
        'type': 'line',
        'paint': {
            'line-color': '#0d1d6b',
            'line-opacity': 0.5,
            'line-width': 0.5
        },
        'layout': {

        }
    })
    

    map.addSource('ports', {
        'type': 'geojson',
        'data': turf.featureCollection(portsFeatures)
    }).addLayer({
        'id': 'ports',
        'source': 'ports',
        'type': 'circle',
        'paint': {
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'count'],
                1,
                3,
                20,
                20
            ],
            'circle-opacity': 0.5,
            'circle-color': '#2c0d6b'
        }
    })

    const popup = new maplibregl.Popup();

    map.on('mouseenter', 'ports', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        popup.setHTML(e.features[0].properties['city'])
            .setLngLat(e.features[0].geometry.coordinates)
            .addTo(map);
    });

    map.on('mouseleave', 'ports', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    })

    map.on('mouseenter', 'trips', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        popup.setHTML(e.features[0].properties['year'])
            .setLngLat(e.lngLat)
            .addTo(map);
    });

    map.on('mouseleave', 'trips', () => {
        map.getCanvas().style.cursor = '';
    })
})