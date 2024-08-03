import { point, lineString, shortestPath, featureCollection } from "@turf/turf";
import { csv } from "d3-fetch";
import path from "path";
import { readFile, writeFile } from "fs/promises";

async function readFromFile(file) {
    try {
        const data = await readFile(file);
        return JSON.parse(data);
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function fetchPortsFeatures() {
    return await csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=Ports%20Geocoded', (d) => {
        return point([+d['Lng'], +d['Lat']], {
            city: d['Cleaned Port']
        });
    });
}

async function fetchTripFeatures() {
    return await csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=CLF%20Cleaned%20Maps', (d) => {
        if (d['Port City']) {
            return d;
        }
    });
}

async function main() {
    const landJson = await readFromFile('./data/land.geojson');
    const portsFeatures = await fetchPortsFeatures();
    const tripFeatures = await fetchTripFeatures();

    const portsMap = new Map();
    portsFeatures.forEach(port => {
        portsMap.set(port.properties.city, port);
    });

    const lineFeatures = [];
    let year, line = [], trip, ship;

    tripFeatures.forEach(pt => {
        const port = portsMap.get(pt['Port City']);
        console.log(port.properties.city);

        if (pt['Year'] && line.length > 1) {
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
        }

        if (port && line.length > 0) {
            const newSeg = shortestPath(line[line.length - 1], port.geometry.coordinates, { obstacles: landJson });
            line.push(...newSeg.geometry.coordinates);
        } else if (port) {
            line.push(port.geometry.coordinates);
        } else {
            console.debug(pt);
        }
    });

    const jsonString = JSON.stringify(featureCollection(lineFeatures));
    try {
        await writeFile(path.join('./data', 'tripArcs.geojson'), jsonString);
        console.log('Successfully wrote file');
    } catch (err) {
        console.log('Error writing file', err);
    }
}

main().catch(console.error);