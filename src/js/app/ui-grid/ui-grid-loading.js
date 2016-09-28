/*global angular*/
angular
    .module('ui.grid')
    .directive(
        'uiGridLoading',
        [
            'gridUtil',
            function (gridUtil) {
                'use strict';
                return {
                    restrict: 'A',
                    replace: true,
                    priority: -150,
                    require: ['^uiGrid'],
                    scope: false,
                    compile: function () {
                        return {
                            pre: function ($scope, $elm, $attrs, controllers) {
                                // Function for attaching the template to this scope
                                $scope.$watch(
                                    'loading',
                                    function (newFunc) {
                                        if (newFunc === true) {
                                            $elm.find('[rel="loading"]').show();
                                        } else {
                                            $elm.find('[rel="loading"]').hide();
                                        }
                                    }
                                );
                            },
                            post: function ($scope, $elm, $attrs, controllers) {
                                $elm.prepend(
                                    '<div rel="loading">' +
                                        '<p>' +
                                            '<img src="img/ajax-loader.gif"/><br/> ' +
                                            'Loading...' +
                                        '</p>' +
                                    '</div>'
                                );
                            }
                        };
                    }
                };
            }
        ]
    );
