app3.controller('mapPreviewCtrl', function ($scope, $rootScope, $state, $stateParams, $location, blockUI, AUTH_EVENTS, AuthService, apiCall, aeMimeTypes, errorMessage, $timeout, $modal, $window, $filter, $http, $compile, $sanitize, $httpParamSerializerJQLike, Upload, $q, readFileData) {

  $scope.initpreviewMappedData = function() {
    $scope.contensiveFields = $stateParams.mappedFile;
    console.log($stateParams);
    $scope.originalCSV = $stateParams.originalCSV;
    $scope.importNewRecords = $stateParams.importNewRecords;
    $scope.updateMatchingRecords = $stateParams.updateMatchingRecords;
    $scope.compareRecordsBy = $stateParams.compareBy;
    $scope.duplicateCSVRows = $stateParams.duplicateCSVRows;
    $scope.missingGoal = $stateParams.missingGoal;
    $scope.missingObjective = $stateParams.missingObjective;
    $scope.missingMeasure = $stateParams.missingMeasure;
    $scope.missingTarget = $stateParams.missingTarget;
    $scope.missingFinding = $stateParams.missingFinding;
    $scope.titleAndReportingPeriodArray = $stateParams.titleAndReportingPeriodArray;
    $scope.processGUID = $stateParams.processGUID;
    $scope.importPath = $stateParams.importPath;
    $scope.importName = $stateParams.importName;
    $scope.selectedTemplate = $stateParams.selectedTemplate;

    if($scope.importName === 'Projects') {
        apiCall.getData('/appNameGetSelfImportReviewProjectValidationResult?pcKey='+$scope.processGUID).then(function(response) {
          $scope.duplicatedImportReviewProjects = response.data[0].dataSet;
          $scope.duplicatedRecordSet = response.data[0].recordCount;
      });
    }


    if($scope.missingGoal) {
      $scope.missingGoal.sort();
    }
    if($scope.missingObjective) {
      $scope.missingObjective.sort();
    }
    if($scope.missingMeasure) {
      $scope.missingMeasure.sort();
    }
    if($scope.missingTarget) {
      $scope.missingTarget.sort();
    }
    if($scope.missingFinding) {
      $scope.missingFinding.sort();
    }

    $scope.importToInclude = [];
    $scope.emptyRequiredFields = [];
    $scope.emptyFieldsNotRequired = [];
    $scope.emptyFieldsSemiRequired = [];
    $scope.lengthError = false;
    angular.forEach($scope.contensiveFields, function(row) {
      if(row.csvData.length > 0) {
        $scope.importToInclude.push(row);
      }
      if(($scope.importName === 'Courses') && (row.csvData.length > 1000)) {
        $scope.lengthError = true;
        $scope.lengthErrorMsg = 'Your CSV file exceeds the maximum rows (1000) allowed. Please limit the length of your file to no more than 1000 rows and create multiple files if your current file exceeds this limit';
      }
      if(row.emptyFields.length > 0) {
        if(row.required) {
          $scope.emptyRequiredFields.push(row);
        }
        // added 2.6.19 for degree imports
        else if(row.semiRequired) {
          $scope.emptyFieldsSemiRequired.push(row);
        }
        else {
          $scope.emptyFieldsNotRequired.push(row);
        }


      }
    })
  };

  //Preview Map
  $scope.importDbMap = function() {
    $scope.mappedArray = angular.copy($scope.contensiveFields);
    angular.forEach($scope.mappedArray, function(field, key) {
      delete field.csvData;
      delete field.dbMap;
      delete field.emptyFields;
    })
    var csvDataMap = {};

    var remoteMethod = '';
    if($scope.importPath === 'app.map-imported-data') {
      remoteMethod = '/appNameprocessSelfImportUserUpload/?';
      var csvDataMap = {
        importNewRecords: $scope.importNewRecords,
        updateMatchingRecords: $scope.updateMatchingRecords,
        compareBy: $scope.compareRecordsBy,
        mappedFile: $scope.mappedArray
      };
    }
    else if($scope.importPath === 'app.map-importedCourses-data') {
      remoteMethod = '/appNameprocessSelfImportCoursesUpload/?';
      var csvDataMap = {
        importNewRecords: $scope.importNewRecords,
        updateMatchingRecords: $scope.updateMatchingRecords,
        compareBy: $scope.compareRecordsBy,
        mappedFile: $scope.mappedArray
      };
    }
    else if($scope.importPath === 'app.map-internalReviewProjects-data') {
      remoteMethod = '/appNameprocessSelfImportReviewProjectsUpload/?';
      var csvDataMap = {
        template: $scope.selectedTemplate,
        mappedFile: $scope.mappedArray
      };
    }
    else if($scope.importPath === 'app.map-userDegrees-data') {
      remoteMethod = '/appNameprocessSelfImportDegreesUpload/?';
      var csvDataMap = {
        mappedFile: $scope.mappedArray
      };
    }

    //Need this to send to the server
    var stringifyCsvDataMap = JSON.stringify(csvDataMap);
    var params = {
        callDomain : $location.protocol() + "://" + $location.host(),
        RequestBinary: true
    }

    var programUI = blockUI.instances.get('programUI');
    programUI.start();

    var uploadUrl = __env.apiUrl + __env.baseUrl + remoteMethod + $httpParamSerializerJQLike(params);
    Upload.upload({
        url: uploadUrl,
        data: {
            csvDataMap: stringifyCsvDataMap, //Need to convert to string before sending to database
            selfImportFile: $scope.originalCSV //Binary File
        }
    })

    .then(function (response) {
      programUI.stop();
      var messageForNextScreen
      var calloutClass
      if(response.data.success) {
        calloutClass = 'success';
        messageForNextScreen = '<div>Success! Your Import has started -- the system will email you when it has finished.</div>';
      }
      else {
        calloutClass = 'alert';
        messageForNextScreen = '<div>A server error has occurred.  We are sorry for the inconvenience. An admin has been contacted.</div>';
      }
      $state.go('app.import-complete', {message: messageForNextScreen, calloutClass: calloutClass});
    });
  };

  $scope.importCSVModal = function(path) {
    // console.log($scope.contensiveFields);
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

  $scope.uploadCSV = function(csvFile, path) {
    $scope.showErrorMessage = false;
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
      if($stateParams.mappedFile) {
        $state.go(path, {file: $scope.fileDataObj[0], dbFields: $scope.contensiveFields, originalCSV: originalCSV,
          importNewRecords: $scope.importNewRecords, updateMatchingRecords: $scope.updateMatchingRecords,
          compareBy: $scope.compareRecordsBy, selectedTemplate: $scope.selectedTemplate
        });
      }
      else {
        $state.go(path, {file: $scope.fileDataObj[0], filename: CSVfileName, dbFields: $scope.contensiveFields, matchByFieldSelections: $scope.matchByFieldSelections, originalCSV: originalCSV});
      }
    }
  };





});
