PisSquare = function () {
    this.sandbox = null;
    this.area = null;
    this.selectedNode = null;
};

PisSquare.prototype = {

    init: function (params) {

        this.sandbox = params.sandbox;
        this.containerId = params.containerId;

        if (params.autocompletionVariants) {
            this.autocompletionVariants = params.autocompletionVariants;
        }

        if (params.resolveControls) {
            this.resolveControls = params.resolveControls;
        }

        this.initUI();
    },

    initUI: function () {
        var self = this;
        var container = '#' + self.containerId;

        $(container).prepend('<div class="pisSquareBox container" id="pis-square-tools-' + self.containerId + '"></div>');
        this.pisSquareToolsContainer = '#pis-square-tools-' + self.containerId;

        $(this.pisSquareToolsContainer).load('static/components/html/pis-square-main-page.html', function () {
            if (self.resolveControls) {
                self.resolveControls(self.pisSquareToolsContainer);
            }
            self.setListener();
        });
    },

    getInputParam: function () {
        return $(this.pisSquareToolsContainer).find('#pis-square-param');
    },

    getInputManualParam: function () {
        return $(this.pisSquareToolsContainer).find('#pis-square-manual-param');
    },

    getRequest: function() {
        if (this.getInputManualParam().val() == '') {
            return this.getRequestFromName()
        } else {
            return this.getInputManualParam().val();
        }
    },

    getRequestFromName: function() {
        var name = this.getInputParam().val();
        name = this.deleteFromName(name);
        return `['name'='${name}']`
    },

    deleteFromName: function (text) {
        var array = [
            'г. ',
            'г.п. '
        ];
        array.forEach((el) => text = text.replace(el, ''));
        return text;
    },

    getStartButton: function () {
        return $(this.pisSquareToolsContainer).find('#start-pis-square');
    },

    getAddButton: function () {
        return $(this.pisSquareToolsContainer).find('#add-pis-square');
    },

    addSquareToNode: function () {
        var self = this;
        var nrel_area = PisSquareKeynodesHandler.scKeynodes.nrel_area;
        var node = this.selectedNode;
        console.log(`node ${node} nrel_area ${nrel_area}`);

        window.sctpClient.iterate_constr(
            SctpConstrIter(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                [
                    parseInt(node),
                    sc_type_arc_common | sc_type_const,
                    sc_type_link,
                    sc_type_arc_pos_const_perm,
                    nrel_area
                ],
                {"area": 2})
            ).done(function (results) {

                console.log("set area");

                var addrArea = results.get(0, "area");
                window.sctpClient.set_link_content(addrArea, self.area.toString());
                SCWeb.core.Main.doDefaultCommand([node]);

            }).fail(function () {
                console.log("fail find area link");

                q_square_m = PisSquareKeynodesHandler.scKeynodes.q_square_m;

                window.sctpClient.create_link().done(function (link_addr) {
                    console.log(`create link ${link_addr}`);
                    window.sctpClient.set_link_content(link_addr, self.area.toString()).done(function () {
                        console.log(`set area ${self.area} in ${link_addr}`);
                        window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, node, link_addr).done(function (arc_addr) {
                            console.log(`create arc ${node} => ${link_addr}`);
                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, q_square_m, link_addr).done(function () {
                                console.log(`create arc ${q_square_m} -> ${link_addr}`);
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, nrel_area, arc_addr).done(function () {
                                    console.log(`create arc ${nrel_area} -> (${node} => ${link_addr})`);
                                    SCWeb.core.Main.doDefaultCommand([node]);
                                });
                            });
                        });
                    });
                });
            });
    },

    getOutputDiv: function () {
        return $(this.pisSquareToolsContainer).find('#output-pis-square');
    },

    setListener: function () {
        var self = this;
        var container = this.pisSquareToolsContainer;

        /**
         * Для того чтобы начать наполнение бутылки
         * необходимо добавить кнопку подключенную к бутылке в множество нажатых кнопок
         * (создать дугу между кнопкой и множеством нажатых кнопок)
         */
        this.getStartButton().click(function () {
            console.log("Start overpass");
            var area = self.runOverPass(self.getRequest());
            area.then(function(answer) {
                self.area = answer.area;

                var text = `<p>Площадь равна ${answer.area} м²</p>`;
                answer.polygonInfo.forEach((el, index) => {
                    text += `<p>Контур ${index + 1}: периметр - ${el.perimeter} м, площадь - ${el.area} м²</p>`
                });
                self.getOutputDiv().html(text);
                self.getAddButton().attr("disabled", false);
            }, function(errorMessage) {
                self.area = null;
                self.getOutputDiv().text(errorMessage);
                self.getAddButton().attr("disabled", true);
            })
        });

        this.getAddButton().click(function () {
            console.log("add square to node");
            self.addSquareToNode();
        });

        this.getInputParam().click(function () {

            self.getInputParam().attr("disabled", true);
            var tool = $(this);
            $(this).popover({container: container});
            $(this).popover('show');
            var input = $(container + ' #pis-square-idtf-input');

            function stop_modal() {
                self.getInputParam().attr("disabled", false);
                tool.popover('destroy');
            }

            setTimeout(function () {
                input.focus();
            }, 1);

            input.keypress(function (e) {
                if (e.keyCode == KeyCode.Escape) {
                    stop_modal();
                    e.preventDefault();
                }
            });

            if (self.autocompletionVariants) {

                var types = {
                    local: function (text) {
                        return "[" + text + "]";
                    },
                    remote: function (text) {
                        return "<" + text + ">";
                    }
                };

                input.typeahead({
                        minLength: 1,
                        highlight: true
                    },
                    {
                        name: 'idtf',
                        source: function (str, callback) {
                            self.autocompletionVariants(str, callback);
                        },
                        displayKey: 'name',
                        templates: {
                            suggestion: function (item) {
                                var decorator = types[item.type];
                                if (decorator)
                                    return decorator(item.name);

                                return item.name;
                            }
                        }
                    }
                ).bind('typeahead:selected', function (evt, item, dataset) {
                    if (item && item.addr) {
                        self.getInputParam().val(item.name);
                        self.getInputParam().attr("sc_addr", item.addr);
                        self.getStartButton().attr("disabled", false);
                        self.selectedNode = item.addr;
                        stop_modal();
                    }
                    evt.stopPropagation();
                    $('.typeahead').val('');
                });
            }

            $(container + ' #pis-square-idtf-cancel').click(function () {
                stop_modal();
            });
        });
    },

    runOverPass: function (relation) {
        var self = this;
        var promise = new Promise(function (resolve, reject) {
            console.log("[out:json][timeout:15];(relation" + relation + ";>;);out;");
            var fetchPromise = fetch("http://overpass-api.de/api/interpreter?data=[out:json][timeout:15];(relation" + relation + ";>;);out;");
            jsonPromise = fetchPromise.then(function (response) {
                return response.json();
            });
            jsonPromise.then(function (json) {
                var sumArea = 0;
                var osm3sObjects = self.createOsm3sObjects(json);
                var polygons = self.createPolygons(osm3sObjects);
                var polygonInfo = [];
                polygons.forEach((polygon) => {
                    var area = LatLon.areaOf(polygon);
                    console.log("Area = " + area);
                    var perimeter = 0;
                    polygon.forEach((el, index) => {
                        var next = polygon[(index + 1) % polygon.length];
                        perimeter += el.distanceTo(next);
                    });
                    console.log("Perimeter = " + perimeter);
                    sumArea += area;
                    polygonInfo.push({
                        polygon: polygon,
                        area: area,
                        perimeter: perimeter
                    })
                });
                var answer = {
                    area: sumArea,
                    polygonInfo: polygonInfo,
                    relation: relation
                };
                resolve(answer)
            });
        });
        return promise;
    },

    createOsm3sObjects: function (osm3s) {
        var osm3_relation = [];
        var osm3s_node = {};
        var osm3s_way = {};

        osm3s["elements"].forEach((el) => {
            switch (el["type"]
                ) {
                case
                "relation"
                :
                    osm3_relation.push(el);
                    break;
                case
                "node"
                :
                    osm3s_node[el["id"]] = el;
                    break;
                case
                "way"
                :
                    osm3s_way[el["id"]] = el;
                    break;
                default:
                    console.log("Error type type =" + el["type"]);
                    break;
            }
        })
        ;

        if (osm3_relation.length != 1) {
            throw "Error: too many relation returned from OSM!";
        }

        return {
            "relation": osm3_relation[0],
            "osm3s_node": osm3s_node,
            "osm3s_way": osm3s_way
        };
    },

    createPolygons: function (osm3sObjects) {

        var relation = osm3sObjects["relation"];
        var osm3s_node = osm3sObjects["osm3s_node"];
        var osm3s_way = osm3sObjects["osm3s_way"];

        function first(array) {
            return array[0];
        }

        function last(array) {
            return array[array.length-1];
        }


        var ways = relation["members"].filter((el) => {
            return (el["type"] == "way" && el["role"] == "outer");
        });

        var polygons = [];
        var waysLength = ways.length;
        var polygon = [];
        for (var index = 0; index < waysLength; index++) {
            var way = osm3s_way[ways[index]["ref"]];
            var nodes = way["nodes"];
            if (polygon.length > 0 && last(polygon) != first(nodes)) {
                nodes = nodes.reverse();
                if (last(polygon) != first(nodes)) {
                    polygon = polygon.reverse();
                    if (last(polygon) != first(nodes)) {
                        throw "Error: incorrect way returned from OSM!";
                    }
                }
            }
            nodes.forEach((el) => {
                polygon.push(el)
            });

            if (last(polygon) == first(polygon)) {
                polygon = polygon.filter((current, index, array) => array.indexOf(current) === index);

                polygon = polygon.map((node) => {
                    return new LatLon(osm3s_node[node]["lat"], osm3s_node[node]["lon"]);
                });

                polygons.push(polygon);
                polygon = []
            }
        }
        if (polygon.length > 0) {
            throw "Error: incorrect relation returned from OSM!";
        }

        return polygons;
    }


};
