app3.controller('importUserDegreesCtrl', function ($scope, $rootScope, $state, $stateParams, $location, blockUI, AUTH_EVENTS, AuthService, apiCall, aeMimeTypes, errorMessage, $timeout, $modal, $window, $filter, $http, $compile, $sanitize, $httpParamSerializerJQLike, Upload, $q, readFileData) {

  var programUI = blockUI.instances.get('programUI');
  $scope.initImport = function() {
    programUI.start();
    if($stateParams.dbFields !== null) {
      $scope.contensiveFields = $stateParams.dbFields;
      $scope.updatingFields = true;

      programUI.stop();
    }
    else {
      $scope.getDBFields();
    }
    $scope.csvFields = $stateParams.file;
    if($scope.csvFields) {
      $scope.csvFieldOptions = $scope.csvFields.line_0;
    }
    $scope.csvFilename = $stateParams.filename;
    $scope.matchByFieldSelections = $stateParams.matchByFieldSelections;
    $scope.originalCSV = $stateParams.originalCSV;
    $scope.importNewRecords = true;

    //These are unique to only some imports - not sure if needed
    $scope.updateMatchingRecords  = $stateParams.updateMatchingRecords;
    $scope.fileIsTooLarge = false;
    $scope.fileIsTooLargeErrorMsg = '';
    if($stateParams.fileIsTooLarge) {
      $scope.fileIsTooLarge = true;
      $scope.fileIsTooLargeErrorMsg = 'Your CSV file exceeds the maximum rows (1000) allowed. Please limit the length of your file to no more than 1000 rows and create multiple files if your current file exceeds this limit.';
    }
    $scope.duplicateCSVRows = [];
  };

  $scope.getDBFields = function() {
    apiCall.getData('/appNamegetDegreesContentFields/').then(function(response) {
      if(response.success) {
        programUI.stop();
        $scope.contensiveFields = response.data[0].dataSet.fields;
        $scope.matchByFieldSelections = [];
        angular.forEach($scope.contensiveFields, function(contensiveField) {
          contensiveField.dbName = contensiveField.caption;
          contensiveField.csvData = [];
          contensiveField.dbMapValues = [];
          contensiveField.emptyFields = [];
          contensiveField.csvKey = null;
          contensiveField.mapped = false;
          contensiveField.showField = true; // this is only for Degree Imports
          if(contensiveField.type === 'boolean') {
            contensiveField.dbMap = [true, false];
          }
          if(contensiveField.type === 'lookup') {
            contensiveField.dbMap = contensiveField.values;
            contensiveField.dbMap.push('no match found');
          }

          if(
            (contensiveField.name === 'degreerules.employeeNumber') ||
            (contensiveField.name === 'degreeinstitutions.name') ||
            (contensiveField.name === 'degreeinstitutions.city') ||
            (contensiveField.name === 'degreeinstitutions.state') ||
            (contensiveField.name === 'degreeinstitutions.country') ||
            (contensiveField.name === 'degree.awardlevel') ||
            (contensiveField.name === 'degree.cip') ||
            (contensiveField.name === 'degree.year') ||
            (contensiveField.name === 'degreerules.degreetype')
          )  {
            contensiveField.required = true;
          }
          else {
            contensiveField.required = false;
          }
          // if(contensiveField.name === 'degreerules.employeeNumber') {
          //   //Field is required for import, but missing fields will only throw an exception - but they can still proceed
          //   contensiveField.semiRequired = true;
          // }

        })
      }
      else {
        console.log('error');
      }
    });
  };

  $scope.addCSVField = function(result, field, arrayOfKeys) {
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
        });
        nonEmptyValues.splice(0, 1); //to get rid of first line - title
        field.csvData = nonEmptyValues; //gives only non-empty fields
        field.csvKey = key;
      }
    });
  };

  $scope.clearSelected = function($event, $select, field) {
    field.csvData = [];
    field.emptyFields = [];
    $event.stopPropagation();
    $select.selected = undefined;
  };

  $scope.getFieldValues = function(field, csvResult, arrayOfKeys) {
    // console.log(field);
    // console.log(field.csvData.length);
    // console.log(field.dbMapValues);
    // console.log(field.dbMapValues.length);
    // console.log(csvResult);
    // $scope.csvDataLength = field.csvData.length;
    if(field.csvData.length === field.dbMapValues.length) {
      field.mapped = true;
      // console.log(field.mapped);
    }
    $scope.automappedArray = [];
    $scope.notAllFieldsMapped = false;
    $scope.selectedField = field;
    var params = {
        templateUrl: 'id-mapBoolean.html',
        scope: $scope,
        closeOnClick: true,
        resolve: {},
        closeOnClick: false,
        controller: function($scope, $modalInstance) {
            $scope.cancel = function() {
              // if($stateParams.dbFields === null && !field.mapped) {
              if($stateParams.dbFields === null || !field.mapped) {
                // console.log('called');
                $scope.uniqueFieldValues = [];
                $scope.selectedField.dbMapValues = [];
              }
                $modalInstance.dismiss('cancel');
            };
        }
    };
    $scope.modalInstance = $modal.open(params);
    $scope.dbMapSelect = field.dbMap;

    // if(!$scope.updatingFields) {
      if(field.type === 'boolean' || field.type === 'lookup') {
        $scope.uniqueFieldValues = [];
        $scope.fieldLength = [];
        angular.forEach($scope.csvFields, function(csvField) {
            if($scope.uniqueFieldValues.indexOf(csvField[field.csvKey]) !== -1) {
            }
            else if(csvField[field.csvKey] === '') {
            }
            else {
              $scope.uniqueFieldValues.push(csvField[field.csvKey]);
              $scope.fieldLength.push(csvField[field.csvKey]);

            }
        })
        $scope.uniqueFieldValues.splice(0, 1);
        $scope.fieldLength.splice(0, 1);
        // console.log($scope.fieldLength.length);
        //New was added 1.21.19 to preselect exact matches
        $scope.exactMatches($scope.uniqueFieldValues, field);
        //End New
      }
    // }

  };

  //This was added 1.21.19 to preselect exact matches
  $scope.exactMatches = function(uniqueFieldValues, field) {
    angular.forEach(field.values, function(value) {
      angular.forEach(uniqueFieldValues, function(csvFV, index) {
        if(value === csvFV) {
          var automapped = true;
          $scope.selectedMap(csvFV, value, field, automapped);
          uniqueFieldValues.splice(index, 1);
        }
      })
    })
  }

  $scope.selectedMap = function(csvValue, matchedDBValue, selectedField, automapped) {
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
           //pushes the fields that have an exact match into the dbMapValues array
           selectedField.dbMapValues.push(matchedValue);
           if(automapped) {
             //copies the dbMapValues (at this point are only exact matches) into a separate array
             $scope.automappedArray = angular.copy(selectedField.dbMapValues);
           }
         }
      }
      else {
      }
    }
    else {
      selectedField.dbMapValues.push(matchedValue);
      if(automapped) {
        $scope.automappedArray = angular.copy(selectedField.dbMapValues);
      }
    }
  };

  $scope.matchFields = function(selectedField, uniqueFieldValues, automappedArray) {

    $scope.notAllFieldsMapped = false;
    // if(selectedField.dbMapValues.length < (uniqueFieldValues.length + automappedArray.length)) {
    // console.log(selectedField.dbMapValues.length);
    // console.log($scope.fieldLength.length);
      if(selectedField.dbMapValues.length < $scope.fieldLength.length) {

        $scope.notAllFieldsMapped = true;
      }
      else {
        $scope.notAllFieldsMapped = false;
        selectedField.mapped = true;
        $scope.modalInstance = $scope.modalInstance.close();
      }

  };

  $scope.goToMapPreview = function(contensiveFields) {
    var keepGoing = true;
    angular.forEach(contensiveFields, function(field, index) {
        if(keepGoing) { //To prevent multiple modals from showing if there are multiple missing fields
          if(field.required && (field.csvData.length === 0)) {
            errorMessage.showErrorModal('warning',  [{description: 'Please make sure you match all required fields'}]);
            keepGoing = false;
          }
          else if(field.semiRequired && (field.csvData.length === 0)) {
            errorMessage.showErrorModal('warning',  [{description: 'Please make sure you match all required fields'}]);
            keepGoing = false;
          }
          else if(field.csvData.length > 0 && (field.type === 'lookup' || field.type === 'boolean')) {
            if(field.dbMapValues.length === 0) {
              keepGoing = false;
              errorMessage.showErrorModal('warning',  [{description: 'You have unmapped fields: '+field.caption}]);
            }
          }
        }

    })
    if(keepGoing) {
      $state.go('app.preview-mapped-data', {
        mappedFile: contensiveFields, originalCSV: $scope.originalCSV, duplicateCSVRows: $scope.duplicateCSVRows, importPath: $state.current.name, importName: 'Degrees'
      });
    }
  };

});
