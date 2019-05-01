app3.controller('importUserAcctsCtrl', function ($scope, $rootScope, $state, $stateParams, $location, blockUI, AUTH_EVENTS, AuthService, apiCall, aeMimeTypes, errorMessage, $timeout, $modal, $window, $filter, $http, $compile, $sanitize, $httpParamSerializerJQLike, Upload, $q, readFileData) {
  //Step 1
  $scope.init = function() {}

  //Step 2
  $scope.initImportUserAccounts = function() {
    //added 7.6.18 on reorganization
    $scope.getDBFields();
    $scope.csvFields = $stateParams.file;
    if($scope.csvFields) {
      $scope.csvFieldOptions = $scope.csvFields.line_0;
    }
    $scope.csvFilename = $stateParams.filename;
    $scope.contensiveFields = $stateParams.dbFields;
    $scope.matchByFieldSelections = $stateParams.matchByFieldSelections;
    $scope.originalCSV = $stateParams.originalCSV;
    $scope.importNewRecords = true;
  }
  //Step 3
  $scope.initMapUserAccounts = function() {
    $scope.csvFields = $stateParams.file;
    $scope.csvFilename = $stateParams.filename;
    $scope.contensiveFields = $stateParams.dbFields;
    $scope.originalCSV = $stateParams.originalCSV;
    $scope.importNewRecords  = $stateParams.importNewRecords;
    $scope.updateMatchingRecords  = $stateParams.updateMatchingRecords;
    $scope.compareRecordsBy  = $stateParams.compareBy;
    $scope.allowErrorMsg = true;
    $scope.dontShowErrorMsg = false;
  }
  //Step 4
  $scope.initpreviewMappedData = function() {
    $scope.contensiveFields = $stateParams.mappedFile;
    $scope.originalCSV = $stateParams.originalCSV;
    $scope.importNewRecords  = $stateParams.importNewRecords;
    $scope.updateMatchingRecords  = $stateParams.updateMatchingRecords;
    $scope.compareRecordsBy  = $stateParams.compareBy;
    $scope.importToInclude = [];
    $scope.emptyRequiredFields = [];
    $scope.emptyFieldsNotRequired = [];
    angular.forEach($scope.contensiveFields, function(row) {
      if(row.csvData.length > 0) {
        $scope.importToInclude.push(row);
      }
      if(row.emptyFields.length > 0) {
        if(row.required) {
          $scope.emptyRequiredFields.push(row);
        }
        else {
          $scope.emptyFieldsNotRequired.push(row);
        }
      }
    })
  }

  //Step 5 - just for testing purposes
  $scope.importComplete = function() {
    $scope.importMessage = $stateParams.message;
    $scope.calloutClass = $stateParams.calloutClass;
    // $scope.calloutClass = 'secondary';
  }

  // Step 1 & Step 2 Modal
  $scope.importCSVModal = function() {
    var params = {
        templateUrl: '/app/dataManagement/importCSVModal.html',
        scope: $scope,
        closeOnClick: true,
        resolve: {},
        controller: function($scope, $modalInstance) {
            $scope.importPath = 'app.data-import-userAccounts';
            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
        }
    };
    $scope.modalInstance = $modal.open(params);

    if($scope.contensiveFields) {
    }
    else {
      $scope.getDBFields();
    }
  }
  // Step 1 & Step 2 Modal
  $scope.fileDataObj = {};
  // $scope.uploadUserAccountsCSVFile = function(csvFile) {
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
          $scope.upload2(contents, fileName, csvFile);
      };
      r.readAsText(csvFile);
    }

  }
  $scope.upload2 = function(readFile, CSVfileName, originalCSV) {
    if(readFile) {
      $scope.fileDataObj = readFileData.processData(readFile);
      $scope.fileData = JSON.stringify($scope.fileDataObj);
      $scope.fileDataObj = JSON.parse($scope.fileData);
      $scope.modalInstance = $scope.modalInstance.close();
      if($stateParams.mappedFile) {
        //Need to have old values update with new matched values
        // $state.go('app.map-imported-data', {file: $scope.fileDataObj, dbFields: $scope.contensiveFields, originalCSV: $scope.originalCSV, importNewRecords: $scope.importNewRecords, updateMatchingRecords: $scope.updateMatchingRecords, compareBy: $scope.compareRecordsBy});
        $state.go('app.map-imported-data', {file: $scope.fileDataObj, dbFields: $scope.contensiveFields, originalCSV: originalCSV, importNewRecords: $scope.importNewRecords, updateMatchingRecords: $scope.updateMatchingRecords, compareBy: $scope.compareRecordsBy});
      }
      else {
        $state.go('app.data-import-userAccounts', {file: $scope.fileDataObj, filename: CSVfileName, dbFields: $scope.contensiveFields, matchByFieldSelections: $scope.matchByFieldSelections, originalCSV: originalCSV});
      }
    }
  }
  //Step 2
  $scope.getDBFields = function() {
    apiCall.getData('/appNamegetUserContentFields/').then(function(response) {
      if(response.success) {
        $scope.contensiveFields = response.data[0].dataSet.fields;
        $scope.matchByFieldSelections = [];
        angular.forEach($scope.contensiveFields, function(contensiveField) {
          contensiveField.dbName = contensiveField.caption;
          // contensiveField.csvField = 'unmapped';
          contensiveField.csvData = [];
          contensiveField.dbMapValues = [];
          contensiveField.emptyFields = [];
          contensiveField.csvKey = null;
          contensiveField.mapped = false;
          if(contensiveField.type === 'boolean') {
            contensiveField.dbMap = [true, false];
          }
          if(contensiveField.type === 'lookup') {
            contensiveField.dbMap = contensiveField.values;
            contensiveField.dbMap.push('no match found');
          }
          //For required fields
          // || contensiveField.name === 'people.employeeNumber'
          if((contensiveField.name === 'people.firstName') || contensiveField.name === 'people.lastName' || contensiveField.name === 'people.email') {
            contensiveField.required = true;
          }
          else {
            contensiveField.required = false;
          }
          //For contensive match fields
          // || (contensiveField.name === 'people.id') || (contensiveField.name === 'people.username') taken out at the request of Amy
          if((contensiveField.name === 'people.email') || (contensiveField.name === 'people.employeeNumber')) {
            $scope.matchByFieldSelections.push(contensiveField);
          }
          //contensive ID should only show up in Matching and NOT show up in the mapping
          if((contensiveField.name === 'people.id') || (contensiveField.name === 'people.username')  || (contensiveField.name === 'people.remoteauthenticationtoken') || (contensiveField.name === 'people.phone') ){
            contensiveField.showField = false;
          }
          else {
            contensiveField.showField = true;
          }
        })
      }
      else {
        console.log('error');
      }
    });
  }

  $scope.goToMapping = function(importNewRecords, updateMatchingRecords, matchContensiveFieldBy, matchCSVFieldBy) {
    var compareByIndex = $scope.csvFieldOptions.indexOf(matchCSVFieldBy);
      $scope.needToMakeASelection = false;
    if(!importNewRecords && !updateMatchingRecords) {
      $scope.needToMakeASelection = true;
      errorMessage.showErrorModal('Error <i class="ion-android-warning"></i>',  [{description: 'At least one checkbox needs to be selected'}]);
    }
    else {
      var updateRecords = false; //originally didn't define as true or false
      var importRecords = false; //originally didn't define as true or false
      if(importNewRecords || updateMatchingRecords) {
        if(importNewRecords) {importRecords = true;}
        if(updateMatchingRecords) {updateRecords = true;}
        $scope.compareRecordsBy = {
          dbField: matchContensiveFieldBy.name,
          csvField: matchCSVFieldBy,
          compareBy: compareByIndex
        }
      }
      else {
        importRecords = false;
        updateRecords = false;
        $scope.compareRecordsBy = {
          dbField: null,
          csvField: null,
          compareBy: null
        };
      }
      $state.go('app.map-imported-data', {file: $scope.csvFields, dbFields: $scope.contensiveFields, originalCSV: $scope.originalCSV, importNewRecords: importNewRecords, updateMatchingRecords: updateMatchingRecords, compareBy: $scope.compareRecordsBy});
    }
  }

  //Step3
  $scope.addCSVField = function(result, field, arrayOfKeys, allowError) {
    field.mapped = false;
    field.csvField = result;
    var resultIndex = arrayOfKeys.indexOf(result);
    angular.forEach(arrayOfKeys, function(indexedObject, key) {
      if(resultIndex == key) {
        var nonEmptyValues = [];
        field.emptyFields = [];
        angular.forEach($scope.csvFields, function(csvField, csvFieldKey) {
            var tableLineValue = csvFieldKey.replace(/\w\D+/g, '');
            tableLineValue = parseInt(tableLineValue, 10);
            tableLineValue = tableLineValue+1;

            if(csvField[key] === '') {
              field.emptyFields.push(' '+tableLineValue);
            }
            else {
              nonEmptyValues.push(csvField[key]);
            }
        })
        nonEmptyValues.splice(0, 1); //to get rid of first line - title
        field.csvData = nonEmptyValues; //gives only non-empty fields
        if(field.csvData.length < 3) {
          if(field.csvData.length == 0) {
            field.csvData[0] = 'empty';
            field.csvData[1] = 'empty';
            field.csvData[2] = 'empty';
          }
          else if(field.csvData.length == 1) {
            field.csvData[1] = 'empty';
            field.csvData[2] = 'empty';
          }
          else if(field.csvData.length == 2) {
            field.csvData[2] = 'empty';
          }
        }

        field.csvKey = key;

        // NOTE: this is the pop-up that shows error message about empty fields
        // if(field.emptyFields.length) {
        //   if(field.required && allowError) {
        //     errorMessage.showErrorModal('Warning <i class="ion-android-warning"></i>',  [{description: 'Required fields cannot have empty fields. You have empty fields for the data in column, '+field.csvField+' in lines '+field.emptyFields}]);
        //   }
        // }
      }
    })
  }

  $scope.clearSelected = function($event, $select, field) {
    field.csvData = [];
    field.emptyFields = [];
    $event.stopPropagation();
    $select.selected = undefined;
  }

  $scope.getFieldValues = function(field, csvResult, arrayOfKeys) {
    $scope.notAllFieldsMapped = false;
    $scope.selectedField = field;
    var params = {
        templateUrl: 'id-mapBoolean.html',
        scope: $scope,
        closeOnClick: true,
        resolve: {},
        controller: function($scope, $modalInstance) {
            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
        }
    };
    $scope.modalInstance = $modal.open(params);
    $scope.dbMapSelect = field.dbMap;

    if(field.type === 'boolean' || field.type === 'lookup') {
      $scope.uniqueFieldValues = [];
      angular.forEach($scope.csvFields, function(csvField) {
        if($scope.csvFields['line_0'] === csvField) {

        }
        else {
          if($scope.uniqueFieldValues.indexOf(csvField[field.csvKey]) !== -1) {
          }
          else if(csvField[field.csvKey] === '') {
          }
          else {
            $scope.uniqueFieldValues.push(csvField[field.csvKey]);
          }
        }
      })

    }
  }

  $scope.selectedMap = function(csvValue, matchedDBValue, selectedField) {
    var matchedValue = {dbFieldValue : matchedDBValue, csvFieldValue : csvValue};
    $scope.keepGoing = true;
    if(selectedField.dbMapValues.length > 0) {
      angular.forEach(selectedField.dbMapValues, function(fieldValue, fieldKey) {
          if(fieldValue.csvFieldValue === matchedValue.csvFieldValue) {
            selectedField.dbMapValues.splice(fieldKey, 1, matchedValue);
            $scope.keepGoing = false;
          }
      });
      if($scope.keepGoing) {
        if(selectedField.dbMapValues.indexOf(matchedValue) !== -1) {
           $scope.keepGoing = false;
         }
         else {
           selectedField.dbMapValues.push(matchedValue);
         }
      }
      else {
      }
    }
    else {
      selectedField.dbMapValues.push(matchedValue);
    }
  }
  $scope.matchFields = function(selectedField, uniqueFieldValues) {
    $scope.notAllFieldsMapped = false;
    if(selectedField.dbMapValues.length < uniqueFieldValues.length) {
      $scope.notAllFieldsMapped = true;
    }
    else {
      $scope.notAllFieldsMapped = false;
      selectedField.mapped = true;
      $scope.modalInstance = $scope.modalInstance.close();
    }
  }

  //Step 3 --> 4
  $scope.goToMapPreview = function(contensiveFields) {
    var keepGoing = true;
    angular.forEach(contensiveFields, function(field) {
      if(keepGoing) {
        if(field.required && (field.csvData.length == 0)) {
          errorMessage.showErrorModal('Warning',  [{description: 'Please make sure you match all required fields'}]);
          keepGoing = false;
        }
        else if(field.required && (field.type === 'lookup' || field.type === 'boolean')) {
          if(field.dbMapValues.length == 0) {
            keepGoing = false;
            errorMessage.showErrorModal('Warning',  [{description: 'You have unmapped fields: '+field.caption}]);
          }
        }
        else if(field.csvData.length > 0 && (field.type === 'lookup' || field.type === 'boolean')) {
          if(field.dbMapValues.length == 0) {
            keepGoing = false;
            errorMessage.showErrorModal('Warning',  [{description: 'You have unmapped fields: '+field.caption}]);
          }
        }
      }
    })
    if(keepGoing) {
      $state.go('app.preview-mapped-data', {
        mappedFile: contensiveFields, originalCSV: $scope.originalCSV, importNewRecords: $scope.importNewRecords,
        updateMatchingRecords: $scope.updateMatchingRecords, compareBy: $scope.compareRecordsBy, importPath: $state.current.name, importName: 'Users'
      });
    }
  }

  //Step 4
  $scope.saveDbMap = function() {
    //Note: $scope.mappedFile is the same as $scope.contensiveFields  this got changed along the way with the route param
    // $scope.importCSVModal(path); //somewhere, the path got changed along the way
    $scope.importCSVModal();
  }
  $scope.importDbMap = function() {
    $scope.mappedArray = angular.copy($scope.contensiveFields);
    angular.forEach($scope.mappedArray, function(field, key) {
      delete field.csvData;
      delete field.dbMap;
      delete field.emptyFields;
    })
    var csvDataMap = {
      importNewRecords: $scope.importNewRecords,
      updateMatchingRecords: $scope.updateMatchingRecords,
      compareBy: $scope.compareRecordsBy,
      mappedFile: $scope.mappedArray
    };

    //Need this to send to the server
    var stringifyCsvDataMap = JSON.stringify(csvDataMap);
    var params = {
        callDomain : $location.protocol() + "://" + $location.host(),
        RequestBinary: true
    }
    // var uploadUrl = __env.apiUrl + __env.baseUrl + '/?remoteCall=appNameprocessSelfImportUserUpload&' + $httpParamSerializerJQLike(params);
    var uploadUrl = __env.apiUrl + __env.baseUrl + '/appNameprocessSelfImportUserUpload/?' + $httpParamSerializerJQLike(params);
    blockUI.start("Import in progress...");
    Upload.upload({
        url: uploadUrl,
        data: {
            csvDataMap: stringifyCsvDataMap, //Need to convert to string before sending to database
            selfImportFile: $scope.originalCSV //Binary File
        }
    })

    .then(function (response) {
       blockUI.stop();
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

  }


  //////////////// EDIT MAPPING //////////////////

  $scope.whatDoYouWantToDo = 'Some explanation should go here';
  $scope.matchContensiveFieldExplanation = 'These are fields in the database. Select the field you want to use to identify the user.';
  $scope.matchCVSFieldExplanation = 'These are fields in your CVS file.  Match the corresponding field in your CSV file to the one you selected from the database.';

});
