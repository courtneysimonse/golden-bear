import 'https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import * as turf from 'https://cdn.jsdelivr.net/npm/@turf/turf@7.0.0/+esm';
import FilterControl from "./FilterControl.js";
import TimeFilter from './TimeFilter.js';

const tripsJson = await d3.json('./data/tripSegments.geojson');

const portsFeatures = await d3.csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=Ports%20Geocoded', (d) => {
    
    return turf.point([+d['Lng'], +d['Lat']], {
        city: d['Cleaned Port'],
        count: +d['Frequency'],
        wikidataId: d['Wikidata ID']
    });
});


const map = new maplibregl.Map({
    container: 'map', // container id
    style: '/styles/blue_yellow.json', // style URL
    center: [-180, 12], // starting position [lng, lat]
    zoom: 2, // starting zoom
    attributionControl: false
});

map.on('load', () => {

    map.addControl(new maplibregl.AttributionControl({
        compact: true
    }));

    const tripLineColor = '#D99C52';
    const tripLineWidth = 1.5;
    const tripLineOpacity = 0.2;
    const tripHighlightColor = '#592202';
    const tripHighlightColor2 = '#D97E6A';

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
    

    const portCircleColor = '#592202';
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

    let categories = ["ship", "from", "to"];

    const filterEl = new FilterControl({categories: categories, data: tripsJson.features});
    const filters = filterEl.startingFilters();
    filterEl.add(document.getElementById('ship-filter'));

    // const portFilterEl = new FilterControl({categories: ["port"], data: tripsJson.features});
    // const portFilters = filterEl.startingFilters();
    // portFilterEl.add(document.getElementById('port-filter'));

    const timeFilter = new TimeFilter('year-filter', 2000, 2024, updateMapWithYearRange);
    const years = [1931, 2024];

    // map.addControl(filterEl, 'top-right');

    // const tooltip = new maplibregl.Popup({closeButton: false});
    // const popup = new maplibregl.Popup({
    //     closeButton: true, 
    //     closeOnClick: false, 
    //     className: 'popup'
    // });
    // const detailPopup = new maplibregl.Popup({
    //     closeOnClick: false
    // });

    // map.on('mouseenter', 'ports', (e) => {
    //     map.getCanvas().style.cursor = 'pointer';
    //     tooltip.setHTML(e.features[0].properties['city'])
    //         .setLngLat(e.features[0].geometry.coordinates)
    //         .addTo(map);
    // });

    // map.on('mouseleave', 'ports', () => {
    //     map.getCanvas().style.cursor = '';
    //     tooltip.remove();
    // })

    // map.on('mousemove', (e) => {
    //     const width = 10;
    //     const height = 10;
    //     const features = map.queryRenderedFeatures([
    //         [e.point.x - width / 2, e.point.y - height / 2],
    //         [e.point.x + width / 2, e.point.y + height / 2]
    //       ], { layers: ['trips'] });

    //     if (features.length > 0) {
    //         map.getCanvas().style.cursor = 'pointer';
    //         let popupHtml = '';
    //         let selectedFeatures = [];
    //         let selectedArrivals = [];
    //         let selectedDepartures = [];
    //         let previousFrom = '';
    //         let previousTo = '';
    //         // popupHtml += `<h4>${features[0].properties['from']} to ${features[0].properties['to']}</h4>`
    //         features.forEach(({ properties }) => {
    //             const { from, to, year, departure, arrival } = properties;
                
    //             // Add heading for new "from" to "to" changes
    //             if (from !== previousFrom || to !== previousTo) {
    //                 popupHtml += `<h4>${from} to ${to}</h4>`;
    //                 previousFrom = from;  // Update previous "from"
    //                 previousTo = to;
    //             }
    
    //             // Add year and trip details to the popup
    //             popupHtml += `<p>${year}: ${arrival} to ${departure}</p>`;
    //             selectedFeatures.push(year);
    //             selectedArrivals.push(arrival);
    //             selectedDepartures.push(departure);
    //         });

    //         if (!popup.isOpen() && !detailPopup.isOpen()) {
    //             tooltip.setHTML(popupHtml)
    //             .setLngLat(e.lngLat)
    //             .addTo(map);
    //         }

    //         map.setPaintProperty('trips', 'line-color', 
    //             ['case',
    //                 ['all', 
    //                     ['in', ['get', 'arrival'], ['literal', selectedArrivals]],
    //                     ['in', ['get', 'departure'], ['literal', selectedDepartures]],
    //                     ['in', ['get', 'year'], ['literal', selectedFeatures]]
    //                 ], tripHighlightColor,
    //                 ['in', ['get', 'year'], ['literal', selectedFeatures]], tripHighlightColor2,
    //                 tripLineColor
    //             ])
    //         map.setPaintProperty('trips', 'line-width', 
    //             ['case',
    //                 ['in', ['get', 'year'], ['literal', selectedFeatures]], 3,
    //                 tripLineWidth
    //             ])
    //         map.setPaintProperty('trips', 'line-opacity', 
    //             ['case',
    //                 ['in', ['get', 'year'], ['literal', selectedFeatures]], 1,
    //                 tripLineOpacity
    //             ])
    //     } else {
    //         // Reset cursor if no features are found
    //         map.getCanvas().style.cursor = '';
    //     }
    // })

    // map.on('click', ['trips'], (e) => {
    //     const width = 10;
    //     const height = 10;
    //     const features = map.queryRenderedFeatures([
    //         [e.point.x - width / 2, e.point.y - height / 2],
    //         [e.point.x + width / 2, e.point.y + height / 2]
    //       ], { layers: ['trips'] });

    //     if (features.length > 0) {
    //         map.getCanvas().style.cursor = 'pointer';
    //         let popupHtml = '';
    //         let selectedFeatures = [];
    //         let selectedArrivals = [];
    //         let selectedDepartures = [];
    //         let previousFrom = '';
    //         let previousTo = '';
    //         // popupHtml += `<h4>${features[0].properties['from']} to ${features[0].properties['to']}</h4>`
    //         features.forEach(({ properties }) => {
    //             const { from, to, year, departure, arrival } = properties;
                
    //             // Add heading for new "from" to "to" changes
    //             if (from !== previousFrom || to !== previousTo) {
    //                 popupHtml += `<h4>${from} to ${to}</h4>`;
    //                 previousFrom = from;  // Update previous "from"
    //                 previousTo = to;
    //             }
    
    //             // Add year and trip details to the popup
    //             popupHtml += `<p>${year}: ${arrival} to ${departure}</p>`;
    //             selectedFeatures.push(year);
    //             selectedArrivals.push(arrival);
    //             selectedDepartures.push(departure);
    //         });
    //         popup.setHTML(popupHtml)
    //             .setLngLat(e.lngLat)
    //             .addTo(map);

    //         map.setPaintProperty('trips', 'line-color', 
    //             ['case',
    //                 ['all', 
    //                     ['in', ['get', 'arrival'], ['literal', selectedArrivals]],
    //                     ['in', ['get', 'departure'], ['literal', selectedDepartures]],
    //                     ['in', ['get', 'year'], ['literal', selectedFeatures]]
    //                 ], tripHighlightColor,
    //                 ['in', ['get', 'year'], ['literal', selectedFeatures]], tripHighlightColor2,
    //                 tripLineColor
    //             ])
    //         map.setPaintProperty('trips', 'line-width', 
    //             ['case',
    //                 ['in', ['get', 'year'], ['literal', selectedFeatures]], 3,
    //                 tripLineWidth
    //             ])
    //         map.setPaintProperty('trips', 'line-opacity', 
    //             ['case',
    //                 ['in', ['get', 'year'], ['literal', selectedFeatures]], 1,
    //                 tripLineOpacity
    //             ])
    //     } else {
    //         // Reset cursor if no features are found
    //         map.getCanvas().style.cursor = '';
    //     }
    // })

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


    // map.on('click', 'ports', (e) => {
    //     let popupHtml = '';
    //     const city = e.features[0].properties['city'];
    //     const frequency = e.features[0].properties['count'];

    //     popupHtml = `<h3>${city}</h3>
    //         <p>Number of Visits: ${frequency}</p>`;

    //     let lng = e.lngLat.lng;
    //     if (lng < -180) {
    //         lng = lng + 180;
    //     } else if (lng > 180) {
    //         lng = lng - 180;
    //     }

        // fetch(`/.netlify/functions/weather?lat=${e.lngLat.lat}&lng=${lng}`)
        //     .then((data) => {
        //         data.json()
        //             .then((json) => {
        //                 console.log(json);
        //                 popupHtml += `<p>Temp: ${json.main.temp}&deg;F</p>`
        //                 popupHtml += `<p>Weather: ${json.weather[0].description}</p>`
                    
        //                 detailPopup.setHTML(popupHtml)
        //                 .setLngLat(e.lngLat)
        //                 .addTo(map);
        //             })
        //     })


    // })

    const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: true,
        anchor: "bottom",
    });

    // Create a new popup for the click and assign it to activePopup
    const activePopup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        anchor: "bottom",
    }); // Keep track of the active popup
    
    
    map.on("mouseleave", ["ports", "trips"], () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
    

    map.on('mousemove', ['ports', 'trips'], (e) => {
        const width = 10;
        const height = 10;
        const features = map.queryRenderedFeatures([
            [e.point.x - width / 2, e.point.y - height / 2],
            [e.point.x + width / 2, e.point.y + height / 2]
          ], { layers: ['ports','trips'] });

        if (features.length > 0) {
            map.getCanvas().style.cursor = 'pointer';

            const portFeature = e.features.find((feature) => feature.layer.id === "ports");
            const tripFeature = e.features.find((feature) => feature.layer.id === "trips");

            if (portFeature) {
                // If a port feature is found, show port tooltip
                const { city, count } = portFeature.properties;
                popup
                    .setLngLat(e.lngLat)
                    .setHTML(`<h3>${city}</h3><p>Visits: ${count}</p>`)
                    .addTo(map);

                map.setPaintProperty('ports', 'circle-color', 
                    ["case", ["==", ["get", "city"], city], "yellow", portCircleColor]
                )
            } else if (tripFeature) {
                let selectedFeatures = [];
                let selectedArrivals = [];
                let selectedDepartures = [];
                let previousFrom = '';
                let previousTo = '';

                // If no port feature, show trip information for all overlapping trips
                const popupContent = e.features.map((feature) => {
                    const { from, to, year, arrival, departure } = feature.properties;
                    
                    let popupHtml = '';

                    // Add heading for new "from" to "to" changes
                    if (from !== previousFrom || to !== previousTo) {
                        popupHtml += `<h4>${from} to ${to}</h4>`;
                        previousFrom = from;  // Update previous "from"
                        previousTo = to;
                    }

                    // Add year and trip details to the popup
                    popupHtml += `<p>${year}: ${arrival} to ${departure}</p>`;
                    selectedFeatures.push(year);
                    selectedArrivals.push(arrival);
                    selectedDepartures.push(departure);
                    
                    return popupHtml;
                }).join('<hr>');
    
                popup
                    .setLngLat(e.lngLat)
                    .setHTML(popupContent)
                    .addTo(map);

                map.setPaintProperty('trips', 'line-color', 
                    ['case',
                        ['all', 
                            ['in', ['get', 'arrival'], ['literal', selectedArrivals]],
                            ['in', ['get', 'departure'], ['literal', selectedDepartures]],
                            ['in', ['get', 'year'], ['literal', selectedFeatures]]
                        ], tripHighlightColor,
                        ['in', ['get', 'year'], ['literal', selectedFeatures]], tripHighlightColor2,
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


           
        } else {
            // Reset cursor if no features are found
            map.getCanvas().style.cursor = '';
        }
    })

    
    map.on("click", ["ports", "trips"], async (e) => {
        if (e.features.length > 0) {
            const portFeature = e.features.find((feature) => feature.layer.id === "ports");
            const tripFeature = e.features.find((feature) => feature.layer.id === "trips");
    
            let popupHtml = "";
    
            if (portFeature) {
                const { city, count, wikidataId } = portFeature.properties;
                popupHtml = `
                    <h4>${city}</h4>
                    <p>Number of visits: ${count}</p>
                `;

                // Fetch weather data
                const { lat } = e.lngLat;
                
                let lng = e.lngLat.lng;
                if (lng < -180) {
                    lng = lng + 180;
                } else if (lng > 180) {
                    lng = lng - 180;
                }

                try {
                    const weatherResponse = await fetch(`/.netlify/functions/weather?lat=${lat}&lng=${lng}`);
                    const weatherJson = await weatherResponse.json();
                    popupHtml += `
                        <p>Temp: ${weatherJson.main.temp}&deg;F</p>
                        <p>Weather: ${weatherJson.weather[0].description}</p>
                    `;
                } catch (error) {
                    console.error("Error fetching weather data:", error);
                    popupHtml += `<p>Weather data unavailable</p>`;
                } finally {
                    activePopup
                        .setHTML(popupHtml)
                        .setLngLat(e.lngLat)
                        .addTo(map);
                }

                // add data to sidebar
                // Fetch Wikidata information
                if (wikidataId) {
                    let wikidataHtml = '';
                    try {
                        const wikidataQuery = `
                            SELECT ?label ?description ?image WHERE {
                                wd:${wikidataId} rdfs:label ?label .
                                OPTIONAL { wd:${wikidataId} schema:description ?description . }
                                OPTIONAL { wd:${wikidataId} wdt:P18 ?image . }
                                FILTER (lang(?label) = "en" && lang(?description) = "en")
                            }
                        `;
                        const wikidataResponse = await fetch(
                            `https://query.wikidata.org/sparql?query=${encodeURIComponent(wikidataQuery)}&format=json`
                        );
                        const wikidataJson = await wikidataResponse.json();

                        const result = wikidataJson.results.bindings[0];
                        if (result) {
                            const label = result.label?.value || "Unknown";
                            const description = result.description?.value || "No description available";
                            const imageUrl = result.image?.value;

                            if (imageUrl) {
                                wikidataHtml += `
                                    <img src="${imageUrl}" alt="${label}" style="max-width: 100%; height: auto;" />
                                `;
                            }
                            
                            wikidataHtml += `
                                <p>${description}</p>
                            `;

                        } else {
                            wikidataHtml += `<p>Wikidata information unavailable</p>`;
                        }
                    } catch (error) {
                        console.error("Error fetching Wikidata information:", error);
                        wikidataHtml += `<p>Wikidata information unavailable</p>`;
                    } finally {
                        document.getElementById("port-info").innerHTML = popupHtml + wikidataHtml;
                    }
                }

            }
    
            if (tripFeature) {
                // Detailed popup for trips
                const tripContent = e.features.map((feature) => {
                    const { from, to, year, arrival, departure } = feature.properties;
                    return `
                        <div>
                            <h4>${from} → ${to}</h4>
                            <p>${year}: ${arrival} to ${departure}</p>
                        </div>
                    `;
                }).join('<hr>');
                popupHtml += tripContent;

                activePopup
                    .setHTML(popupHtml)
                    .setLngLat(e.lngLat)
                    .addTo(map);
            }



        }

    });
    
    

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

        filterExp.push([">=", ["to-number", ["get", "year"]], years[0]], ["<=", ["to-number", ["get", "year"]], years[1]])
    
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

    
    function updateMapWithYearRange(yearRange) {
        const [minYear, maxYear] = yearRange;
        console.log(`Filtering map data for years between: ${minYear} - ${maxYear}`);
        // Logic to filter map layers/data based on the year range
        years[0] = minYear;
        years[1] = maxYear;


        updateMarkers();
    }
})  //end map on load


function getTagsFilter(tags, prop){

    //no tags set
    if ( (tags || []).length === 0) {
        return ["==", "", ["get", prop]]
    };
  
    //expression for each tag
    const tagFilters = tags.map(tag=>['in',tag,['get', prop]])
  
    return ['any'].concat(tagFilters);
  
}
