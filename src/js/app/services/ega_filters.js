angular.module('egaFilters', [])
    .filter(
        'truncate',
        function () {
            'use strict';
            return function (text, length, end) {
                if (isNaN(length)) {
                    length = 10;
                }

                if (angular.isUndefined(end)) {
                    end = '...';
                }

                if (text.length <= length || text.length - end.length <= length) {
                    return text;
                }
                return String(text).substring(0, length - end.length) + end;
            };
        }
    )
    .filter('statuscolor', function () {
        'use strict';
        return function (text) {
            var status,
                statusMap = {
                    started: 'success',
                    stopped: 'danger',
                    'not implemented': 'warning',
                    'unknown': 'default'
                },
                css = null;

            if (!angular.isUndefined(text)) {
                for (status in statusMap) {
                    if (statusMap.hasOwnProperty(status)) {
                        if (text.toLowerCase() === status) {
                            css = statusMap[status];
                        }
                    }
                }
            }

            if (css === null) {
                css = 'default';
            }

            return css;
        };
    })
    .filter('methodcolor', function () {
        'use strict';
        return function (text) {
            var statusMap = {
                'get': 'success',
                'post': 'primary',
                'put': 'warning',
                'delete': 'danger',
                'default': 'default'
            };

            return (!angular.isUndefined(statusMap[text.trim().toLowerCase()]) ?
                    statusMap[(text || '').trim().toLowerCase()] :
                    'success'
            );
        };
    })
    .filter('submitstatus', function () {
        'use strict';
        return function (text) {
            return 'badge status-' + (text || '').toLowerCase().replace('_', '-');
        };
    })
    .filter(
        'urlparametrize',
        [
            '$sce',
            function ($sce) {
                'use strict';
                return function (text) {
                    text = text || '';

                    var urlPart,
                        urlParts = text.split('/'),
                        contenteditable = ' contenteditable="true"',
                        isParamRegex    = /^\{(.+)\}$/,
                        editable,
                        editableUrl,
                        tag;

                    for (urlPart = 0; urlPart < urlParts.length; urlPart += 1) {
                        if (urlParts[urlPart].length > 0) {
                            editable = isParamRegex.test(urlParts[urlPart]);
                            tag      = (editable ? 'strong' : 'span');

                            urlParts[urlPart] =
                                        '<' + tag + (editable ? contenteditable : '') + '>' +
                                        urlParts[urlPart].replace(/[\{\}]/g, '') +
                                        '</' + tag + '>';
                        }
                    }
                    editableUrl = urlParts.join('/');

                    return $sce.trustAsHtml(editableUrl);
                };
            }
        ]
    )
    .filter(
        'statusworkflow',
        function () {
            'use strict';
            return function (text, action) {
                var status,
                    disable = 'false',
                    disableButtonMap = {
                        started: {
                            play: true,
                            stop: false,
                            pause: false,
                            reload: true
                        },
                        stopped: {
                            play: false,
                            stop: true,
                            pause: true,
                            reload: false
                        },
                        paused: {
                            play: false,
                            stop: false,
                            pause: false,
                            reload: false
                        },
                        'not implemented': {
                            play: true,
                            stop: true,
                            pause: true,
                            reload: true
                        },
                        unknown:  {
                            play: false,
                            stop: false,
                            pause: false,
                            reload: false
                        }
                    };

                if (!angular.isUndefined(text)) {
                    for (status in disableButtonMap) {
                        if (disableButtonMap.hasOwnProperty(status)) {
                            if (text.toLowerCase() === status) {
                                disable = disableButtonMap[status][action];
                            }
                        }
                    }
                }
                return (disable ? 'disabled' : 'enabled');
            };
        }
    );
