/*global angular*/
/*global appName*/
/*global appEnv*/

angular.module('navigation', [])
    .run(
        [
            '$rootScope',
            function ($rootScope) {
                'use strict';
                $rootScope.inboxes = [
                    {
                        resource: null,
                        label: "Home",
                        state: "authz.panel",
                        glyphicon: "home"
                    },
                    {
                        resource: "notifications",
                        label: "Notifications",
                        state: "authz.notifications_index",
                        glyphicon: "inbox"
                    },
                    {
                        resource: "requests",
                        label: "Requests",
                        state: "authz.requests_index",
                        glyphicon: "cloud-download"
                    },
                    {
                        resource: "requests",
                        label: "Beacon",
                        state: "authz.requests_beacon",
                        glyphicon: "search"
                    }
                ];
            }
        ]
    );
