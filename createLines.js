import { point, lineString, featureCollection, shortestPath, greatCircle } from "@turf/turf";
import { csv } from "d3-fetch";
import path from "path";
import { readFile, writeFile } from "fs/promises";

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
        const start = segment[i];
        const end = segment[i + 1];
        adjustedSegment.push(start);
        const lonDiff = Math.abs(start[0] - end[0]);
        if (lonDiff > 180) {
            const midLat = (start[1] + end[1]) / 2;
            if (start[0] > end[0]) {
                adjustedSegment.push([180, midLat]);
                adjustedSegment.push([-180, midLat]);
            } else {
                adjustedSegment.push([-180, midLat]);
                adjustedSegment.push([180, midLat]);
            }
        }
    }
    adjustedSegment.push(segment[segment.length - 1]);
    return adjustedSegment;
}

async function main() {
    const portsFeatures = await fetchPortsFeatures();
    const tripFeatures = await fetchTripFeatures();

    const portsMap = new Map();
    portsFeatures.forEach(port => {
        portsMap.set(port.properties.city, port);
    });

    const lineFeatures = [];
    console.log(tripFeatures[0]);
    let year = tripFeatures[0]['Year'];
    let line = [], trip, ship, lastPort;

    tripFeatures.forEach(pt => {
        const port = portsMap.get(pt['Port City']);

        if (pt['Year'] != "" && line.length > 1 ) {

            lineFeatures.push(lineString(line, { 
                year: year, 
                trip: trip, 
                ship: ship 
            }));
            console.log(year);

            year = pt['Year'];
            line = [];
            trip = pt['Trip'];
            ship = pt['Ship'];

            lastPort = null;
        }

        if (port) {
            if (!port.geometry.coordinates) {
                console.log(port.geometry);

            } else if (line.length > 0 && lastPort !== port) {
                const lastPoint = line[line.length - 1];
                const adjustedLine = handleAntimeridian([lastPoint,
                    port.geometry.coordinates]);
 
                line.push(...adjustedLine.slice(1))
                        
            } else {
                line.push(port.geometry.coordinates);
            }
            
            console.log(port.properties.city);
            lastPort = port;
        } else {
            console.debug(pt);
        }
    });

    const jsonString = JSON.stringify(featureCollection(lineFeatures));
    try {
        await writeFile(path.join('./data', 'tripLineStrings.geojson'), jsonString);
        console.log('Successfully wrote file');
    } catch (err) {
        console.log('Error writing file', err);
    }
}

main().catch(console.error);
