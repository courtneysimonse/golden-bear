import { point, lineString, featureCollection, shortestPath, greatCircle } from "@turf/turf";
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
    return await csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=CLF%20Cleaned%20Maps', (d, i) => {
        if (d['Port City'] && i < 100) {
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
    const landJson = await readFromFile('./data/land_buffered.geojson');
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
            console.log(line);
            // const adjustedLine = handleAntimeridian(line);
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
            }
            if (line.length > 0 && lastPort !== port) {
                const lastPoint = line[line.length - 1];
                const adjustedLine = handleAntimeridian([lastPoint,
                    port.geometry.coordinates]);

                if (adjustedLine.length > 2) {
                    for (let i = 0; i < adjustedLine.length - 1; i++) {
                        if (Math.abs(adjustedLine[i][0]) != 180 && Math.abs(adjustedLine[i+1][0]) != 180) {
                            let shortestPathSeg = shortestPath(
                                point(adjustedLine[i]),
                                point(adjustedLine[i+1]),
                                { obstacles: landJson, resolution: 1 }
                            );

                            for (let j = 0; j < shortestPathSeg.geometry.coordinates.length - 1; j++) {
                                let greatCircleSeg = greatCircle(point(shortestPathSeg.geometry.coordinates[j]), point(shortestPathSeg.geometry.coordinates[j+1]),
                                    {
                                        npoints: 20,
                                        // offset: 180
                                    }
                                )

                                try {
                                    // console.log(greatCircleSeg.geometry.coordinates);
                                    line.push(...greatCircleSeg.geometry.coordinates.slice(1));
                                } catch (error) {
                                    console.error(error);
                                    console.log(shortestPathSeg.geometry.coordinates);
                                }
                                
                            }

                            
                        } else {
                            line.push(...[adjustedLine[i], adjustedLine[i+1]])
                        }

                        
                    }
                    // adjustedLine.forEach((x) => {
                    

                        
                        
                    // })
                } else {
                    let shortestPathSeg = shortestPath(
                        point(adjustedLine[0]),
                        point(adjustedLine[1]),
                        { obstacles: landJson, resolution: 30 }
                    );

                    for (let j = 0; j < shortestPathSeg.geometry.coordinates.length - 1; j++) {
                        let greatCircleSeg = greatCircle(point(shortestPathSeg.geometry.coordinates[j]), point(shortestPathSeg.geometry.coordinates[j+1]),
                            {
                                npoints: 20,
                                // offset: 180
                            }
                        )

                        try {
                            // console.log(greatCircleSeg.geometry.coordinates);
                            line.push(...greatCircleSeg.geometry.coordinates.slice(1));
                        } catch (error) {
                            console.error(error);
                            console.log(shortestPathSeg.geometry.coordinates);
                        }
                    }
                }
                // const shortestPathSeg = shortestPath(
                //     point(lastPoint),
                //     point(port.geometry.coordinates),
                //     { obstacles: landJson, resolution: 10 }
                // );



                // // if (shortestPathSeg) {
                //     const greatCirclePath = greatCircle(lastPoint, port.geometry.coordinates, {
                //         npoints: 20,
                //         offset: 180
                //     });
                //     let adjustedPath = handleAntimeridian(greatCirclePath.geometry.coordinates);
                //     if (adjustedPath.length > 1) {
                //         adjustedPath = adjustedPath.slice(1)
                //     }
                //     line.push(...adjustedPath.slice(1)); // Skip first point to avoid duplication
                // // } else {
                // //     console.log(`No valid path from ${lastPoint} to ${port.geometry.coordinates}, skipping.`);
                // // }
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
        await writeFile(path.join('./data', 'tripArcs.geojson'), jsonString);
        console.log('Successfully wrote file');
    } catch (err) {
        console.log('Error writing file', err);
    }
}

main().catch(console.error);
