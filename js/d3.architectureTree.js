'use strict';

d3.chart = d3.chart || {};

d3.chart.architectureTree = function() {

    var svg, tree, treeData, diameter, activeNode;
    var clicked = false;

    /**
     * Build the chart lol
     */
    function chart(){
        if (typeof(tree) === 'undefined') {
            tree = d3.layout.tree()
                .size([360, diameter/2 - 150])
                .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

            svg = d3.select("#graph").append("svg")
                .attr("width", diameter)
                .attr("height", diameter )
                .append("g")
                .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");
        }

        var nodes = tree.nodes(treeData),
            links = tree.links(nodes);

        activeNode = null;

        svg.call(updateData, nodes, links);
    }

    

    /**
     * Update the chart data
     * @param {Object} container
     * @param {Array}  nodes
     */
    var updateData = function(container, nodes, links) {

        // Enrich data
        addDependents(nodes);
        nodes.map(function(node) {
            addIndex(node);
        });

        var diagonal = d3.svg.diagonal.radial()
            .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

        var linkSelection = svg.selectAll(".link").data(links, function(d) {
            return d.source.name + d.target.name + Math.random();
        });
        linkSelection.exit().remove();

        linkSelection.enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal);

        var nodeSelection = container.selectAll(".node").data(nodes, function(d) {
            return d.name + Math.random();  // always update node
        });
        nodeSelection.exit().remove();
        var node = nodeSelection.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
            
            .on('mouseover', function(d) {
                if(activeNode !== null) {
                    return;
                }
                if(!clicked){
                    fade(0.5)(d);
                    document.querySelector('#panel').dispatchEvent(
                        new CustomEvent("hoverNode", { "detail": d.name })
                    );
                }
            })
            .on('mouseout', function(d) {
                if(activeNode !== null) {
                    return;
                }
                if(!clicked){
                    fade(1)(d);
                }
            })
            .on('click', function(d) {
                clicked = !clicked
                if(clicked){
                    document.querySelector('#panel').dispatchEvent(
                        new CustomEvent("hoverNode", { "detail": d.name })
                    );
                    
                }else{
                   fade(1)(d); 
                }
            })
            
            .on('dblclick', function(d) {
                select(d.name);
            });
        node.append("circle")
            .attr("r", function(d) { if(d.type == 'Process'){return 6*(d.size || 1);}else{return 4.5 * (d.size || 1);}})
            .style('stroke', function(d) {
                return d3.scale.linear()
                    .domain([1, 0])
                    .range(["steelblue", "red"])(d.type !== "Process" ? 1 : 0);
            })
            .style('fill', function(d) {
                if (typeof d.satisfaction === "undefined") return '#fff';
                return d3.scale.linear()
                    .domain([1, 0])
                    .range(["white", "#f66"])(typeof d.satisfaction !== "undefined" ? d.satisfaction : 1);
            });

        node.append("text")
            .attr("dy", ".31em")
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
            .text(function(d) { return d.name; });
    };

    /**
     * Add the node dependents in the tree
     * @param {Array} nodes
     */
    var addDependents = function(nodes) {
        var dependents = [];
        nodes.forEach(function(node) {
            if (node.dependsOn) {
                node.dependsOn.forEach(function(dependsOn) {
                    if (!dependents[dependsOn]) {
                        dependents[dependsOn] = [];
                    }
                    dependents[dependsOn].push(node.name);
                });
            }
        });
        nodes.forEach(function(node, index) {
            if (dependents[node.name]) {
                nodes[index].dependents = dependents[node.name];
            }
        });
    };

    /**
     * Add indices to a node, including inherited ones.
     *
     * Mutates the given node (datum).
     *
     * Example added properties:
     * {
     *   index: {
     *     relatedNodes: ["Foo", "Bar", "Baz", "Buzz"],
     *     kpis: ["Foo", "Bar"],
     *     host: ["OVH", "fo"] 
     *   }
     * }
     */
    var addIndex = function(node) {
        node.index = {
            relatedNodes: [],
            kpis: [],
            machines: [],
            hosts: []
        };
        var dependsOn = getDetailCascade(node, 'dependsOn');
        if (dependsOn.length > 0) {
            node.index.relatedNodes = node.index.relatedNodes.concat(dependsOn);
        }
        if (node.dependents) {
            node.index.relatedNodes = node.index.relatedNodes.concat(node.dependents);
        }
        var kpis = getDetailCascade(node, 'kpis');
        if (kpis.length > 0) {
            node.index.kpis = kpis;
        }
        var machines = getDetailCascade(node, 'machines');
        if (machines.length > 0) {
            node.index.machines = machines;
        }
        var hosts = getHostsCascade(node);
        if (hosts.length > 0) {
            node.index.hosts = hosts;
        }
    };

    var getDetailCascade = function(node, detailName) {
        var values = [];
        if (node[detailName]) {
            node[detailName].forEach(function(value) {
                values.push(value);
            });
        }
        if (node.parent) {
            values = values.concat(getDetailCascade(node.parent, detailName));
        }
        return values;
    };

    var getHostsCascade = function(node) {
        var values = [];
        if (node.host) {
            for (var i in node.host) {
                values.push(i);
            }
        }
        if (node.parent) {
            values = values.concat(getHostsCascade(node.parent));
        }
        return values;
    };

    var fade = function(opacity) {
        return function(node) {
            //if (!node.dependsOn || !(node.parent && node.parent.dependsOn)) return;
            svg.selectAll(".node")
                .filter(function(d) {
                    if (d.name === node.name) return false;
                    return node.index.relatedNodes.indexOf(d.name) === -1;
                })
                .transition()
                .style("opacity", opacity);
        };
    };

    var filters = {
      name: '',
      kpis: [],
      machines: [],
      hosts: []
    };

    var isFoundByFilter = function(d) {
        var i;
        if (!filters.name && !filters.kpis.length && !filters.machines.length && !filters.hosts.length) {
            // nothing selected
            return true;
        }
        if (filters.name) {
            if (d.name.toLowerCase().indexOf(filters.name) === -1 && d.requirement && d.requirement.toLowerCase().indexOf(filters.name) === -1){
                return false 
            }
        }
        var kpisCount = filters.kpis.length;
        if (kpisCount) {
            if (d.index.kpis.length === 0) return false;
            for (i = 0; i < kpisCount; i++) {
                if (d.index.kpis.indexOf(filters.kpis[i]) === -1) return false;
            }
        }
        var machinesCount = filters.machines.length;
        if (machinesCount) {
            if (d.index.machines.length === 0) return false;
            for (i = 0; i < machinesCount; i++) {
                if (d.index.machines.indexOf(filters.machines[i]) === -1) return false;
            }
        }
        var hostCount = filters.hosts.length;
        if (hostCount) {
            if (d.index.hosts.length === 0) return false;
            for (i = 0; i < hostCount; i++) {
                if (d.index.hosts.indexOf(filters.hosts[i]) === -1) return false;
            }
        }
        return true;
    };

    var refreshFilters = function() {
        d3.selectAll('.node').classed('notFound', function(d) {
            return !isFoundByFilter(d);
        });
    };

    var select = function(name) {
        if (activeNode && activeNode.name == name) {
            unselect();
            return;
        }
        unselect();
        svg.selectAll(".node")
            .filter(function(d) {
                if (d.name === name) return true;
            })
            .each(function(d) {
                document.querySelector('#panel').dispatchEvent(
                    new CustomEvent("selectNode", { "detail": d.name })
                );
                d3.select(this).attr("id", "node-active");
                activeNode = d;
                fade(0.5)(d);
            });
    };

    var unselect = function() {
        if (activeNode == null) return;
        fade(1)(activeNode);
        d3.select('#node-active').attr("id", null);
        activeNode = null;
        document.querySelector('#panel').dispatchEvent(
            new CustomEvent("unSelectNode")
        );
    };

    chart.select = select;
    chart.unselect = unselect;

    chart.data = function(value) {
        if (!arguments.length) return treeData;
        treeData = value;
        return chart;
    };

    chart.diameter = function(value) {
        if (!arguments.length) return diameter;
        diameter = value;
        return chart;
    };

    chart.nameFilter = function(nameFilter) {
        filters.name = nameFilter.toLowerCase();
        refreshFilters();
    };

    chart.kpisFilter = function(kpisFilter) {
        filters.kpis = kpisFilter;
        refreshFilters();
    };

    chart.machinesFilter = function(machinesFilter) {
        filters.machines = machinesFilter;
        refreshFilters();
    };

    chart.hostsFilter = function(hostsFilter) {
        filters.hosts = hostsFilter;
        refreshFilters();
    };

    return chart;
};
