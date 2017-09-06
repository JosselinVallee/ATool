angular.module('ChartsApp').controller('filterCtrl', function ($scope, bus) {
    'use strict';

    bus.on('updateData', function(data) {
        $scope.kpis = computekpis(data);
        $scope.hosts = computeHosts(data);
    });

    $scope.nameFilter = '';

    var kpisFilter = [];
    var hostsFilter = [];

    $scope.$watch('nameFilter', function(name) {
        bus.emit('nameFilterChange', name);
    });

    $scope.togglekpiFilter = function(kpi) {
        if ($scope.iskpiInFilter(kpi)) {
            kpisFilter.splice(kpisFilter.indexOf(kpi), 1);
        } else {
            kpisFilter.push(kpi);
        }
        bus.emit('kpisFilterChange', kpisFilter);
    };

    $scope.iskpiInFilter = function(kpi) {
        return kpisFilter.indexOf(kpi) !== -1;
    };

    $scope.toggleHostFilter = function(host) {
        if ($scope.isHostInFilter(host)) {
            hostsFilter.splice(hostsFilter.indexOf(host), 1);
        } else {
            hostsFilter.push(host);
        }
        bus.emit('hostsFilterChange', hostsFilter);
    };

    $scope.isHostInFilter = function(host) {
        return hostsFilter.indexOf(host) !== -1;
    };

    function computekpis(rootNode) {
        var kpis = [];

        function addNodekpis(node) {
            if (node.kpis) {
                node.kpis.forEach(function(kpi) {
                    kpis[kpi] = true;
                });
            }
            if (node.children) {
                node.children.forEach(function(childNode) {
                    addNodekpis(childNode);
                });
            }
        }

        addNodekpis(rootNode);

        return Object.keys(kpis).sort();
    }

    function computeHosts(rootNode) {
        var hosts = {};

        function addNodeHosts(node) {
            if (node.host) {
                for (var i in node.host) {
                    hosts[i] = true;
                }
            }
            if (node.children) {
                node.children.forEach(function(childNode) {
                    addNodeHosts(childNode);
                });
            }
        }

        addNodeHosts(rootNode);

        return Object.keys(hosts).sort();
    }

});
