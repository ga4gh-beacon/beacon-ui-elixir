/*global angular */
/*global appName */
/*global appEnv */

var appModules = [
    'restangular',
    'ui.router',
    'ui.bootstrap',
    'ngCookies',
    'ui.grid',
    'ui.grid.edit',
    'ui.grid.selection',
    'ui.grid.infiniteScroll',
    'ui.grid.resizeColumns',
    'ui.grid.autoResize',
    'ui.grid.exporter',
    'EgaEnums',
    'EgaGrid',
    'egaFilters',
    'angulartics',
    'angulartics.google.analytics',
    'angular-growl',
    'PortalResources',
    appName + "Config",
    'egaServicesSession',
    "navigation"
];

if (appEnv === 'MOCK') {
    appModules.push(appName + "Mocks");
}

angular.module(
    appName,
    appModules
).run(
    [
        '$rootScope',
        '$rootElement',
        '$state',
        '$log',
        'Config',
        'growl',
        'egaServicesSession',
        function ($rootScope, $rootElement, $state, $log, Config, growl, egaServicesSession) {
            'use strict';

            $rootScope.$state = $state;

            $rootScope.ngApp         = $rootElement.attr('ng-app');
            $rootScope.toState       = null;
            $rootScope.toStateParams = null;
            $rootScope.returnToState = null;
            $rootScope.returnToStateParams = null;

            $rootScope.notifications = [];

            $rootScope.egaServicesSession = egaServicesSession;

            if (Config.authenticate === true) {
                $rootScope.$on(
                    'session.login',
                    function () {
                        growl.success("You have successfully logged in");
                    }
                );

                $rootScope.$on(
                    'session.unauthorized',
                    function (ev, params) {
                        growl.warning(
                            "You are not authorized to access to such resource. " +
                                (!params.authenticated ? 'Please, log in if necessary' : ''),
                            {ttl: 3000}
                        );
                    }
                );

                $rootScope.$on(
                    '$stateChangeStart',
                    function (ev, toState, toStateParams) {
                        $log.debug("State from", $state.current);
                        $log.debug("State to", toState);
                        if (toState.abstract !== true) {
                            $rootScope.toState = toState;
                            $rootScope.toStateParams = toStateParams;
                        }
                        if (toState.name === egaServicesSession.forbiddenState) {
                            $log.debug("Loading login page");
                        } else {
                            $log.debug("$stateChangeStart Saving non-abstract toState", toState);
                            if (!egaServicesSession.isAuthorized()) {
                                ev.preventDefault();
                                egaServicesSession.redirect403();
                            }

                        }
                    }
                );

                if (!egaServicesSession.checkSession()) {
                    egaServicesSession.redirect403();
                }
            }
            growl.info("Application loaded");
        }
    ]
);
