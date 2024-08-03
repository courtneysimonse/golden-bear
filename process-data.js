import { point, lineString, shortestPath, featureCollection } from "@turf/turf";
import { csv } from "d3-fetch";
import path from "path";
import { readFile } from "fs";

function readFromFile(file) {
    return new Promise((resolve, reject) => {
        readFile(file, function (err, data) {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                resolve(JSON.parse(data));
            }
        });
    });
  }
  

const landJson = await readFromFile('./data/land.geojson');

const portsFeatures = await csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=Ports%20Geocoded', (d) => {
    
    return point([+d['Lng'], +d['Lat']], {
        city: d['Cleaned Port']
    });
});

const tripFeatures = await csv('https://docs.google.com/spreadsheets/d/1n-2Kw8lt628JVir1urXYlBJ8wKA38A_jrL5reco9xBU/gviz/tq?tqx=out:csv&sheet=CLF%20Cleaned%20Maps', (d) => {
    if (d['Port City']) {
        return d;    
    }
    
});

const lineFeatures = [];
let year;
let line = [];
let trip;
let ship;

tripFeatures.forEach(pt => {
    const port = portsFeatures.find(x => x.properties['city'] == pt['Port City']);

    if (pt['Year'] != "" && line.length > 1) {

        lineFeatures.push(lineString(line, {
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
        let newSeg = shortestPath(line[line.length -1], port.geometry.coordinates, {
            obstacles: landJson
        });
        line.push(...newSeg.geometry.coordinates);  
    } else if (port) {
        line.push(port.geometry.coordinates)
    } else {
        console.debug(pt);
    }

});

const jsonString = JSON.stringify(featureCollection(lineFeatures));
//console.log(jsonString);
fs.writeFile(path.join('./data', 'tripArcs.geojson'), jsonString, err => {
    if (err) {
      console.log('Error writing file', err);
    } else {
      console.log('Successfully wrote file');
    }
  });
