/*global angular */
/*global appName */

angular.module(
    'PortalResources',
    [
        'restangular',
        'angular-growl'
    ]
).factory(
    'EgaRest',
    [
        'Restangular', '$rootScope', 'Config', 'growl',
        function config(R, $rootScope, Config, growl) {
            'use strict';
            return R.withConfig(
                function (RestangularConfigurer) {
                    RestangularConfigurer.addResponseInterceptor(
                        function (
                            data,
                            operation,
                            what,
                            url,
                            response,
                            deferred
                        ) {
                            var newResponse;

                            if (!angular.isUndefined(data.response)) {
                                newResponse = (data.response.result || []);
                                newResponse.meta = angular.extend(
                                    data.header,
                                    {
                                        count: data.response.numTotalResults
                                    }
                                );
                            } else {
                                newResponse = data.datasets;
                                newResponse.meta = {
                                    count: data.datasets.length
                                };
                            }

                            if (response.status >= 400) {
                                growl.error(data.header.userMessage + '(', response.status + ')');
                                deferred.reject();
                            } else {
                                if (data.header && data.header.userMessage && !data.header.userMessage.match(/^\s*OK\s*$/ig)) {
                                    growl.success(data.header.userMessage);
                                }
                                if (operation.match(/custom?(post|put)/ig)) {
                                    $rootScope.$broadcast(
                                        "EgaRest::ResourceChange",
                                        {
                                            model: what,
                                            data: data.response
                                        }
                                    );
                                }
                            }
                            return newResponse;
                        }
                    );

                    RestangularConfigurer.setBaseUrl(
                        Config.API.protocol + '://' +
                            Config.API.host +
                            (angular.isDefined(Config.API.port) && Config.API.port.trim()  ? ':' + Config.API.port : '')  +
                            Config.API.path +
                            (angular.isDefined(Config.API.endpoint) ? Config.API.endpoint : '') + '/'
                    );
                }
            );
        }
    ]
).factory(
    'Sessions',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('sessions');
            currentService.route = 'sessions';
            return currentService;
        }
    ]
).factory(
    'Files',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('files');
            currentService.route = 'files';
            return currentService;
        }
    ]
).factory(
    'Experiments',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('experiments');
            currentService.route = 'experiments';
            return currentService;
        }
    ]
).factory(
    'Studies',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('studies');
            currentService.route = 'studies';
            return currentService;
        }
    ]
).factory(
    'Dacs',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('dacs');
            currentService.route = 'dacs';
            return currentService;
        }
    ]
).factory(
    'Policies',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('policies');
            currentService.route = 'policies';
            return currentService;
        }
    ]
).factory(
    'Samples',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('samples');
            currentService.route = 'samples';
            return currentService;
        }
    ]
).factory(
    'Users',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('users');
            currentService.route = 'users';
            return currentService;
        }
    ]
).factory(
    'Datasets',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('datasets');
            currentService.route = 'datasets';
            return currentService;
        }
    ]
).factory(
    'beaconDatasets',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('');

            currentService.route = '';
            return currentService;
        }
    ]
).factory(
    'Runs',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('runs');
            currentService.route = 'runs';
            return currentService;
        }
    ]
).factory(
    'Analyses',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('analyses');
            currentService.route = 'analyses';
            return currentService;
        }
    ]
).factory(
    'Notifications',
    [
        'EgaRest',
        function (Restangular) {
            'use strict';
            var currentService = Restangular.service('notifications');
            currentService.route = 'notifications';
            return currentService;
        }
    ]
);
