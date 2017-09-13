/*global angular*/
/*global appName*/

angular.module(appName)
    .config(
        function config($stateProvider) {
            'use strict';
            $stateProvider
                .state(
                    'authz.search',
                    {
                        views: {
                            '': {
                                controller: 'beaconsSearchController',
                                templateUrl: 'js/app/beacons/partials/search.html'
                            },
                            'beaconResults@authz.requests_beacon': {
                                templateUrl: 'js/app/beacons/partials/results.html'
                            }
                        }
                    }
                );
        }
    ).constant(
        'ChromosomeGRCh37Limits',
        {
            reference: 'http://www.ncbi.nlm.nih.gov/assembly/GCF_000001405.25/#/st',
            limits: {
                chr1:  249250621,
                chr2:  243199373,
                chr3:  198022430,
                chr4:  191154276,
                chr5:  180915260,
                chr6:  171115067,
                chr7:  159138663,
                chr8:  146364022,
                chr9:  141213431,
                chr10: 135534747,
                chr11: 135006516,
                chr12: 133851895,
                chr13: 115169878,
                chr14: 107349540,
                chr15: 102531392,
                chr16: 90354753,
                chr17: 81195210,
                chr18: 78077248,
                chr19: 59128983,
                chr20: 63025520,
                chr21: 48129895,
                chr22: 51304566,
                chrX:  155270560,
                chrY:  59373566,
                chrMT: 16569
            }
        }
    )
    .controller(
        'beaconsInfoController',
        [
            '$scope',
            '$http',
	    '$cookies',
            '$sce',
            'Config',
            function beaconsInfoController($scope, $http, $cookies, $sce, Config) {
                'use strict';
                var api = (
                    Config.API.protocol + '://' +
                    Config.API.host +
                    (angular.isDefined(Config.API.port) ? ':' + Config.API.port : '')  +
                    Config.API.path +
                    (angular.isDefined(Config.API.endpoint) ? Config.API.endpoint : '') + '/'
                );
                $scope.beaconDescription = '';
		$scope.authorized = false;
		$scope.has_session = $cookies.get('JSESSIONID');

                $http.get(api + '/?limit=0')
                    .then(
                        function onBeaconInfoSuccess(result) {
                            $scope.beaconDescription = $sce.trustAsHtml(result.data.description);
                        },
                        function onBeaconInfoError() {
                            $scope.beaconDescription = '';
                        }
                    );
            }
        ]
    )
    .controller(
        "beaconsSearchController",
        [
            '$rootScope',
            '$scope',
            '$log',
            '$http',
            '$sce',
            'Config',
            'ChromosomeGRCh37Limits',
            function beaconsSearchController($rootScope, $scope, $log, $http, $sce, Config, ChromosomeGRCh37Limits) {
                'use strict';

                var api = (
                        Config.API.protocol + '://' +
                        Config.API.host +
                        (angular.isDefined(Config.API.port) ? ':' + Config.API.port : '')  +
                        Config.API.path +
                        (angular.isDefined(Config.API.endpoint) ? Config.API.endpoint : '') + '/'
                    ),
                    referenceGenomeKeys = {};

                $scope.results          = [];

                $scope.beacon           = {};
                $scope.overallSize      = 0;

                $scope.referenceGenomes = [];
                $rootScope.beaconInfo   = {};

                $scope.chromosomeLimits = {
                    GRCh37: ChromosomeGRCh37Limits.limits
                };

                $scope.searchForm = {
                    referenceName: '1',
                    alternateBases: 'A',
                    start: 0,
                    datasetIds: 'all'
                };

                $scope.getDatasets = function getDatasets() {
                    $http.get(api + '?limit=0')
                        .then(
                            function onBeaconInfoSuccess(result) {
                                var idx,
                                    overallSize = 0,
                                    thisRg = 0,
                                    data = angular.copy(result.data);

                                $scope.datasets         = {};
                                $scope.beaconDescription = $sce.trustAsHtml(data.description);
                                $scope.beacon           = data.beacon;
                                $scope.overallSize      = data.size;
                                $scope.referenceGenomes = [];

                                for (idx = 0; idx < data.datasets.length; idx += 1) {
                                    if (data.datasets[idx].info.authorized.match(/true/)) {
                                        data.datasets[idx].assemblyId = data.datasets[idx].assemblyId.substr(0, 3).toUpperCase() +
                                            data.datasets[idx].assemblyId.substr(3, 10).toLowerCase();

                                        if (data.datasets[idx].variantCount > 0) {
                                            $scope.datasets[data.datasets[idx].id] = {
                                                id: data.datasets[idx].id,
                                                name: data.datasets[idx].id,
                                                size: data.datasets[idx].variantCount,
                                                authorized: data.datasets[idx].info.authorized,
                                                assemblyId: data.datasets[idx].assemblyId,
                                                referenceGenome: data.datasets[idx].assemblyId
                                            };
                                            if (angular.isUndefined(referenceGenomeKeys[data.datasets[idx].assemblyId])) {
                                                referenceGenomeKeys[data.datasets[idx].assemblyId] = 0;
                                            }
                                            referenceGenomeKeys[data.datasets[idx].assemblyId] += data.datasets[idx].variantCount;
                                            overallSize += data.datasets[idx].variantCount;
                                            $log.debug($scope.datasets[data.datasets[idx].id]);
                                        }
                                    }
                                }
                                if ($scope.overallSize === null) {
                                    $scope.overallSize = overallSize;
                                }
                                $scope.referenceGenomes = Object.keys(referenceGenomeKeys);

                                for (thisRg = 0; thisRg < $scope.referenceGenomes.length; thisRg += 1) {
                                    $scope.datasets.all = {
                                        id: 'all',
                                        name: "All " + $scope.referenceGenomes[thisRg],
                                        size: referenceGenomeKeys[$scope.referenceGenomes[thisRg]],
                                        authorized: true,
                                        assemblyId: $scope.referenceGenomes[thisRg],
                                        referenceGenome: $scope.referenceGenomes[thisRg]
                                    };
                                }

                                $scope.beaconInfo = data;

                                $scope.searchForm.datasetIds = 'all';
                                // $scope.searchForm.assemblyId =  $scope.referenceGenomes[0];

                                $log.debug($scope.datasets);
                            },
                            function onBeaconInfoError() {
                                $rootScope.beaconInfo = {};
                            }
                        );
                };

                $scope.getDatasets();

                $scope.$on(
                    'session.login',
                    function () {
                        $scope.getDatasets();
                    }
                );

                $scope.$on(
                    'session.logout',
                    function (ev) {
                        $scope.getDatasets();
                    }
                );

                $scope.chromosomes = [
                    '1',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8',
                    '9',
                    '10',
                    '11',
                    '12',
                    '13',
                    '14',
                    '15',
                    '16',
                    '17',
                    '18',
                    '19',
                    '20',
                    '21',
                    '22',
                    'X',
                    'Y',
                    'MT'
                ];

                $scope.clear = function clear() {
                    $scope.results = [];
                };

                $scope.beaconSearch = function beaconSearch() {

                    var searchParams = angular.copy($scope.searchForm);
                    $log.debug("Form arguments", searchParams);
                    searchParams.assemblyId = angular.copy($scope.datasets[searchParams.datasetIds].referenceGenome);


                    // searchParams.chromosome = $scope.chromosomes[$scope.searchForm.chromosome];
                    delete searchParams.referenceGenome;

                    if (searchParams.datasetIds.toLowerCase().indexOf('all') === 0 || searchParams.datasetIds === '') {
                        delete searchParams.datasetIds;
                    }

                    $log.debug("Sending arguments", searchParams);

                    $http({
                        url: api + 'query',
                        method: 'POST',
                        params: searchParams,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }).then(
                        function onBeaconResponse(beaconResult, p2, p3) {
                            var thisResult = angular.copy($scope.searchForm);
                            thisResult.result = beaconResult.data.alleleRequest;
                            thisResult.result.exists = beaconResult.data.exists;
                            $log.debug(thisResult);
                            $scope.results.push(thisResult);
                        },
                        function onBeaconResponseError(beaconResult) {
                            $log.error(beaconResult);
                        }
                    );
                };

            }
        ]
    ).constant(
        'beaconsGridConfig',
        {
            beacon: {
                enableFiltering: true,

                enableGridMenu: false,

                exportCsv: false,
                exporterCsvFilename: 'datasets.csv',
                csvSelector: '.dataset-csv-link-location',

                queries: [{
                    skip:  0,
                    limit: 0
                }],

                columnDefs: [
                    {
                        field: "id",
                        displayName: "Dataset ID",
                        cellTemplate: '<div class="ui-grid-cell-contents"><a target="_new" href="https://ega.crg.eu/datasets/{{row.entity[col.field]}}">{{row.entity[col.field]}}</a></div>',
                        width: "18%",
                        filter: {
                            condition: 16 // contains
                        }
                    },
                    {
                        field: "description",
                        displayName: "Short title",
                        width: "65%",
                        filter: {
                            condition: 16 // contains
                        }
                    },
                    {
                        field: "info.accessType",
                        displayName: "Access type",
                        width: "17%",
                        cellTemplate: '<div class="ui-grid-cell-contents">'
                                        + '<span class="label label-{{row.entity.info.accessType.indexOf(\'PUBLIC\') === 0 ? \'success\' : row.entity.info.accessType.indexOf(\'REGISTERED\') === 0 ? \'warning\' : \'danger\'}}">'
                                        + '{{row.entity.info.accessType}}'
                                        + '</span>'
                                    + '</div>',
                        filter: {
                            condition: 16 // contains
                        }
                    }
                ]
            }
        }
    ).controller(
        'beaconDatasetsIndexController',
        [
            '$scope', 'beaconDatasets', 'beaconsGridConfig',
            function beaconDatasetsIndexController($scope, beaconDatasets, beaconsGridConfig) {
                'use strict';
                $scope.Datasets = [];

                $scope.config         = beaconsGridConfig.beacon;
                $scope.beaconDatasets = beaconDatasets;

                // UiGridBaseController.call(this, $injector, $scope, datasetsGridConfig.beacon, beaconDatasets);

                $scope.$on(
                    'session.login',
                    function (ev) {
                        $scope.$emit(
                            'resourceChange',
                            {
                                resource: 'datasets'
                            }
                        );
                    }
                );

                $scope.$on(
                    'session.logout',
                    function (ev) {
                        $scope.$emit(
                            'resourceChange',
                            {
                                resource: 'datasets'
                            }
                        );
                    }
                );
            }
        ]
    );
