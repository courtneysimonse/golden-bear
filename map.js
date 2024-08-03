import 'https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as turf from 'https://cdn.jsdelivr.net/npm/@turf/turf@7.0.0/+esm';

const map = new maplibregl.Map({
    container: 'map', // container id
    style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json', // style URL
    center: [-180, 12], // starting position [lng, lat]
    zoom: 2 // starting zoom
});

const landJson = await d3.json('./data/land.geojson');

const portsFeatures = await d3.csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=Ports%20Geocoded', (d) => {
    
    return turf.point([+d['Lng'], +d['Lat']], {
        city: d['Cleaned Port']
    });
});

const tripFeatures = await d3.csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=CLF%20Cleaned%20Maps', (d) => {
    if (d['Port City']) {
        return d;    
    }
    
});

map.on('load', () => {
    const lineFeatures = [];
    let year;
    let line = [];
    let trip;
    let ship;

    tripFeatures.forEach(pt => {
        const port = portsFeatures.find(x => x.properties['city'] == pt['Port City']);

        if (pt['Year'] != "" && line.length > 1) {

            lineFeatures.push(turf.lineString(line, {
                year: year,
                trip: trip,
                ship: ship
            }))

            year = pt['Year'];
            line = [];
            trip = pt['Trip'];
            ship = pt['Ship'];

        }
        
        if (port && line.length > 0) {
            line.push(turf.shortestPath(line[line.length -1], port.geometry.coordinates, {
                obstacles: landJson
            }));  
        } else if (port) {
            line.push(port.geometry.coordinates)
        } else {
            console.debug(pt);
        }
    
    });

    map.addSource('trips', {
        'type': 'geojson',
        'data': turf.featureCollection(lineFeatures)
    }).addLayer({
        'id': 'trips',
        'source': 'trips',
        'type': 'line',
        'paint': {

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
})