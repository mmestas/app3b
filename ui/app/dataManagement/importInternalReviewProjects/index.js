app3.controller('importInternalReviewProjectsCtrl', function ($scope, $rootScope, $state, $stateParams, $location, blockUI, AUTH_EVENTS, AuthService, apiCall, aeMimeTypes, errorMessage, $timeout, $modal, $window, $filter, $http, $compile, $sanitize, $httpParamSerializerJQLike, Upload, $q, readFileData) {
  $scope.initImportInternalReviewProjects = function() {
    // var programUI = blockUI.instances.get('programUI');
    // programUI.start();
    if($stateParams.dbFields !== null) {
      $scope.contensiveFields = $stateParams.dbFields;
    }
    else {
      $scope.getDBFields();
    }
    $scope.csvFields = $stateParams.file;
    $scope.csvFilename = $stateParams.filename;
    $scope.matchByFieldSelections = $stateParams.matchByFieldSelections;
    $scope.originalCSV = $stateParams.originalCSV;
     //used when there were two pages...
    $scope.updateMatchingRecords  = $stateParams.updateMatchingRecords;
    $scope.compareRecordsBy  = $stateParams.compareBy;
    $scope.selectedTemplate = $stateParams.selectedTemplate;
    $scope.allowErrorMsg = true;
    $scope.dontShowErrorMsg = false;
    $scope.duplicateCSVRows = [];

    console.log($stateParams);
    $scope.titleAndReportingPeriodArray = [];
    // programUI.stop();
    // console.log('stopped');
  };


  $scope.getDBFields = function() {
    var programUI = blockUI.instances.get('programUI');
    programUI.start();
    apiCall.getData('/appNamegetReviewProjectsContentFields/').then(function(response) {
      if(response.success) { //Use in real remote
        $scope.contensiveFields = response.data[0].dataSet.fields;
        angular.forEach($scope.contensiveFields, function(contensiveField) {
          contensiveField.dbName = contensiveField.caption;
          contensiveField.csvData = [];
          contensiveField.dbMapValues = [];
          contensiveField.emptyFields = [];
          contensiveField.csvKey = null;
          contensiveField.mapped = false;
          //for secondary matching fields
          if(contensiveField.type === 'boolean') {
            contensiveField.dbMap = [true, false];
          }
          if(contensiveField.type === 'lookup') {
            contensiveField.dbMap = contensiveField.values;
            contensiveField.dbMap.push('no match found');
          }
          if(
             contensiveField.name === 'project.title' || contensiveField.name === 'project.reportingPeriod'
          ) {
            contensiveField.required = true;
          }
          else {
            contensiveField.required = false;
          }
          contensiveField.showField = true; //This is required because it is necessary on the other imports (although it is not used for this import, it will affect the way the import summary is displayed)
        })
        $scope.contensiveFields[3].dependencyNeeded = true;
        $scope.contensiveFields[3].dependencyMessage = 'Goals are required prior to selection';
        $scope.contensiveFields[4].dependencyNeeded = true;
        $scope.contensiveFields[4].dependencyMessage = 'Goals are required prior to selection';
        $scope.contensiveFields[5].dependencyNeeded = true;
        $scope.contensiveFields[5].dependencyMessage = 'Objectives are required prior to selection';
        $scope.contensiveFields[6].dependencyNeeded = true;
        $scope.contensiveFields[6].dependencyMessage = 'Goals & Objectives are required prior to selection';
        $scope.contensiveFields[7].dependencyNeeded = true;
        $scope.contensiveFields[7].dependencyMessage = 'Measures are required prior to selection';
        $scope.contensiveFields[8].dependencyNeeded = true;
        $scope.contensiveFields[8].dependencyMessage = 'Goals, Objectives, & Measures are required prior to selection';
        $scope.contensiveFields[9].dependencyNeeded = true;
        $scope.contensiveFields[9].dependencyMessage = 'Targets are required prior to selection';
        $scope.contensiveFields[10].dependencyNeeded = true;
        $scope.contensiveFields[10].dependencyMessage = 'Targets are required prior to selection';
        $scope.contensiveFields[11].dependencyNeeded = true;
        $scope.contensiveFields[11].dependencyMessage = 'Targets are required prior to selection';
        $scope.contensiveFields[12].dependencyNeeded = true;
        $scope.contensiveFields[12].dependencyMessage = 'Targets are required prior to selection';
      }
      else {
        console.log('error');
      }
      programUI.stop();
      console.log('stopped');
    });
  };

  $scope.fileDataObj = {};
  //do we need this here?
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
      //Note, not sure why I did an if else statement here... perhaps just the if can stay
      if($stateParams.mappedFile) {
        $state.go('app.map-internalReviewProject', {
          file: $scope.fileDataObj, dbFields: $scope.contensiveFields, originalCSV: originalCSV,
          importNewRecords: $scope.importNewRecords, updateMatchingRecords: $scope.updateMatchingRecords,
          compareBy: $scope.compareRecordsBy, selectedTemplate: $scope.selectedTemplate
        });
      }
      else {
        $state.go(path, {file: $scope.fileDataObj, filename: CSVfileName, dbFields: $scope.contensiveFields, matchByFieldSelections: $scope.matchByFieldSelections, originalCSV: originalCSV});
      }
    }
  };
  //end do we need this here... in this controller

  $scope.addCSVField = function(result, field, arrayOfKeys) {
    field.mapped = false;
    field.csvField = result;
    var resultIndex = arrayOfKeys.indexOf(result);
    angular.forEach(arrayOfKeys, function(indexedObject, key) {
      if(resultIndex == key) {
        var nonEmptyValues = [];
        var allValues = [];
        field.emptyFields = [];
        angular.forEach($scope.csvFields, function(csvField, csvFieldKey) {
          var tableLineValue = csvFieldKey.replace(/\w\D+/g, '');
          actualtableLineValue = parseInt(tableLineValue, 10);
          tableLineValue = actualtableLineValue+1;
            if(csvField[key] === '') {
              field.emptyFields.push(' '+tableLineValue);
            }
            else {
              nonEmptyValues.push(csvField[key]);
            }
            allValues.push(csvField[key]);

            console.log(csvFieldKey, actualtableLineValue);
            // var currentFieldKey =

            if(field.name === 'project.title') {
              if($scope.titleAndReportingPeriodArray.length < allValues.length) {
                $scope.titleAndReportingPeriodArray.push({'projectName': csvField[key]});
              }
              else {
                $scope.titleAndReportingPeriodArray[actualtableLineValue].projectName = csvField[key];
              }
            }
            if(field.name === 'project.reportingPeriod') {
              if($scope.titleAndReportingPeriodArray.length < allValues.length) {
                $scope.titleAndReportingPeriodArray.push({'reportingPeriod': csvField[key]});
              }
              else {
                $scope.titleAndReportingPeriodArray[actualtableLineValue].reportingPeriod = csvField[key];
              }
            }
            console.log($scope.titleAndReportingPeriodArray);
        });
        nonEmptyValues.splice(0, 1); //to get rid of first line - title
        allValues.splice(0, 1); //to get rid of first line - title
        field.csvData = nonEmptyValues; //gives only non-empty fields
        field.allValues = allValues; //gives only non-empty fields
        field.csvKey = key;
      }
    });


    if((field.name === 'projectGoals.title') && field.csvField) {
      $scope.contensiveFields[3].dependencyNeeded = false;
      $scope.contensiveFields[4].dependencyNeeded = false;
    }

    // NOTE: Dependent on Goal
    if(((field.name === 'projectGoals.title') || (field.name === 'projectObjectives.title')) && field.csvField) {
      field.dependentField = true;
      if(!$scope.missingGoal) {
        $scope.missingGoal = [];
      }
      if(field.name === 'projectObjectives.title') {
        $scope.contensiveFields[5].dependencyNeeded = false;
        $scope.contensiveFields[6].dependencyNeeded = false;
      }
      angular.forEach($scope.contensiveFields[2].allValues, function(goal, key) {
        angular.forEach(field.allValues, function(objective, key2) {
          if((key === key2) && (objective.length > 0)) {
            if(goal.length < 1) {
              if($scope.missingGoal.indexOf(key) === -1) {
                $scope.missingGoal.push(key);
              }
            }
          }
        })
      })
      console.log($scope.missingGoal);
    }
    // Dependent on Description
    if(((field.name === 'projectObjectives.description') || (field.name === 'projectMeasure.measure')) && field.csvField) {
      field.dependentField = true;
      if(!$scope.missingObjective) {
        $scope.missingObjective = [];
      }
      if(field.name === 'projectMeasure.measure') {
        $scope.contensiveFields[7].dependencyNeeded = false;
        $scope.contensiveFields[8].dependencyNeeded = false;
      }
      angular.forEach($scope.contensiveFields[4].allValues, function(objective, key) {
        angular.forEach(field.allValues, function(measure, key2) {
          if((key === key2) && (measure.length > 0)) {
            if(objective.length < 1) {
              if($scope.missingObjective.indexOf(key) === -1) {
                $scope.missingObjective.push(key);
              }
            }
          }
        })
      })
    }
    // Dependent on Measure
    if(((field.name === 'projectMeasure.description') || (field.name === 'projectMeasureTarget.targets')) && field.csvField) {
      field.dependentField = true;
      if(!$scope.missingMeasure) {
        $scope.missingMeasure = [];
      }
      if(field.name === 'projectMeasureTarget.targets') {
        $scope.contensiveFields[9].dependencyNeeded = false;
        $scope.contensiveFields[10].dependencyNeeded = false;
        $scope.contensiveFields[11].dependencyNeeded = false;
        $scope.contensiveFields[12].dependencyNeeded = false;
      }
      angular.forEach($scope.contensiveFields[6].allValues, function(measure, key) {
        angular.forEach(field.allValues, function(target, key2) {
          if((key === key2) && (target.length > 0)) {
            if(measure.length < 1) {
              console.log(key, key2);
              if($scope.missingMeasure.indexOf(key) === -1) {
                $scope.missingMeasure.push(key);
              }
            }
          }
        })
      })
    }
    // Dependent on Targets
    if(((field.name === 'projectMeasureTarget.description') || (field.name === 'projectMeasureTarget.achivementStatus') || (field.name === 'projectMeasureTarget.finding') || (field.name === 'projectMeasureTarget.analysisOfFinding')) && field.csvField) {
      console.log('called');
      if(field.name === 'projectMeasureTarget.finding') {
        $scope.contensiveFields[12].dependencyNeeded = false;
      }
      field.dependentField = true;
      if(!$scope.missingTarget) {
        $scope.missingTarget = [];
      }
      console.log($scope.missingTarget);
      angular.forEach($scope.contensiveFields[8].allValues, function(measure, key) {
        angular.forEach(field.allValues, function(target, key2) {
          if((key === key2) && (target.length > 0)) {
            if(measure.length < 1) {
              console.log(key, key2);
              console.log($scope.missingTarget.indexOf(key), 'key');
              if($scope.missingTarget.indexOf(key) === -1) {
                $scope.missingTarget.push(key)
              }

            }
          }
        })
      })
    }
    // Dependent on Finding
    // if((field.name === 'projectMeasureTarget.analysisOfFinding') && field.csvField) {
    //   field.dependentField = true;
    //   $scope.missingFinding = [];
    //   angular.forEach($scope.contensiveFields[11].allValues, function(objective, key) {
    //     angular.forEach(field.allValues, function(measure, key2) {
    //       if((key === key2) && (measure.length > 0)) {
    //         if(objective.length < 1) {
    //           console.log(key, key2);
    //           $scope.missingFinding.push(key)
    //         }
    //       }
    //     })
    //   })
    // }

  };

  $scope.clearSelected = function($event, $select, field) {
    console.log($event);
    console.log($select);
    console.log(field);
    field.csvData = [];
    field.emptyFields = [];
    $event.stopPropagation();
    $select.selected = undefined;
    if(field.name === 'projectGoals.title') {
      $scope.contensiveFields[3].dependencyNeeded = true;
      $scope.contensiveFields[3].csvData = [];
      $scope.contensiveFields[3].emptyFields = [];
      $scope.contensiveFields[3].csvField = undefined;

      $scope.contensiveFields[4].dependencyNeeded = true;
      $scope.contensiveFields[4].csvData = [];
      $scope.contensiveFields[4].emptyFields = [];
      $scope.contensiveFields[4].csvField = undefined;

      $scope.contensiveFields[5].dependencyNeeded = true;
      $scope.contensiveFields[5].csvData = [];
      $scope.contensiveFields[5].emptyFields = [];
      $scope.contensiveFields[5].csvField = undefined;

      $scope.contensiveFields[6].dependencyNeeded = true;
      $scope.contensiveFields[6].csvData = [];
      $scope.contensiveFields[6].emptyFields = [];
      $scope.contensiveFields[6].csvField = undefined;

      $scope.contensiveFields[7].dependencyNeeded = true;
      $scope.contensiveFields[7].csvData = [];
      $scope.contensiveFields[7].emptyFields = [];
      $scope.contensiveFields[7].csvField = undefined;

      $scope.contensiveFields[8].dependencyNeeded = true;
      $scope.contensiveFields[8].csvData = [];
      $scope.contensiveFields[8].emptyFields = [];
      $scope.contensiveFields[8].csvField = undefined;

      $scope.contensiveFields[9].dependencyNeeded = true;
      $scope.contensiveFields[9].csvData = [];
      $scope.contensiveFields[9].emptyFields = [];
      $scope.contensiveFields[9].csvField = undefined;

      $scope.contensiveFields[10].dependencyNeeded = true;
      $scope.contensiveFields[10].csvData = [];
      $scope.contensiveFields[10].emptyFields = [];
      $scope.contensiveFields[10].csvField = undefined;

      $scope.contensiveFields[11].dependencyNeeded = true;
      $scope.contensiveFields[11].csvData = [];
      $scope.contensiveFields[11].emptyFields = [];
      $scope.contensiveFields[11].csvField = undefined;

      $scope.contensiveFields[12].dependencyNeeded = true;
      $scope.contensiveFields[12].csvData = [];
      $scope.contensiveFields[12].emptyFields = [];
      $scope.contensiveFields[12].csvField = undefined;
    }
    if(field.name === 'projectObjectives.title') {
      $scope.contensiveFields[5].dependencyNeeded = true;
      $scope.contensiveFields[5].csvData = [];
      $scope.contensiveFields[5].emptyFields = [];
      $scope.contensiveFields[5].csvField = undefined;

      $scope.contensiveFields[6].dependencyNeeded = true;
      $scope.contensiveFields[6].csvData = [];
      $scope.contensiveFields[6].emptyFields = [];
      $scope.contensiveFields[6].csvField = undefined;

      $scope.contensiveFields[7].dependencyNeeded = true;
      $scope.contensiveFields[7].csvData = [];
      $scope.contensiveFields[7].emptyFields = [];
      $scope.contensiveFields[7].csvField = undefined;

      $scope.contensiveFields[8].dependencyNeeded = true;
      $scope.contensiveFields[8].csvData = [];
      $scope.contensiveFields[8].emptyFields = [];
      $scope.contensiveFields[8].csvField = undefined;

      $scope.contensiveFields[9].dependencyNeeded = true;
      $scope.contensiveFields[9].csvData = [];
      $scope.contensiveFields[9].emptyFields = [];
      $scope.contensiveFields[9].csvField = undefined;

      $scope.contensiveFields[10].dependencyNeeded = true;
      $scope.contensiveFields[10].csvData = [];
      $scope.contensiveFields[10].emptyFields = [];
      $scope.contensiveFields[10].csvField = undefined;

      $scope.contensiveFields[11].dependencyNeeded = true;
      $scope.contensiveFields[11].csvData = [];
      $scope.contensiveFields[11].emptyFields = [];
      $scope.contensiveFields[11].csvField = undefined;

      $scope.contensiveFields[12].dependencyNeeded = true;
      $scope.contensiveFields[12].csvData = [];
      $scope.contensiveFields[12].emptyFields = [];
      $scope.contensiveFields[12].csvField = undefined;
    }
    if(field.name === 'projectMeasure.measure') {

      $scope.contensiveFields[7].dependencyNeeded = true;
      $scope.contensiveFields[7].csvData = [];
      $scope.contensiveFields[7].emptyFields = [];
      $scope.contensiveFields[7].csvField = undefined;

      $scope.contensiveFields[8].dependencyNeeded = true;
      $scope.contensiveFields[8].csvData = [];
      $scope.contensiveFields[8].emptyFields = [];
      $scope.contensiveFields[8].csvField = undefined;

      $scope.contensiveFields[9].dependencyNeeded = true;
      $scope.contensiveFields[9].csvData = [];
      $scope.contensiveFields[9].emptyFields = [];
      $scope.contensiveFields[9].csvField = undefined;

      $scope.contensiveFields[10].dependencyNeeded = true;
      $scope.contensiveFields[10].csvData = [];
      $scope.contensiveFields[10].emptyFields = [];
      $scope.contensiveFields[10].csvField = undefined;

      $scope.contensiveFields[11].dependencyNeeded = true;
      $scope.contensiveFields[11].csvData = [];
      $scope.contensiveFields[11].emptyFields = [];
      $scope.contensiveFields[11].csvField = undefined;

      $scope.contensiveFields[12].dependencyNeeded = true;
      $scope.contensiveFields[12].csvData = [];
      $scope.contensiveFields[12].emptyFields = [];
      $scope.contensiveFields[12].csvField = undefined;
    }
    if(field.name === 'projectMeasureTarget.targets') {

      $scope.contensiveFields[9].dependencyNeeded = true;
      $scope.contensiveFields[9].csvData = [];
      $scope.contensiveFields[9].emptyFields = [];
      $scope.contensiveFields[9].csvField = undefined;

      $scope.contensiveFields[10].dependencyNeeded = true;
      $scope.contensiveFields[10].csvData = [];
      $scope.contensiveFields[10].emptyFields = [];
      $scope.contensiveFields[10].csvField = undefined;

      $scope.contensiveFields[11].dependencyNeeded = true;
      $scope.contensiveFields[11].csvData = [];
      $scope.contensiveFields[11].emptyFields = [];
      $scope.contensiveFields[11].csvField = undefined;

      $scope.contensiveFields[12].dependencyNeeded = true;
      $scope.contensiveFields[12].csvData = [];
      $scope.contensiveFields[12].emptyFields = [];
      $scope.contensiveFields[12].csvField = undefined;
    }
  };
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
          if($scope.uniqueFieldValues.indexOf(csvField[field.csvKey]) !== -1) {
          }
          else if(csvField[field.csvKey] === '') {
          }
          else {
            $scope.uniqueFieldValues.push(csvField[field.csvKey]);
          }
      })
      $scope.uniqueFieldValues.splice(0, 1);
    }
  };
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
  };
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
  };

  $scope.goToMapPreview = function(contensiveFields) {
    var keepGoing = true;
    angular.forEach(contensiveFields, function(field, index) {
        if(field.required && (field.csvData.length === 0)) {
          errorMessage.showErrorModal('warning',  [{description: 'Please make sure you match all required fields'}]);
          keepGoing = false;
        }
        else if(field.csvData.length > 0 && (field.type === 'lookup' || field.type === 'boolean')) {
          if(field.dbMapValues.length == 0) {
            keepGoing = false;
            errorMessage.showErrorModal('warning',  [{description: 'You have unmapped fields: '+field.caption}]);
          }
        }
    })

    if(keepGoing) {

      $scope.titleAndReportingPeriodArray.splice(0, 1); //to get rid of first line - title
      console.log($scope.titleAndReportingPeriodArray);

      var projects = {projects: JSON.stringify($scope.titleAndReportingPeriodArray)}

      //Runs a query if there are any Reports with same name
      apiCall.sendPostData('/appNameSetSelfImportReviewProjectValidation', projects).then(function(response) {

          if(response.success) {
            $scope.processGUID = response.data[0].dataSet.requestKey;

            $state.go('app.preview-mapped-data', {
              mappedFile: contensiveFields, originalCSV: $scope.originalCSV, compareBy: $scope.compareRecordsBy,
              duplicateCSVRows: $scope.duplicateCSVRows, importPath: $state.current.name, importName: 'Projects', selectedTemplate: $scope.selectedTemplate,
              missingGoal: $scope.missingGoal,
              missingObjective: $scope.missingObjective,
              missingMeasure: $scope.missingMeasure,
              missingTarget: $scope.missingTarget,
              missingFinding: $scope.missingFinding,
              titleAndReportingPeriodArray: $scope.titleAndReportingPeriodArray,
              processGUID: $scope.processGUID
            });
          }

      });

    }
  };


});
