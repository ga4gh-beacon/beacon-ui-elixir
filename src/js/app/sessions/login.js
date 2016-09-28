/*global angular*/
/*global appName*/

angular.module(appName)
    .config(
        function config($stateProvider) {
            'use strict';
            $stateProvider
                .state(
                    'authz.login',
                    {
                        parent: 'authz',
                        url: '^/login',
                        templateUrl: 'js/app/sessions/partials/login.html',
                        controller: 'loginController'
                    }
                );
        }
    )
    /**
     * Controllers block
     */
    .controller(
        'loginController',
        [
            '$scope', 'growl', 'egaServicesSession', 'Config', '$state',
            function loginController($scope, growl, egaServicesSession, Config, $state) {
                'use strict';
                $scope.authenticating = false;
                $scope.Config = Config;

                $scope.user = {
                    name: '',
                    pwd: ''
                };

                if (egaServicesSession.isAuthenticated()) {
                    $state.go(egaServicesSession.loggedInState);
                }

                $scope.logout = function () {
                    egaServicesSession.removeSession();
                };

                $scope.login = function () {
                    $scope.authenticating = true;
                    egaServicesSession.postSession(
                        $scope.user.name,
                        $scope.user.pwd,
                        function () {
                            $scope.authenticating = false;
                            $scope.loginError = false;
                            $scope.loginMessage = "";
                        },
                        function () {
                            $scope.authenticating = false;
                            $scope.loginError = true;
                            $scope.loginMessage = "Wrong username or password ";
                            growl.error("Wrong username or password");
                        }
                    );
                };
            }
        ]
    );
