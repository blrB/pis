Array.prototype.first = function() {
    return this[0];
}

Array.prototype.last = function() {
    return this[this.length-1];
}

function run(relation) {
    var promise = new Promise(function(resolve, reject) {
        console.log("[out:json][timeout:15];(relation" + relation + ";>;);out;")
        var fetchPromise = fetch("http://overpass-api.de/api/interpreter?data=[out:json][timeout:15];(relation" + relation + ";>;);out;");
        jsonPromise = fetchPromise.then(function(response) {
            return response.json();
        });
        jsonPromise.then(function(json) {
            var sumArea = 0;
            var osm3sObjects = createOsm3sObjects(json);
            var polygons = createPolygons(osm3sObjects);
            polygons.forEach((polygon) => {
                var area = LatLon.areaOf(polygon);
                console.log("Area = " + area);
                sumArea += area;
            }); 
            resolve(sumArea)
        });
    });
    return promise;
}

function createOsm3sObjects(osm3s) {
    var osm3_relation = [];
    var osm3s_node = {};
    var osm3s_way = {};

    osm3s["elements"].forEach((el) => {
        switch(el["type"]) {
            case "relation":
                osm3_relation.push(el);
                break;
            case "node":
                osm3s_node[el["id"]] = el;
                break;
            case "way":
                osm3s_way[el["id"]] = el;
                break;
            default:
                console.log("Error type type =" + el["type"]);
                break;
        }
    });

    if (osm3_relation.length > 1) {
        throw "Error: osm3_relation.length > 1 in createOsm3sObjects(osm3s)";
    }

    return {
        "relation" : osm3_relation.first(),
        "osm3s_node" : osm3s_node,
        "osm3s_way": osm3s_way
    };
}

function createPolygons(osm3sObjects) {

    relation = osm3sObjects["relation"];
    osm3s_node = osm3sObjects["osm3s_node"];
    osm3s_way = osm3sObjects["osm3s_way"];


    var ways = relation["members"].filter((el) => {
        return (el["type"] == "way" && el["role"] == "outer");
    });
    var polygons = [];
    var waysLength = ways.length;
    var polygon = [];
    for (var index = 0; index < waysLength; index++) {
        var way = osm3s_way[ways[index]["ref"]];
        nodes = way["nodes"]
        if (polygon.length > 0 && polygon.last() != nodes.first()) {
            nodes = nodes.reverse();
            if (polygon.last() != nodes.first()) {
                polygon = polygon.reverse();
                if (polygon.last() != nodes.first()) {
                    throw "Error: polygon.last() != nodes.first() in createPolygons(relation)";
                }
            }
        }
        nodes.forEach((el) => {
            polygon.push(el)
        });
        if (polygon.last() == polygon.first()) {
            polygon = polygon.filter((current, index, array) => array.indexOf(current) === index)

            polygon = polygon.map((node) => {
                return new LatLon(osm3s_node[node]["lat"],osm3s_node[node]["lon"]);
            });

            polygons.push(polygon)
            polygon = []
        }
    }
    if (polygon.length > 0) {
        throw "Error: polygon.length > 0 in createPolygons(relation)";
    }

    return polygons;
}
