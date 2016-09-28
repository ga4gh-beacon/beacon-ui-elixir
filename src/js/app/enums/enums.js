/*global angular*/
/*global appName */

angular.module('EgaEnums', ['PortalResources'])
    .factory(
        "Enums",
        [
            'EgaRest', '$timeout', '$q',
            function Enums(Restangular, $timeout, $q) {
                'use strict';
                var self,
                    service = {

                        resource: null,

                        enums: {},

                        kickstart: function () {
                            angular.forEach(
                                self.enums,
                                function (thisEnum) {
                                    self.load(thisEnum);
                                }
                            );
                        },

                        load: function (resourceName) {
                            self
                                .getList(resourceName)
                                .then(
                                    function (enumData) {
                                        self.enums[resourceName] = enumData;
                                    }
                                );
                        },

                        getList: function getList(resourceName) {
                            var deferred;
                            if (angular.isUndefined(self.enums[resourceName]) || !self.enums[resourceName].length) {
                                return Restangular
                                        .all('enums/' + resourceName)
                                        .getList(
                                        {
                                            skip: 0,
                                            limit: 0
                                        }
                                    );
                            } else {
                                deferred = $q.defer();

                                $timeout(
                                    function () {
                                        return deferred.resolve(self.enums[resourceName]);
                                    },
                                    1
                                );
                                return deferred;
                            }
                        },

                        getAsObject: function getAsObject(resourceName) {
                            return self
                                .getList(resourceName)
                                .then(
                                    function onResourceGetList(resourceList) {
                                        var enumObject = {}, thisResource;
                                        for (thisResource = 0; thisResource < resourceList.length; thisResource += 1) {
                                            enumObject[resourceList[thisResource].tag] = resourceList[thisResource];
                                        }
                                        return enumObject;
                                    }
                                );
                        }
                    };

                self = service;

                return service;
            }
        ]
    ).directive(
        'egaEnumSelect',
        [
            'Enums',
            function (Enums) {
                'use strict';
                return {
                    restrict: 'E',
                    templateUrl: 'js/app/enums/partials/ega-enum-select.html',
                    replace: true,
                    scope: {
                        required: '@?',
                        enumName: '@',
                        enumValue: '@',
                        enumGroup: '@'
                    },
                    link: function (scope, element, attrs) {
                        scope.selectedValue = '';
                        scope.egaEnum = {};
                        scope.model   = attrs.enumValue;

                        scope.required = angular.isDefined(scope.required) ? true : false;
                        scope.editable = /^(true|1|yes)$/.test((attrs.editable || '1')) ? true : false;

                        Enums.getAsObject(scope.enumName)
                            .then(
                                function (data) {
                                    scope.egaEnum = data;
                                },
                                function (err) {
                                    //Changing the control style to show the error?
                                }
                            );
                    }
                };
            }
        ]
    ).directive(
        'egaEnumValue',
        [
            'Enums',
            function (Enums) {
                'use strict';
                return {
                    restrict: 'A',
                    templateUrl: 'js/app/enums/partials/ega-enum-value.html',
                    replace: true,
                    scope: {
                        required: '=?',
                        enumName: '@',
                        enumKey: '@',
                        enumPlaceholder: '@'
                    },
                    link: function (scope, element, attrs) {
                        scope.selectedValue = '';
                        scope.model = attrs.enumKey;
                        scope.egaEnum = {};
                        scope.enumPlaceholder = attrs.enumPlaceholder || '';

                        scope.required = angular.isDefined(scope.required) ? true : false;
                        scope.editable = /^(true|1|yes)$/.test((attrs.editable || '1')) ? true : false;

                        Enums.getAsObject(scope.enumName)
                            .then(
                                function (data) {
                                    scope.egaEnum = data;
                                },
                                function (err) {
                                    //Changing the control style to show the error?
                                }
                            );
                    }
                };
            }
        ]
    );
