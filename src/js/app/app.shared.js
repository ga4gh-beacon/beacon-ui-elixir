/*global angular */
/*global appName */
/*global appEnv */
angular.module(
    appName
).config(
    function ($provide) {
        'use strict';
        $provide.factory(
            'httpPortalRequestsInterceptor',
            [
                '$q',
                '$injector',
                function ($q, $injector) {
                    return {
                        response: function (response) {
                            return response;
                        },
                        responseError: function (rejection) {
                            if (rejection.status === 401) {
                                $injector.get('egaServicesSession').removeSession();
                            }
                            return $q.reject(rejection);
                        }
                    };
                }
            ]
        );
    }
).config(
    [
        'growlProvider',
        function (growlProvider) {
            'use strict';
            growlProvider.globalPosition('bottom-right');
            growlProvider.globalTimeToLive(
                {
                    info: 3000,
                    success: 3000,
                    warning: 5000,
                    error: 7000
                }
            );
        }
    ]
).config([
    '$httpProvider',
    'Config',
    function ($httpProvider, Config) {
        'use strict';
        $httpProvider.interceptors.push('httpSessionFinishedInterceptor');
        if (Config.useMocks === true) {
            $httpProvider.interceptors.push('httpMockInterceptor');
        }
    }
]).factory('APIBase', function (Config) {
    'use strict';
    return {
        api: (Config.API.protocol + '://' + Config.API.host + (angular.isDefined(Config.API.port) ? ':' + Config.API.port : '')  + Config.API.path + '/'),
        endpoint: (Config.API.protocol + '://' + Config.API.host + (angular.isDefined(Config.API.port) ? ':' + Config.API.port : '')  + Config.API.path + (angular.isDefined(Config.API.endpoint) ? Config.API.endpoint : '') + '/'),
        host: (Config.API.protocol + '://' + Config.API.host + (angular.isDefined(Config.API.port) ? ':' + Config.API.port : '')  + '/'),
        urlbase: Config.API.path + '/',
        host_noproto: (
            '//' + Config.API.host +
            (angular.isDefined(Config.API.port) ? ':' + Config.API.port : '') +
            Config.API.path + '/'
        )
    };
}).config(
    [
        '$urlRouterProvider', '$logProvider', 'Config',
        function config($urlRouterProvider, $logProvider, Config) {
            'use strict';

            if (Config.debug === true || appEnv.toLowerCase() === 'dev') {
                $logProvider.debugEnabled(true);
            } else {
                $logProvider.debugEnabled(false);
            }

            $urlRouterProvider.otherwise("/");
        }
    ]
);
