import 'https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import * as turf from 'https://cdn.jsdelivr.net/npm/@turf/turf@7.0.0/+esm';
import filterControl from "./filterControl.js";

const tripsJson = await d3.json('./data/tripSegments.geojson');

const portsFeatures = await d3.csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=Ports%20Geocoded', (d) => {
    
    return turf.point([+d['Lng'], +d['Lat']], {
        city: d['Cleaned Port'],
        count: +d['Frequency']
    });
});


const map = new maplibregl.Map({
    container: 'map', // container id
    style: '/styles/indiana_jones.json', // style URL
    center: [-180, 12], // starting position [lng, lat]
    zoom: 2, // starting zoom
    attributionControl: false
});

map.on('load', () => {

    map.addControl(new maplibregl.AttributionControl({
        compact: true
    }));

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

    const tripLineColor = '#D99C52';
    const tripLineWidth = 1.5;
    const tripLineOpacity = 0.2;

    map.addSource('trips', {
        'type': 'geojson',
        'data': tripsJson
    }).addLayer({
        'id': 'trips',
        'source': 'trips',
        'type': 'line',
        'paint': {
            'line-color': tripLineColor,
            'line-opacity': tripLineOpacity,
            'line-width': tripLineWidth
        },
        'layout': {

        }
    })
    

    const portCircleColor = '#fff';
    const portCircleOpacity = 0.5;

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
            'circle-opacity': portCircleOpacity,
            'circle-color': portCircleColor,
            'circle-stroke-width': 1,
            'circle-stroke-color': portCircleColor
        }
    });

    let categories = ["ship"];

    const filterEl = new filterControl({categories: categories, data: tripsJson.features});
    const filters = filterEl.startingFilters();
    filterEl.add(document.getElementById('ship-filter'))


    // map.addControl(filterEl, 'top-right');

    const popup = new maplibregl.Popup({closeButton: false});

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

    map.on('mousemove', (e) => {
        const width = 10;
        const height = 10;
        const features = map.queryRenderedFeatures([
            [e.point.x - width / 2, e.point.y - height / 2],
            [e.point.x + width / 2, e.point.y + height / 2]
          ], { layers: ['trips'] });

        if (features.length > 0) {
            map.getCanvas().style.cursor = 'pointer';
            let popupHtml = '';
            let selectedFeatures = [];
            let selectedArrivals = [];
            let selectedDepartures = [];
            popupHtml += `<h4>${features[0].properties['from']} to ${features[0].properties['to']}</h4>`
            features.forEach(feature => {
                popupHtml += `<p>${feature.properties['year']}: ${feature.properties['departure']} to ${feature.properties['arrival']}</p>`;
                selectedFeatures.push(feature.properties['year']);
                selectedArrivals.push(feature.properties['arrival']);
                selectedDepartures.push(feature.properties['departure']);
            })
            popup.setHTML(popupHtml)
                .setLngLat(e.lngLat)
                .addTo(map);

            map.setPaintProperty('trips', 'line-color', 
                ['case',
                    ['all', 
                        ['in', ['get', 'arrival'], ['literal', selectedArrivals]],
                        ['in', ['get', 'departure'], ['literal', selectedDepartures]],
                        ['in', ['get', 'year'], ['literal', selectedFeatures]]
                    ], '#d98487',
                    ['in', ['get', 'year'], ['literal', selectedFeatures]], '#D9AC84',
                    tripLineColor
                ])
            map.setPaintProperty('trips', 'line-width', 
                ['case',
                    ['in', ['get', 'year'], ['literal', selectedFeatures]], 3,
                    tripLineWidth
                ])
            map.setPaintProperty('trips', 'line-opacity', 
                ['case',
                    ['in', ['get', 'year'], ['literal', selectedFeatures]], 1,
                    tripLineOpacity
                ])
        }
    })

    // map.on('mouseenter', 'trips', (e) => {
    //     map.getCanvas().style.cursor = 'pointer';
    //     let popupHtml = '';
    //     e.features.forEach(feature => popupHtml += feature.properties['year'] + ', ')
    //     popup.setHTML(popupHtml)
    //         .setLngLat(e.lngLat)
    //         .addTo(map);
    // });

    // map.on('mouseleave', 'trips', () => {
    //     map.getCanvas().style.cursor = '';
    // });

    const detailPopup = new maplibregl.Popup({closeOnClick: false});

    map.on('click', 'ports', (e) => {
        let popupHtml = '';
        const city = e.features[0].properties['city'];
        const frequency = e.features[0].properties['count']

        popupHtml = `<h3>${city}</h3>
            </p>Number of Visits: ${frequency}</p>`;

        detailPopup.setHTML(popupHtml)
            .setLngLat(e.lngLat)
            .addTo(map);

    })

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    [...checkboxes].forEach(check => {
        check.addEventListener('change', (e) => {

            if (e.target.className == 'data-filter') {
                let cat = e.target.parentNode.parentNode.parentNode.dataset.filter;
                let item = e.target.nextSibling.textContent;

                if (e.target.checked == false) {
                    filters[cat].values = filters[cat].values.filter(x => x != item);

                    if (item == "Unknown") {
                        filters[cat].values = filters[cat].values.filter(x => x != '');
                    }
                } else if (!filters[cat].values.includes(item)) {
                    filters[cat].values.push(item);
                    if (item == "Unknown") {
                        filters[cat].values.push('');
                    }
                } 
                
            } else if (e.target.dataset.category) {
                
                let category = e.target.dataset.category;

                if (e.target.checked == false) {
                    filters[category].status = "off";
                } else {
                    filters[category].status = "on"
                    const listInputs = document.querySelectorAll('.data-filter');
                    listInputs.forEach(input => {

                        let item = input.nextSibling.textContent;
                        if (input.parentNode.parentNode.parentNode.dataset.filter == category && input.checked) {

                            filters[category].values.push(item);
                            if (item == "Unknown") {
                                filters[category].values.push('');
                            }

                        }
                    });
                }

                
            }

            updateMarkers();

            setNewView();

        })
    })

    function updateMarkers() {
        // filter trips
        
        let filterExp = ["all"];
        for (const c in filters) {
    
            if (Object.hasOwnProperty.call(filters, c) && filters[c].status == "on") {
    
                filterExp.push(getTagsFilter(filters[c].values, c))
            }
        }
    
        map.setFilter('trips', filterExp);
    }

    function setNewView() {
        // count number of features after filter
        const shipFiltered = tripsJson.features.filter(t => filters["ship"].values.includes(t.properties["ship"]));
        const numFiltered = shipFiltered.length;
    
        if (numFiltered < 100 && numFiltered > 0) {
            let bounds = new maplibregl.LngLatBounds();
    
            shipFiltered.forEach(s => {
                if (s.geometry.coordinates[0].length > 1) {
                    s.geometry.coordinates.forEach(l => {
                        bounds.extend(l);
                    })
                }
            })

            map.fitBounds(bounds, {padding: 25})

            map.setPaintProperty('trips', 'line-width', tripLineWidth + 0.5);
            map.setPaintProperty('trips', 'line-opacity', 1);
        } else {
            map.setPaintProperty('trips', 'line-width', tripLineWidth);
            map.setPaintProperty('trips', 'line-opacity', tripLineOpacity);
        }
    }
})


function getTagsFilter(tags, prop){

    //no tags set
    if ( (tags || []).length === 0) {
        return ["==", "", ["get", prop]]
    };
  
    //expression for each tag
    const tagFilters = tags.map(tag=>['in',tag,['get', prop]])
  
    return ['any'].concat(tagFilters);
  
}