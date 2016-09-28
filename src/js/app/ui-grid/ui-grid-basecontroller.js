/**
 * Mostly based on:
 *
 * http://blog.mgechev.com/2013/12/18/inheritance-services-controllers-in-angularjs/
 */
/*global angular*/
/*global document*/

angular.module('EgaGrid', ['restangular'])
    .directive(
        'egaGrid',
        [
            '$q',
            '$log',
            'growl',
            '$window',
            'Restangular',
            function ($q, $log, growl, $window, R) {
                'use strict';
                return {
                    transclude: true,
                    restrict: 'E',
                    scope: {
                        egaConfig: '=',
                        egaResource: '=?',
                        egaActions: '=?',
                        egaEnums: '=?'
                    },
                    template: '<div ui-grid="thisGrid" ui-grid-loading ui-grid-infinite-scroll ui-grid-resize-columns ui-grid-auto-resize ui-grid-selection class="baseGrid"></div>',
                    controller: function EgaGridDirectiveController($scope, $element, $attrs, $compile) {
                        var CSVLink,
                            errorAttribute,
                            csvSelector,
                            funcIterator,
                            workflowActions = {
                                workflow: {
                                    validate: {
                                        template: '<button class="btn btn-sm" alt="Validate" title="Validate" ng-click="grid.appScope.thisGrid.workflowValidate(row.entity)">' +
                                                '<span class="glyphicon glyphicon-ok text-success"></span>' +
                                            '</button>'
                                    },
                                    submit: {
                                        template: '<button class="btn btn-sm" alt="Submit" title="Submit" ng-click="grid.appScope.thisGrid.workflowSubmit(row.entity)">' +
                                                '<span class="glyphicon glyphicon-saved text-primary"></span>' +
                                            '</button>'
                                    }
                                },
                                edition: {
                                    edit: {
                                        template: '<button class="btn btn-sm" alt="Edit" title="Edit" ng-click="grid.appScope.thisGrid.edit(row.entity)">' +
                                                '<span class="glyphicon glyphicon-pencil"></span>' +
                                            '</button>'
                                    },
                                    remove: {
                                        template: '<button class="btn btn-sm" alt="Remove" title="Remove" ng-click="grid.appScope.thisGrid.rm(row.entity)">' +
                                                '<span class="text-danger glyphicon glyphicon-remove"></span>' +
                                            '</button>'
                                    }
                                }
                            },
                            workflowColumn = {
                                field: "actions",
                                minWidth: 150,
                                width: "12%",
                                type: 'string',
                                displayName: "Actions",
                                cellTemplate: ''
                            };

                        $scope.externalScopes = $scope.externalScopes || '$scope';
                        $scope.egaConfig.queries = $scope.egaConfig.queries ||
                            [
                                {
                                    skip:  0,
                                    limit: 0
                                },
                                {
                                    skip:  0,
                                    limit: 0,
                                    status: 'SUBMITTED'
                                }
                            ];

                        $scope.egaConfig.gridName = $scope.egaConfig.gridName || 'thisGrid';
                        $scope.thisGrid = {

                            data: [],

                            onData: null,

                            total: 0,

                            showFooter: false,

                            enableGridMenu: false,

                            exporterCsvLinkElement: null,

                            exporterCsvFilename: "data.csv",

                            exporterMenuPdf: false,

                            showGridFooter: true,

                            showColumnFooter: false,

                            enableSorting: true,

                            enableFiltering: false,

                            enableRowSelection: $scope.egaConfig.enableRowSelection || false,
                            enableSelectAll: $scope.egaConfig.enableSelectAll || false,
                            multiSelect: $scope.egaConfig.multiSelect || false,
                            isRowSelectable: $scope.egaConfig.isRowSelectable || function (row) {return false;},

                            columnDefs: $scope.egaConfig.columnDefs || [],

                            parentResource: $scope.egaResource || null,

                            childResource: $scope.egaConfig.childResource || null,

                            infiniteScrollPercentage: 15,

                            getMainResource : function getMainResource() {
                                return (this.childResource || (this.parentResource || {route: null}).route || this.localResource).toLowerCase();
                            },

                            isLocal: function isLocal() {
                                return ($scope.thisGrid.localResource ? true : false);
                            },

                            getPage: $scope.egaConfig.getPage || function getPage() {
                                var gridPromisedQueries = [],
                                    thisQuery;

                                if ($scope.thisGrid.parentResource === null) {
                                    /**
                                     * This is a specific case where the grid loads data
                                     * from a client-side source (i.e. samples generator)
                                     *
                                     * @type {Array}
                                     */
                                    $scope.thisGrid.data  = [];
                                    $scope.thisGrid.total = 0;
                                } else {
                                    if ($scope.thisGrid.childResource === null) {
                                        $log.debug(
                                            "parentResource, no childResource",
                                            $scope.thisGrid.parentResource
                                        );

                                        for (thisQuery = 0; thisQuery < $scope.egaConfig.queries.length; thisQuery += 1) {
                                            gridPromisedQueries[thisQuery] =
                                                $scope.thisGrid
                                                    .parentResource
                                                    .getList($scope.egaConfig.queries[thisQuery]);
                                            $log.debug($scope.egaConfig.queries[thisQuery]);
                                        }
                                    } else {
                                        for (thisQuery = 0; thisQuery < $scope.egaConfig.queries.length; thisQuery += 1) {
                                            gridPromisedQueries[thisQuery] =
                                                $scope.thisGrid
                                                    .parentResource
                                                    .children(
                                                        $scope.thisGrid.childResource,
                                                        $scope.egaConfig.queries[thisQuery]
                                                    );
                                            $log.debug($scope.egaConfig.queries[thisQuery]);
                                        }
                                    }
                                }
                                $scope.loading = true;
                                $q
                                    .all(gridPromisedQueries)
                                    .then(
                                        function onResourceList(resourceList) {
                                            var thisResult,
                                                thisItem;
                                            $scope.thisGrid.data  = [];

                                            for (thisResult = 0; thisResult < resourceList.length; thisResult += 1) {
                                                if (angular.isFunction($scope.thisGrid.onData)) {
                                                    resourceList[thisResult] = $scope.thisGrid.onData(resourceList[thisResult]);
                                                }
                                                for (thisItem = 0; thisItem < resourceList[thisResult].length; thisItem += 1) {
                                                    if (angular.isObject(resourceList[thisResult][thisItem])) {
                                                        $scope.thisGrid.data.push(resourceList[thisResult][thisItem]);
                                                    } else {
                                                        break;
                                                    }
                                                }
                                            }
                                            $scope.thisGrid.total = $scope.thisGrid.data.length;

                                            $log.debug(
                                                "UiGridBaseController - data loaded",
                                                $scope.thisGrid.data,
                                                $scope.thisGrid.total
                                            );
                                        },
                                        function onResourceListError(err) {
                                            $scope.thisGrid.data  = [];
                                            $scope.thisGrid.total = 0;
                                        }
                                    ).finally(
                                        function () {
                                            $scope.loading = false;
                                        }
                                    );
                            },

                            onRegisterApi: function onRegisterApi(gridApi) {
                                $scope.thisGrid.gridApi = gridApi;

                                $log.debug(
                                    "enableFiltering",
                                    $scope.thisGrid.enableFiltering
                                );

                                if (angular.isObject($scope.thisGrid.gridApi.edit)) {
                                    $scope.thisGrid.gridApi.edit.on.afterCellEdit(
                                        $scope,
                                        function afterCellEdit(rowEntity, colDef, newValue, oldValue) {

                                            if ($scope.thisGrid.childResource === null) {

                                                $scope.thisGrid.parentResource.one(rowEntity.id);

                                                angular.extend($scope.thisGrid.parentResource, rowEntity);
                                                $scope.thisGrid
                                                    .parentResource
                                                    .put()
                                                    .then(
                                                        function onResourceUpdate() {
                                                            $scope.$emit(
                                                                'resourceChange',
                                                                $scope.thisGrid.parentResource.route + '_update',
                                                                rowEntity.id
                                                            );
                                                        },
                                                        function onResourceUpdateError(err) {
                                                            growl.error(err.header.data.userMessage);
                                                        }
                                                    );
                                            } else {
                                                $scope.thisGrid.parentResource
                                                    .putChildren(
                                                        $scope.thisGrid.childResource.route.toLowerCase(),
                                                        rowEntity.id,
                                                        rowEntity
                                                    )
                                                    .then(
                                                        function onResourceUpdate() {
                                                            $scope.$emit(
                                                                'resourceChange',
                                                                {
                                                                    ev: $scope.thisGrid.parentResource.route + "_" +
                                                                    $scope.thisGrid.childResource.route  + '_update',
                                                                    resource: $scope.thisGrid.getMainResource(),
                                                                    local: $scope.thisGrid.isLocal(),
                                                                    id: rowEntity.id
                                                                }
                                                            );
                                                        }
                                                    );
                                            }
                                            $scope.$apply();
                                        }
                                    );
                                }
                                $scope.thisGrid.getPage();
                            },

                            rm: $scope.egaConfig.rm || function rm(data) {
                                var thisId;
                                $scope.loading = true;
                                if ($scope.thisGrid.parentResource === null) {
                                    for (thisId = 0; thisId < $scope.thisGrid.data.length; thisId += 1) {
                                        $log.debug("uigrid.rm with localResource:", data.counter, "vs", $scope.thisGrid.data[thisId].counter);
                                        if (data.counter === $scope.thisGrid.data[thisId].counter) {
                                            $scope.thisGrid.data.splice(thisId, 1);
                                            $scope.thisGrid.getPage();
                                            break;
                                        }
                                    }
                                    $scope.thisGrid.gridApi.infiniteScroll.dataLoaded();
                                    $scope.loading = false;
                                } else if ($scope.thisGrid.childResource === null) {
                                    $scope.thisGrid
                                        .parentResource
                                        .one(data.id)
                                        .remove()
                                        .then(
                                            function onResourceRemove() {
                                                $scope.$emit(
                                                    'resourceChange',
                                                    {
                                                        ev: $scope.thisGrid.parentResource.route + '_delete',
                                                        local: $scope.thisGrid.isLocal(),
                                                        resource: $scope.thisGrid.getMainResource().toLowerCase(),
                                                        id: data.id
                                                    }
                                                );
                                                $scope.thisGrid.gridApi.infiniteScroll.dataLoaded();
                                                $scope.loading = false;
                                            },
                                            function onResourceRemoveError(err) {
                                                $scope.loading = false;
                                            }
                                        );
                                } else {
                                    $log.debug("Nested resource, Near to remove", data);
                                    $scope.thisGrid
                                        .parentResource
                                        .rmChildren(
                                            $scope.thisGrid.childResource.toLowerCase(),
                                            data.id
                                        ).then(
                                            function onResourceRemove() {
                                                $scope.$emit(
                                                    'resourceChange',
                                                    {
                                                        ev: $scope.thisGrid.parentResource.route + "_" +
                                                            ($scope.thisGrid.childResource || '')  + '_delete',
                                                        local: $scope.thisGrid.isLocal(),
                                                        resource: $scope.thisGrid.getMainResource().toLowerCase(),
                                                        id: data.id
                                                    }
                                                );
                                                $scope.thisGrid.gridApi.infiniteScroll.dataLoaded();
                                                $scope.loading = false;
                                            },
                                            function onResourceRemoveError(err) {
                                                $scope.loading = false;
                                            }
                                        );
                                }
                            },

                            add: $scope.egaConfig.add || function add(row) {
                                $scope.thisGrid.data.push(row);
                                $scope.thisGrid.getPage();
                            },

                            getSelected: function () {
                                return $scope.thisGrid.gridApi.selection.getSelectedRows();
                            },

                            edit: $scope.egaConfig.edit || function edit(row) {
                                $log.debug($scope.egaConfig.gridName, "edit");
                                $log.debug(
                                    $scope.thisGrid.parentResource,
                                    $scope.thisGrid.childResource,
                                    row
                                );

                                $scope.$emit(
                                    'resourceEdit',
                                    {
                                        ev: $scope.thisGrid.getMainResource().toLowerCase() + '_update',
                                        local: $scope.thisGrid.isLocal(),
                                        resource: $scope.thisGrid.getMainResource().toLowerCase(),
                                        id: row.id
                                    }
                                );
                            },

                            workflowValidate: function (data) {
                                errorAttribute = 'validationErrorMessages';
                                return $scope.thisGrid.setWorkflow(data, 'validate');
                            },

                            workflowSubmit: function (data) {
                                errorAttribute = 'submissionErrorMessages';
                                $scope.thisGrid.setWorkflow(data, 'submit');
                            },

                            setWorkflow: function (data, action) {
                                var nError;
                                $scope.loading = true;
                                if ($scope.childResource === null) {
                                    $scope.thisGrid
                                        .parentResource
                                        .one(data.id)
                                        .put({action: action.toUpperCase()})
                                        .then(
                                            function onResourceWorkflowUpdate(result) {
                                                $scope.loading = false;
                                                if (result[0][errorAttribute] !== null && result[0][errorAttribute].length) {
                                                    for (nError = 0; nError < result[0][errorAttribute].length; nError += 1) {
                                                        growl.error(result[0][errorAttribute][nError]);
                                                    }
                                                }
                                                $scope.$emit(
                                                    'resourceChange',
                                                    {
                                                        ev: $scope.thisGrid.parentResource.route + '_edit',
                                                        resource: $scope.thisGrid.getMainResource().toLowerCase(),
                                                        local: $scope.thisGrid.isLocal(),
                                                        id: data.id
                                                    }
                                                );
                                                $scope.thisGrid.gridApi.infiniteScroll.dataLoaded();
                                            },
                                            function onResourceWorkflowUpdateError(err) {
                                                $scope.loading = false;
                                                growl.error(err.header.data.userMessage);
                                            }
                                        );
                                } else {
                                    $scope.thisGrid
                                        .parentResource
                                        .putChildren(
                                            $scope.thisGrid.childResource,
                                            data.id,
                                            data,
                                            {action: action.toUpperCase()}
                                        )
                                        .then(
                                            function onResourceWorkflowUpdate(result) {
                                                $scope.loading = false;
                                                if (result[0][errorAttribute] !== null && result[0][errorAttribute].length) {
                                                    for (nError = 0; nError < result[0][errorAttribute].length; nError += 1) {
                                                        growl.error(result[0][errorAttribute][nError]);
                                                    }
                                                }
                                                $scope.$emit(
                                                    'resourceChange',
                                                    {
                                                        ev: $scope.thisGrid.childResource.route + '_edit',
                                                        resource: $scope.thisGrid.getMainResource().toLowerCase(),
                                                        local: $scope.thisGrid.isLocal(),
                                                        id: data.id
                                                    }
                                                );
                                                $scope.thisGrid.gridApi.infiniteScroll.dataLoaded();
                                            },
                                            function onResourceWorkflowUpdateError(err) {
                                                $scope.loading = false;
                                                growl.error(err.header.data.userMessage);
                                            }
                                        );
                                }
                            }
                        };

                        for (var column in $scope.thisGrid.columnDefs ) {
                            if ($scope.thisGrid.columnDefs.hasOwnProperty(column) && !$scope.thisGrid.columnDefs[column].filter) {
                                $scope.thisGrid.columnDefs[column].filter = {
                                    condition: 16 /* CONTAINS */
                                };
                            }
                        }

                        if (angular.isDefined($scope.egaConfig.headerTemplate)) {
                            $scope.thisGrid.headerTemplate = $scope.egaConfig.headerTemplate;
                            if (angular.isDefined($scope.egaConfig.actions)) {
                                $scope.thisGrid.actions = $scope.egaConfig.actions;
                            }
                        }

                        if (!angular.isFunction($scope.egaConfig.onData)) {
                            $scope.thisGrid.onData = $scope.egaConfig.onData;
                            delete $scope.egaConfig.onData;
                        }

                        if (!angular.isUndefined($scope.egaConfig.validationWorkflow) && $scope.egaConfig.validationWorkflow === true) {

                            if (!angular.isObject($scope.egaConfig.validationActions)) {
                                $scope.egaConfig.validationActions = {
                                    validate: true,
                                    submit: true,
                                    edit: true,
                                    remove: true
                                };
                            }

                            var thisButton,
                                workflowTemplate = '<div class="btn-toolbar" role="toolbar">';

                            workflowTemplate += '<div class="btn-group" role="group">';
                            for (thisButton in workflowActions.workflow) {
                                if (workflowActions.workflow.hasOwnProperty(thisButton) && $scope.egaConfig.validationActions[thisButton] === true) {
                                    workflowTemplate += workflowActions.workflow[thisButton].template;
                                }
                            }
                            workflowTemplate += '</div>';

                            workflowTemplate += '<div class="btn-group" role="group">';
                            for (thisButton in workflowActions.edition) {
                                if (workflowActions.edition.hasOwnProperty(thisButton) && $scope.egaConfig.validationActions[thisButton] === true) {
                                    workflowTemplate += workflowActions.edition[thisButton].template;
                                }
                            }
                            workflowTemplate += '</div>';

                            workflowTemplate += '</div>';

                            workflowColumn.cellTemplate = workflowTemplate;

                            var colPercSum = 0,
                                colPercs = [],
                                col;

                            for (col in $scope.egaConfig.columnDefs) {
                                if ($scope.egaConfig.columnDefs.hasOwnProperty(col)) {
                                    colPercSum += parseFloat($scope.egaConfig.columnDefs[col].width || '0');
                                }
                            }

                            for (col in $scope.egaConfig.columnDefs) {
                                if ($scope.egaConfig.columnDefs.hasOwnProperty(col)) {
                                    $scope.egaConfig.columnDefs[col].width = (parseFloat($scope.egaConfig.columnDefs[col].width) / colPercSum) * 88 + '%';
                                }
                            }

                            $scope.egaConfig.columnDefs.push(workflowColumn);

                        }

                        if (!angular.isObject($scope.egaActions)) {
                            $scope.egaActions = {};
                        }

                        $log.debug("actions", $scope.egaActions);
                        for (funcIterator in $scope.egaActions) {
                            if ($scope.egaActions.hasOwnProperty(funcIterator)) {
                                $log.debug("adding egaAction", funcIterator, $scope.egaActions[funcIterator]);
                                $scope.thisGrid[funcIterator] = $scope.egaActions[funcIterator];
                            }
                        }

                        if (!angular.isUndefined($scope.egaConfig.exportCsv) && $scope.egaConfig.exportCsv === true) {
                            csvSelector = $scope.egaConfig.csvSelector || ".custom-csv-link-location";
                            CSVLink = angular.element(csvSelector);
                            // $log.debug("CSVLink", CSVLink);
                            $scope.thisGrid.exporterCsvLinkElement = (
                                $scope.egaConfig.exportCsv ?
                                        CSVLink :
                                        null
                            );

                            $scope.thisGrid.exporterCsvFilename = (
                                $scope.egaConfig.exportCsv ?
                                        $scope.egaConfig.exporterCsvFilename :
                                        null
                            );
                            delete $scope.egaConfig.exportCsv;
                            delete $scope.egaConfig.exporterCsvFilename;
                        }

                        angular.forEach(
                            $scope.egaConfig,
                            function (item, idx) {
                                // $log.debug("Configuring grid's", idx, "=", item);
                                $scope.thisGrid[idx] = item;
                            }
                        );

                        $scope.getTableStyle = function () {
                            var marginHeight = 60, // optional
                                length = $('img:visible').length; // this is unique to my cellTemplate
                            return {
                                height: (length * $scope.gridOptions.rowHeight + $scope.gridOptions.headerRowHeight + marginHeight) + "px"
                            };
                        };

                        $scope.$watch(
                            'egaActions',
                            function (newActions) {
                                for (var func in newActions) {
                                    if (newActions.hasOwnProperty(func)) {
                                        $log.debug("updating egaAction", func, newActions[func]);
                                        $scope.thisGrid[func] = newActions[func];
                                    }
                                }
                                $scope.thisGrid.getPage();
                            },
                            true
                        );

                        $scope.$on(
                            'uigrid.getSelected',
                            function (ev, params) {
                                $scope.$emit(
                                    'uigrid.getSelectedResponse',
                                    {
                                        resource: $scope.thisGrid.getMainResource().toLowerCase(),
                                        rows: $scope.thisGrid
                                                    .gridApi
                                                    .selection
                                                    .getSelectedRows()
                                    }
                                );
                                $log.debug(
                                    'uigrid getselected',
                                    $scope.thisGrid.getMainResource().toLowerCase()
                                );
                            }
                        );

                        $scope.$on(
                            'uigrid.selectById',
                            function (ev, params) {
                                $log.debug('uigrid.selectById', params);
                                if (params.gridName.indexOf($scope.egaConfig.gridName) === 0 || params.gridName === '*') {
                                    var thisRow, thisSelectedRow;
                                    $log.debug('uigrid.selectById', $scope.thisGrid.data.length, "items to check", $scope.thisGrid.data);
                                    for (thisRow in $scope.thisGrid.data) {
                                        if ($scope.thisGrid.data.hasOwnProperty(thisRow)) {
                                            for (thisSelectedRow = 0; thisSelectedRow < params.ids.length; thisSelectedRow += 1) {
                                                if ($scope.thisGrid.data[thisRow].id.indexOf(params.ids[thisSelectedRow]) === 0) {
                                                    $scope.thisGrid
                                                        .gridApi
                                                        .selection
                                                        .selectRow($scope.thisGrid.data[thisRow]);
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        );

                        $scope.$on(
                            'uigrid.clearSelected',
                            function (ev, params) {
                                $log.debug('uigrid.clearSelected on', $scope.egaConfig.gridName, params);
                                if (params.gridName.indexOf($scope.egaConfig.gridName) === 0 || params === '*') {
                                    $log.debug("Clearing this grid");
                                    $scope.thisGrid
                                        .gridApi
                                        .selection
                                        .clearSelectedRows();
                                }
                            }
                        );

                        $scope.$on(
                            'uigrid.getData',
                            function onGetList(ev, data) {
                                if (
                                    data.indexOf($scope.thisGrid.getMainResource().toLowerCase()) === 0
                                ) {
                                    $scope.$emit(
                                        'uigrid.getDataResponse',
                                        {
                                            resource: 'samples',
                                            rows: $scope.thisGrid.data
                                        }
                                    );
                                }
                            }
                        );

                        $scope.$on(
                            '$destroy',
                            function (ev, data) {
                                if (!angular.isUndefined($scope.egaConfig.validationWorkflow) && $scope.egaConfig.validationWorkflow === true) {
                                    $scope.egaConfig.columnDefs.pop();
                                }
                            }
                        );

                        $scope.$on(
                            'uigrid.rmRow',
                            function onRmRow(ev, data) {
                                if ($scope.thisGrid.getMainResource().toLowerCase().indexOf(data.resource) === 0) {
                                    $scope.thisGrid.rm(data.entity);
                                }
                            }
                        );

                        $scope.$on(
                            'uigrid.addRow',
                            function onAddRow(ev, data) {
                                if ($scope.thisGrid.getMainResource().toLowerCase().indexOf(data.resource) === 0) {
                                    $scope.thisGrid.add(data.entity);
                                }
                            }
                        );

                        $scope.$on(
                            'resourceChange',
                            function onResourceChange(ev, data) {
                                if ($scope.egaConfig.onResourceChange) {
                                    $scope.egaConfig.onResourceChange(ev, data, $scope);
                                } else {
                                    if (
                                        data.resource.indexOf($scope.thisGrid.getMainResource().toLowerCase()) === 0
                                    ) {
                                        $log.debug(
                                            "resourceChange raised for",
                                            data,
                                            "-> Should refresh ui-grid!"
                                        );
                                        $scope.thisGrid.getPage();
                                    }
                                }
                            }
                        );
                        $scope.$scope = $scope;
                    }
                };
            }
        ]
    );
