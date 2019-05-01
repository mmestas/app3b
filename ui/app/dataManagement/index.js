app3.controller('dataManagementCtrl', function ($scope, $rootScope, $state, $stateParams, $location, blockUI, AUTH_EVENTS, AuthService, apiCall, aeMimeTypes, errorMessage, $timeout, $modal, $window, $filter, $http, $compile, $sanitize, $httpParamSerializerJQLike, Upload, $q, readFileData) {

  //Step 1
  $scope.init = function() {
    $scope.debug = __env.enableDebug; //Set debug on or off in order to show / hide Courses
  };
  $scope.importCSVModal = function(path) {
    var params = {
        templateUrl: '/app/dataManagement/importCSVModal.html',
        scope: $scope,
        closeOnClick: true,
        resolve: {},
        controller: function($scope, $modalInstance) {
            $scope.importPath = path;
            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
        }
    };
    $scope.modalInstance = $modal.open(params);
  };
  $scope.importInternalReviewProjectsCSVModal = function(path) {
    $scope.selected = {};
    $scope.getTemplates();
    $scope.showTemplateSelect = true;
    var params = {
        templateUrl: '/app/dataManagement/importInternalReviewProjects/importCSVModal.html',
        scope: $scope,
        closeOnClick: true,
        resolve: {},
        controller: function($scope, $modalInstance) {
            $scope.importPath = path;
            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
        }
    };
    $scope.modalInstance = $modal.open(params);
  };
  // Step 1 & Step 2 Modal
  $scope.fileDataObj = {};
  $scope.uploadCSV = function(csvFile, path, selectedTemplate) {
    $scope.showErrorMessage = false;
    if(!selectedTemplate) {
      $scope.selectedTemplate = null;
      if(path === 'app.map-internalReviewProjects-data') {
        $scope.showErrorMessage = true;
        $scope.errorMessage = 'Please select a Template before continuing.';
      }
      else {
        $scope.csvHandler(csvFile, path);
      }
    }
    else {
      $scope.selectedTemplate = {
        id: selectedTemplate.id,
        requestKey: selectedTemplate.requestKey,
        name: selectedTemplate.name
      };
      $scope.csvHandler(csvFile, path);
    }
  };
  $scope.csvHandler = function(csvFile, path) {
    if(!csvFile) {
      $scope.showErrorMessage = true;
      $scope.errorMessage = 'Please select a CSV file before continuing.';
    }
    else {
      var fileName = csvFile.name;
      var r = new FileReader();

      r.onload = function(e) {
          var contents = e.target.result;
          $scope.upload2(contents, fileName, csvFile, path);
      };
      r.readAsText(csvFile);
    }
  };
  $scope.upload2 = function(readFile, CSVfileName, originalCSV, path) {
    if(readFile) {
      $scope.fileDataObj = readFileData.processData(readFile);
      $scope.fileData = JSON.stringify($scope.fileDataObj);
      $scope.fileDataObj = JSON.parse($scope.fileData);
      $scope.modalInstance = $scope.modalInstance.close();
      $scope.fileIsTooLarge = false;
      $scope.fileIsTooLargeErrorMsg = '';
      if($scope.fileDataObj[1] > 1000) {
        $scope.fileIsTooLarge = true;
        $scope.fileIsTooLargeErrorMsg = 'Your CSV file exceeds the maximum rows (1000) allowed. Please limit the length of your file to no more than 1000 rows and create multiple files if your current file exceeds this limit.';
      }
      $state.go(path, {file: $scope.fileDataObj[0], fileIsTooLarge: $scope.fileIsTooLarge, filename: CSVfileName, dbFields: $scope.contensiveFields,
        matchByFieldSelections: $scope.matchByFieldSelections, originalCSV: originalCSV,
        selectedTemplate: $scope.selectedTemplate
      });
    }
  };
  //Get templates
  $scope.getTemplates = function() {
    var postObject = {
        iDisplayStart : 1,
        iDisplayLength : 999999999,
        sSearch: '',
        sSearch_0: 1,
        pcWorkspaceRequestKey: '{00FD29AA-452F-4FA0-9F8C-DB545702CA9D}'
    };
    apiCall.getData('/remotes/getProjectTemplateList/', postObject).then(function(response) {
      $scope.templateList = response.data[0].dataSet;
    })
  };


});
