angular.module('ChartsApp').directive('treeChart', function(bus) {
    'use strict';

    return {
        restrict: 'E',
        replace: true,
        template: '<div id="graph"></div>',
        scope:{
            data: '='
        },
        link: function(scope, element) {
            var chart = d3.chart.architectureTree();

            scope.$watch("data", function(data) {
                if (typeof (data) === 'undefined') {
                    return;
                }

                chart.diameter(window.innerHeight*0.8)
                    .data(scope.data);

                d3.select(element[0])
                    .call(chart);
            });

            bus.on('nameFilterChange', function(nameFilter) {
                chart.nameFilter(nameFilter);
            });

            bus.on('kpisFilterChange', function(kpisFilter) {
                chart.kpisFilter(kpisFilter);
            });

            bus.on('hostsFilterChange', function(hostsFilter) {
                chart.hostsFilter(hostsFilter);
            });

            bus.on('select', function(name) {
                chart.select(name);
            });

            bus.on('unselect', function() {
                chart.unselect();
            });

        }
    };
});
