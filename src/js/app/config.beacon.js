/*global angular*/
/*global appName*/
/*global appEnv*/

angular
    .module(appName + "Config", [])
    .constant(
        'Config',
        {
            application: "beacon",
            loginType: "requester",
            useMocks: false,
            authenticate: true,
            debug: false,
            view_dir: "partials/",

            API: {
                protocol: "https",
                host: "ega.crg.eu",
                path: "/requesterportal/v1",
                endpoint: "/beacon",
                info: "/info"
            },

            loginState: 'authz.panel',
            loggedInState: 'authz.panel',
            forbiddenState: 'authz.panel',

            acl: {
                enable: false,
                defaultStateRoles: ['ROLE_ADMIN', 'ROLE_REQUESTER']
            },

            states: {
                auth: {
                    panel: {
                        parent: 'authz',
                        url: '^/',
                        roles: [
                            'anonymous'
                        ],
                        views: {
                            '': {
                                templateUrl: 'js/app/pages/partials/beacon.html',
                            },
                            'search@authz.panel': {
                                controller: "beaconsSearchController",
                                templateUrl: "js/app/beacons/partials/search.html"
                            },
                            "results@authz.panel": {
                                templateUrl: "js/app/beacons/partials/results.html"
                            },
                            "datasets@authz.panel": {
                                controller: "beaconDatasetsIndexController",
                                templateUrl: "js/app/datasets/partials/beacon_index.html"
                            }
                        }
                    }
                }
            }
        }
    ).config(
        [
            '$stateProvider',
            function config($stateProvider) {
                'use strict';
                $stateProvider.state(
                    'authz',
                    {
                        abstract: true,
                        views: {
                            '': {
                                template:  '<ui-view/>'
                            },
                            'authz.nav@authz': {
                                templateUrl: 'js/app/toolbars/partials/beacon_nav.html',
                                controller: 'navController'
                            },
                            'authz.login_bar@': {
                                templateUrl: 'js/app/sessions/partials/horiz_login.html',
                                controller: 'loginController'
                            },
                            'authz.beacon_info@': {
                                controller: "beaconsInfoController",
                                templateUrl: "js/app/beacons/partials/beacon_info.html"
                            }
                        }
                    }
                );
            }
        ]
    );
