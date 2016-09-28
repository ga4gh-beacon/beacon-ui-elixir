/*global angular */

angular.module('egaServicesSession', [])
    .factory(
        'egaServicesSession',
        [
            '$rootScope', '$http', '$state', '$log', 'sessionStorage', 'Config', 'APIBase',
            function ($rootScope, $http, $state, $log, sessionStorage, Config, APIBase) {
                'use strict';
                var self,
                    defaultAcl = {
                        enable: true,
                        // If no ACL is provided, access is denied by default
                        // defaultAccess: 'deny',
                        anonymousRole: 'anonymous',
                        // If a node does not have authorized roles list, use the next list as default
                        // By default, all states are publicly accessible
                        // Please, note that defaultRoles has precedence over defaultAccess, so you can
                        // combine them both, or use one of them
                        defaultStateRoles: ['ROLE_ADMIN'],
                        defaultUserRoles: [{authority: 'anonymous'}],

                        // Here is the string used to identify the anonymous role
                        stateAttribute: 'access'
                    },
                    service = {

                        session: null,

                        circularity: 0,

                        user: null,

                        acl: angular.isObject(Config.acl) ?
                                angular.extend(
                                    defaultAcl,
                                    Config.acl
                                ) :
                                defaultAcl,

                        loginState: Config.loginState || 'authz.login',

                        loggedInState: Config.loggedInState || 'authz.panel',

                        forbiddenState: Config.forbiddenState || 'authz.login',

                        isAuthenticated: function isAuthenticated() {
                            return self.session !== null;
                        },

                        getUser: function getUser() {
                            return (angular.isObject(self.user) ? self.user : null);
                        },

                        isAuthorized: function isAuthorized() {
                            self.circularity += 1;
                            var authorized = false,
                                thisRole,
                                thisStateRole,
                                checkRoles,
                                userRoles = [],
                                stateRoles = [];

                            if (self.circularity < 10) {
                                $log.debug('isAuthorized', $rootScope.toState);
                                if (
                                    angular.isObject($rootScope.toState) &&
                                        $rootScope.toState.abstract !== true
                                ) {
                                    $log.debug("checking a non-abstract state");
                                    if (self.acl.enable === true) {
                                        $log.debug("ACL is enabled");
                                        userRoles = (self.getUser() || {authorities: self.acl.defaultUserRoles}).authorities;
                                        stateRoles = (angular.isArray($rootScope.toState.roles) ? $rootScope.toState.roles : self.acl.defaultStateRoles);
                                        $log.debug("User roles are ", userRoles);

                                        checkRoles = $rootScope.toState.roles || self.acl.defaultStateRoles;
                                        $log.debug("This state has roles to check against:", checkRoles);

                                        for (thisRole = 0; thisRole < userRoles.length; thisRole += 1) {
                                            $log.debug("Starting to check user role", userRoles[thisRole].authority);

                                            for (
                                                thisStateRole = 0;
                                                thisStateRole < checkRoles.length;
                                                thisStateRole += 1
                                            ) {
                                                $log.debug(userRoles[thisRole].authority, " vs ", checkRoles[thisStateRole]);
                                                if (
                                                    userRoles[thisRole].authority.indexOf(checkRoles[thisStateRole]) === 0 ||
                                                        checkRoles[thisStateRole].indexOf(self.acl.anonymousRole) === 0
                                                ) {
                                                    authorized = true;
                                                    break;
                                                }
                                            }
                                            if (authorized === true) {
                                                break;
                                            }
                                        }
                                    } else {
                                        /**
                                         * Backward incompatible change: if the ACL process is not enabled,
                                         * this should be completely disabled (so everything is public)
                                         */
                                        authorized = true;
                                    }
                                    self.circularity = 0;
                                }
                            } else {
                                $log.warn("Circularity limit reached");
                                self.circularity = 0;
                                authorized = false;
                            }
                            $log.debug("Authorized:", authorized);
                            return authorized;
                        },

                        redirectLogin: function redirectLogin() {

                        },

                        redirectForbidden: function redirectForbidden() {

                        },

                        redirect403: function redirect403() {
                            self.circularity = 0;
                            if ($rootScope.returnToState === null) {
                                $log.debug(
                                    "Not authenticated. Saving returnToState",
                                    $rootScope.toState
                                );
                                $rootScope.returnToState = $rootScope.toState;
                                $rootScope.returnToStateParams = $rootScope.toStateParams;
                            }
                            if ($rootScope.toState !== null && $rootScope.toState.name !== self.loginState) {
                                $rootScope.$broadcast(
                                    'session.unauthorized',
                                    {
                                        authenticated: self.isAuthenticated()
                                    }
                                );
                                $log.debug(
                                    "Requesting " + self.loginState +
                                        " before " + $rootScope.toState.name
                                );
                                $state.go(self.loginState);
                            }/* else {
                                $state.go(self.loginState);
                            }*/
                        },

                        checkSession: function checkSession() {
                            if (sessionStorage.getSession() !== null) {
                                self.session = sessionStorage.getSession();
                                self.user    = sessionStorage.getUser();
                                $http.defaults.headers.common.Authorization = "Bearer " + sessionStorage.getSession().sessionToken;
                                $http.defaults.headers.common['X-Token'] = sessionStorage.getSession().sessionToken;
                                if (!self.isAuthorized()) {
                                    self.redirect403();
                                }
                            }
                            return false;
                        },

                        getSession: function getSession() {
                            if (angular.isObject(self.sessionService)) {
                                $http({
                                    method: 'GET',
                                    url: APIBase.api + "sessions/"
                                }).success(
                                    function (data) {
                                        self.session = data.response.result[0].session;
                                        self.user    = data.response.result[0].user;
                                    }
                                ).error(
                                    function (data, status, headers, config) {
                                        $log.debug(data, status, headers, config);
                                        self.session = null;
                                        self.user = null;
                                    }
                                );
                            } else {
                                $log.warn("Could not get Session service.");
                            }
                        },

                        postSession: function postSession(username, pwd, cb, cb_err) {
                            $http({
                                url: APIBase.api + 'login',
                                method: 'POST',
                                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                                data: 'username=' + encodeURIComponent(username) +
                                        '&password=' + encodeURIComponent(pwd) +
                                        '&loginType=' + encodeURIComponent(Config.loginType || Config.application)
                            }).success(
                                function (data) {
                                    // $rootScope.token = data.response.result[0].session.sessionToken;
                                    self.session = data.response.result[0].session;
                                    self.user    = data.response.result[0].user;

                                    $http.defaults.headers.common.Authorization = "Bearer " + self.session.sessionToken;
                                    $http.defaults.headers.common['X-Token'] = self.session.sessionToken;

                                    sessionStorage.setSession(self.session, self.user);

                                    var targetState = (
                                        angular.isObject($rootScope.returnToState) &&
                                            $rootScope.returnToState.name !== self.loginState ?
                                                    $rootScope.returnToState.name :
                                                    self.loggedInState
                                    );
                                    // Sooner or later the following feature should be implemented
                                    // inside of angulartics.
                                    // if (!angular.isUndefined($window) && angular.isFunction($window.ga)) {
                                    //     $window.ga('set', 'username', username);
                                    // } else {
                                    //     $log.error("No Analytics object is present to track username");
                                    // }
                                    $log.debug("Logged successfully, going to " + targetState, $rootScope.returnToState);

                                    $state.go(targetState, $rootScope.returnToStateParams);

                                    $rootScope.$broadcast('session.login');

                                    if (angular.isFunction(cb)) {
                                        cb(data);
                                    }
                                }
                            ).error(
                                function (data, status, headers, config) {
                                    $log.debug(data, status, headers, config);
                                    self.session = null;
                                    self.user = null;
                                    delete $http.defaults.headers.common.Authorization;
                                    delete $http.defaults.headers.common['X-Token'];

                                    $rootScope.$broadcast('session.login_error');

                                    sessionStorage.emptySession();
                                    if (angular.isFunction(cb_err)) {
                                        cb_err(data);
                                    }
                                }
                            );
                        },

                        removeSession: function removeSession() {

                            $http({
                                method: 'DELETE',
                                url: APIBase.api + "logout"
                            }).success(
                                function () {
                                    if (angular.isDefined($http.defaults.headers.common.Authorization)) {
                                        delete $http.defaults.headers.common['X-Token'];
                                        delete $http.defaults.headers.common.Authorization;
                                    }
                                    if (self.session !== null) {
                                        self.session = null;
                                        self.user = null;
                                        $rootScope.$broadcast('session.logout');
                                        sessionStorage.emptySession();
                                    }
                                    $state.go(self.loginState);
                                }
                            ).error(
                                function () {
                                    if (angular.isDefined($http.defaults.headers.common.Authorization)) {
                                        delete $http.defaults.headers.common.Authorization;
                                        delete $http.defaults.headers.common['X-Token'];
                                    }
                                    if (self.session !== null) {
                                        self.session = null;
                                        self.user = null;
                                        $rootScope.$broadcast('session.logout');
                                        sessionStorage.emptySession();
                                    }
                                    $state.go(self.loginState);
                                }
                            );
                        }

                    };

                self = service;

                return service;
            }
        ]
    ).factory(
        'sessionStorage',
        [
            '$window', 'Config',
            function ($window, Config) {
                'use strict';
                var self,
                    service = {
                        emptySession: function () {
                            self.removeSession()
                                .removeUser();
                        },
                        removeSession: function () {
                            self.removeData(Config.application + '.session');
                            return self;
                        },
                        removeUser: function () {
                            self.removeData(Config.application + '.user');
                            return self;
                        },
                        setSession: function (sessionData, userData) {
                            self.setData(Config.application + '.session', sessionData);
                            self.setData(Config.application + '.user', userData);
                            return self;
                        },

                        getSession: function () {
                            return self.getData(Config.application + '.session');
                        },
                        getUser: function () {
                            return self.getData(Config.application + '.user');
                        },

                        setData: function (attribute, value) {
                            if (!angular.isString(value)) {
                                value = JSON.stringify(value);
                            }
                            try {
                                $window.sessionStorage.setItem(attribute, value);
                                return self.getData(attribute);
                            } catch (e) {
                                return null;
                            }
                        },

                        getData: function (attribute) {
                            try {
                                return JSON.parse($window.sessionStorage.getItem(attribute));
                            } catch (e) {
                                try {
                                    return $window.sessionStorage.getItem(attribute);
                                } catch (e2) {
                                    return null;
                                }
                            }
                        },

                        removeData: function (attribute) {
                            try {
                                $window.sessionStorage.removeItem(attribute);
                                return true;
                            } catch (e) {
                                return false;
                            }
                        }
                    };
                self = service;

                return service;
            }
        ]
    )
    .config(
        function ($provide) {
            'use strict';
            $provide.factory(
                'httpSessionFinishedInterceptor',
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
    );
