/*global angular*/
/*global appName*/

angular.module(appName)
    .config(
        function config($stateProvider, Config) {
            'use strict';
            $stateProvider
                .state(
                    'authz.panel',
                    Config.states.auth.panel
                ).state(
                    'authz.tos',
                    {
                        url: '^/terms/?',
                        views: {
                            '': {
                                templateUrl: 'js/app/pages/partials/beacon_tos.html'
                            }
                        }
                    }
                );
        }
    );
