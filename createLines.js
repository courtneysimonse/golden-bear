import { point, lineString, featureCollection } from "@turf/turf";
import { csv } from "d3-fetch";
import path from "path";
import { writeFile } from "fs/promises";

async function fetchPortsFeatures() {
    return await csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=Ports%20Geocoded', (d) => {
        return point([+d['Lng'], +d['Lat']], {
            city: d['Cleaned Port']
        });
    });
}

async function fetchTripFeatures() {
    return await csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=CLF%20Cleaned%20Maps', (d, i) => {
        if (d['Port City']) {
            return d;
        }
    });
}

function handleAntimeridian(segment) {
    const adjustedSegment = [];
    for (let i = 0; i < segment.length - 1; i++) {
        const start = [...segment[i]];
        const end = [...segment[i + 1]];
        adjustedSegment.push(start);
        const lonDiff = Math.abs(start[0] - end[0]);
        if (lonDiff > 180) {
        //     const midLat = (start[1] + end[1]) / 2;
        //     if (start[0] > end[0]) {
        //         adjustedSegment.push([180, midLat]);
        //         adjustedSegment.push([-180, midLat]);
        //     } else {
        //         adjustedSegment.push([-180, midLat]);
        //         adjustedSegment.push([180, midLat]);
        //     }
            if (end[0] - start[0] >= 180) {
                end[0] -= 360;
            } else if (end[0] - start[0] < 180) {
                end[0] += 360;
            }

        }

        adjustedSegment.push(end);
    }

    return adjustedSegment;
}

async function main() {
    const portsFeatures = await fetchPortsFeatures();
    const tripFeatures = await fetchTripFeatures();

    const portsMap = new Map();
    portsFeatures.forEach(port => {
        portsMap.set(port.properties.city, port);
    });

    const segmentFeatures = []; // Store individual segment features
    console.log(tripFeatures[0]);
    let year = tripFeatures[0]['Year'].split('-')[0];
    let trip, ship, lastPort;

    tripFeatures.forEach(pt => {
        const port = portsMap.get(pt['Port City']);

        if (pt['Year'] != "") {
            year = pt['Year'].split('-')[0];
            trip = pt['Trip'];
            ship = pt['Ship'];
        }

        if (port) {
            if (!port.geometry.coordinates) {
                console.log(port.geometry);
            } else if (lastPort && lastPort !== port) {
                // Create a segment between lastPort and current port
                if (pt['Port City'] == 'Naples') {
                    console.debug(port);
                }
                const segment = handleAntimeridian([lastPort.geometry.coordinates, port.geometry.coordinates]);

                segmentFeatures.push(lineString(segment, { 
                    year: year, 
                    trip: trip, 
                    ship: ship, 
                    from: lastPort.properties.city, 
                    to: port.properties.city,
                    arrival: pt['Arrival'],
                    departure: pt['Departure'],
                    portDuration: pt['Port Days'],
                    transitDuration: pt['Transit Days']
                }));
                
                console.log(`Segment from ${lastPort.properties.city} to ${port.properties.city}`);
            }
            
            lastPort = port; // Set the current port as the lastPort for the next iteration
        } else {
            console.debug(pt);
        }
    });

    const jsonString = JSON.stringify(featureCollection(segmentFeatures));
    try {
        await writeFile(path.join('./data', 'tripSegments.geojson'), jsonString);
        console.log('Successfully wrote file');
    } catch (err) {
        console.log('Error writing file', err);
    }
}

main().catch(console.error);
