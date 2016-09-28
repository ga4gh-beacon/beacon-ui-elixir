/*global appName*/

angular.module(appName).config(
    function config($stateProvider) {
        'use strict';
        $stateProvider
            .state(
                'authz.user_account',
                {
                    url: '/account',
                    roles: [
                        'anonymous'
                    ],
                    views: {
                        '': {
                            controller: 'userAccountController',
                            templateUrl: 'js/app/users/partials/my_account.html'
                        },
                        'personal_data@authz.user_account': {
                            controller: 'userPersonalDataController',
                            templateUrl: 'js/app/users/partials/personal_data.html'
                        }
                    }
                }
            );
    }
).controller(
    "userAccountController",
    [
        '$scope',
        '$log',
        'egaServicesSession',
        function ($scope, $log) {
            'use strict';
            $log.log("Hi UserAccount");
        }
    ]
).controller(
    "userPersonalDataController",
    [
        '$scope',
        '$log',
        'Config',
        'Users',
        '$window',
        'egaServicesSession',
        function ($scope, $log, Config, Users, $window) {
            'use strict';
            if ($window.sessionStorage.getItem(Config.application + '.user')) {
                $scope.user = JSON.parse($window.sessionStorage.getItem(Config.application + '.user'));
            }

            $scope.saveUserPersonalData = function saveUserSettings() {
                $http({
                    method: "PUT",
                    url: "/users",
                    data: $scope.user
                }).then(
                    function () {

                    },
                    function () {

                    }
                );
            };
        }
    ]
);
