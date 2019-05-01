app3.controller('importCoursesCtrl', function ($scope, $rootScope, $state, $stateParams, $location, blockUI, AUTH_EVENTS, AuthService, apiCall, aeMimeTypes, errorMessage, $timeout, $modal, $window, $filter, $http, $compile, $sanitize, $httpParamSerializerJQLike, Upload, $q, readFileData) {
  //INITS
  //Step 2
  $scope.initImportCourses = function() {
    if($stateParams.dbFields !== null) {
      $scope.contensiveFields = $stateParams.dbFields;
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

    $scope.fileIsTooLarge = false;
    $scope.fileIsTooLargeErrorMsg = '';
    if($stateParams.fileIsTooLarge) {
      $scope.fileIsTooLarge = true;
      $scope.fileIsTooLargeErrorMsg = 'Your CSV file exceeds the maximum rows (1000) allowed. Please limit the length of your file to no more than 1000 rows and create multiple files if your current file exceeds this limit.';
    }
  };
  //Step 3
  $scope.initMapCourses = function() {
    if($stateParams.dbFields !== null) {
      $scope.contensiveFields = $stateParams.dbFields;
    }
    else {
      $scope.getDBFields();
    }

    $scope.csvFields = $stateParams.file;
    if($scope.csvFields) {
      $scope.csvFieldOptions = $scope.csvFields.line_0;
    } //New
    $scope.csvFilename = $stateParams.filename;
    $scope.matchByFieldSelections = $stateParams.matchByFieldSelections; //New
    $scope.originalCSV = $stateParams.originalCSV;
    $scope.importNewRecords = true; //New
    $scope.updateMatchingRecords  = $stateParams.updateMatchingRecords;
    $scope.compareRecordsBy = $stateParams.compareBy;
    $scope.allowErrorMsg = true;
    $scope.dontShowErrorMsg = false;
    $scope.contensiveFields[0].csvField = $scope.compareRecordsBy.courseCode.csvField;
    $scope.contensiveFields[1].csvField = $scope.compareRecordsBy.courseNumber.csvField;
    $scope.contensiveFields[2].csvField = $scope.compareRecordsBy.courseTerm.csvField;
    $scope.contensiveFields[3].csvField = $scope.compareRecordsBy.courseYear.csvField;

    var courseCode = $scope.contensiveFields[0];
    var courseNumber = $scope.contensiveFields[1];
    var courseTerm = $scope.contensiveFields[2];
    var courseYear = $scope.contensiveFields[3];

    $scope.addCSVField(courseCode.csvField, courseCode, $scope.csvFields.line_0);
    $scope.addCSVField(courseNumber.csvField, courseNumber, $scope.csvFields.line_0);
    $scope.addCSVField(courseTerm.csvField, courseTerm, $scope.csvFields.line_0);
    $scope.addCSVField(courseYear.csvField, courseYear, $scope.csvFields.line_0);

    //To keep the first 4 fields not editable.
    var newContensiveFields = $scope.contensiveFields;
    var mapped = [{code: null, number: null, term: null, year: null, csvIndex: null}];
    //NOTE: On Uploading a new file to fix it, if the mapped field TITLES are not identical, this will be thrown off
    angular.forEach(newContensiveFields, function(row, key) {
      if(key === 0)  {
        angular.forEach(row.csvData, function(field, fieldKey) {
          mapped.push({code: null, number: null, term: null, year: null, csvIndex: null});
          mapped[fieldKey].code = field;
          mapped[fieldKey].csvIndex = fieldKey;
        })
      }
      if(key === 1)  {
        angular.forEach(row.csvData, function(field1, field1Key) {
        mapped[field1Key].number = field1;
        })
      }
      if(key === 2)  {
        angular.forEach(row.csvData, function(field2, field2Key) {
          mapped[field2Key].term = field2;
        })
      }
      if(key === 3)  {
        angular.forEach(row.csvData, function(field3, field3Key) {
          mapped[field3Key].year = field3;
        })
      }
    })

    var spliceLastRow = mapped.length - 1;
    mapped.splice(spliceLastRow, 1)


    $scope.duplicateCSVRows = [];
    angular.forEach(mapped, function(item, key) {
        angular.forEach(mapped, function(item2, key2) {
          if(key != key2 && (mapped[key].number === mapped[key2].number) && (mapped[key].code === mapped[key2].code) && (mapped[key].term === mapped[key2].term) && (mapped[key].year === mapped[key2].year)) {
            if(item2.group) {
              item2.group.push(key);
            }
            else {
              item2.group = [];
              item2.group.push(key);
              item2.group.push(key2);
            }
            if($scope.duplicateCSVRows.indexOf(item2) != -1) {
            }
            else {
              $scope.duplicateCSVRows.push(item2);
            }

          }
        })
    })

  };

  //Step 4
  // $scope.initpreviewMappedCoursesData = function() {
  //   console.log($stateParams);
  //   $scope.contensiveFields = $stateParams.mappedFile;
  //   $scope.originalCSV = $stateParams.originalCSV;
  //   $scope.importNewRecords  = $stateParams.importNewRecords;
  //   $scope.updateMatchingRecords  = $stateParams.updateMatchingRecords;
  //   $scope.compareRecordsBy  = $stateParams.compareBy;
  //   $scope.duplicateCSVRows  = $stateParams.duplicateCSVRows;
  //   $scope.importToInclude = [];
  //   $scope.emptyRequiredFields = [];
  //   $scope.emptyFieldsNotRequired = [];
  //   angular.forEach($scope.contensiveFields, function(row) {
  //     if(row.csvData.length > 0) {
  //       $scope.importToInclude.push(row);
  //     }
  //     if(row.emptyFields.length > 0) {
  //       if(row.required) {
  //         $scope.emptyRequiredFields.push(row);
  //       }
  //       else {
  //         $scope.emptyFieldsNotRequired.push(row);
  //       }
  //     }
  //   })
  // };

  //Step 5 - just for testing purposes
  $scope.importCoursesComplete = function() {
    $scope.importMessage = $stateParams.message;
    $scope.calloutClass = $stateParams.calloutClass;
  };

  // Step 1 & Step 2 Modal
  $scope.importCSVModal = function() {
    var params = {
        templateUrl: '/app/dataManagement/importCSVModal.html',
        scope: $scope,
        closeOnClick: true,
        resolve: {},
        controller: function($scope, $modalInstance) {
            $scope.importPath = 'app.data-import-courses'
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
  };
  // Step 1 & Step 2 Modal
  $scope.fileDataObj = {};
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
      $scope.fileIsTooLarge = false;
      $scope.fileIsTooLargeErrorMsg = '';
      if($scope.fileDataObj[1] > 1000) {
        $scope.fileIsTooLarge = true;
        $scope.fileIsTooLargeErrorMsg = 'Your CSV file exceeds the maximum rows (1000) allowed. Please limit the length of your file to no more than 1000 rows and create multiple files if your current file exceeds this limit.';
      }
      $scope.modalInstance = $scope.modalInstance.close();
      if($stateParams.mappedFile) {
        $state.go('app.map-importedCourses-data', {file: $scope.fileDataObj[0], dbFields: $scope.contensiveFields, originalCSV: originalCSV, importNewRecords: $scope.importNewRecords, updateMatchingRecords: $scope.updateMatchingRecords, compareBy: $scope.compareRecordsBy});
      }
      else {
        $state.go(path, {file: $scope.fileDataObj[0], fileIsTooLarge: $scope.fileIsTooLarge, filename: CSVfileName, dbFields: $scope.contensiveFields, matchByFieldSelections: $scope.matchByFieldSelections, originalCSV: originalCSV});
      }
    }
  };
  //Step 2
  $scope.getDBFields = function() {
    apiCall.getData('/appNamegetCoursesContentFields/').then(function(response) {
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
          //for secondary matching fields
          if(contensiveField.type === 'boolean') {
            contensiveField.dbMap = [true, false];
          }
          if(contensiveField.type === 'lookup') {
            contensiveField.dbMap = contensiveField.values;
            contensiveField.dbMap.push('no match found');
          }
          //For required fields
          // || contensiveField.name === 'course.employeeNumber'
          // || contensiveField.name === 'course.coursecredits'
          if(
             contensiveField.name === 'course.coursecode' || contensiveField.name === 'course.name'
          || contensiveField.name === 'course.courseacademicyear'
          || contensiveField.name === 'cipcodes.name' || contensiveField.name === 'course.coursenumberalpha'
          || contensiveField.name === 'course.courseterm' || contensiveField.name === 'course.courseyear'
          ) {
            contensiveField.required = true;
          }
          else {
            contensiveField.required = false;
          }
          if((contensiveField.name === 'course.coursecode') || (contensiveField.name === 'course.coursenumberalpha') || (contensiveField.name === 'course.courseterm') || (contensiveField.name === 'course.courseyear')) {
            $scope.matchByFieldSelections.push(contensiveField);
          }
          //contensive ID should only show up in Matching and NOT show up in the mapping
          if(contensiveField.name === 'people.id' || contensiveField.name === 'course.enrollment') {
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
  };

  //Step 2 --> 3
  $scope.matchingFieldError = false;

  $scope.goToCoursesMapping = function(importNewRecords, updateMatchingRecords, matchCSVFieldBy, matchCSVFieldBy2, matchCSVFieldBy3, matchCSVFieldBy4) {

    if([matchCSVFieldBy2, matchCSVFieldBy3, matchCSVFieldBy4].indexOf(matchCSVFieldBy) >= 0) {
      $scope.matchingFieldError = true;
      $scope.errorMessage = 'There cannot be two identical corresponding field selections';
    }
    else if([matchCSVFieldBy, matchCSVFieldBy3, matchCSVFieldBy4].indexOf(matchCSVFieldBy2) >= 0) {
      $scope.matchingFieldError = true;
      $scope.errorMessage = 'There cannot be two identical corresponding field selections';
    }
    else if([matchCSVFieldBy, matchCSVFieldBy2, matchCSVFieldBy4].indexOf(matchCSVFieldBy3) >= 0) {
      $scope.matchingFieldError = true;
      $scope.errorMessage = 'There cannot be two identical corresponding field selections';
    }
    else if([matchCSVFieldBy, matchCSVFieldBy3, matchCSVFieldBy2].indexOf(matchCSVFieldBy4) >= 0) {
      $scope.matchingFieldError = true;
      $scope.errorMessage = 'There cannot be two identical corresponding field selections';
    }
    else {
      $scope.matchingFieldError = false;
      var compareByIndex = $scope.csvFieldOptions.indexOf(matchCSVFieldBy);
      var compareByIndex2 = $scope.csvFieldOptions.indexOf(matchCSVFieldBy2);
      var compareByIndex3 = $scope.csvFieldOptions.indexOf(matchCSVFieldBy3);
      var compareByIndex4 = $scope.csvFieldOptions.indexOf(matchCSVFieldBy4);
        $scope.needToMakeASelection = false;
      if(!importNewRecords && !updateMatchingRecords) {
        $scope.needToMakeASelection = true;
        errorMessage.showErrorModal('Error <i class="ion-android-warning"></i>',  [{description: 'At least one checkbox needs to be selected'}]);
      }
      else {
        var updateRecords = false;
        var importRecords = false;
        if(importNewRecords || updateMatchingRecords) {
          if(importNewRecords) {importRecords = true;}
          if(updateMatchingRecords) {updateRecords = true;}
          $scope.compareRecordsBy = {
            "courseCode":{
              csvField: matchCSVFieldBy,
              compareBy: compareByIndex
            },
            "courseNumber":{
              csvField: matchCSVFieldBy2,
              compareBy: compareByIndex2
            },
            "courseTerm":{
              csvField: matchCSVFieldBy3,
              compareBy: compareByIndex3
            },
            "courseYear":{
              csvField: matchCSVFieldBy4,
              compareBy: compareByIndex4
            }
          };
        }
        else {
          importRecords = false;
          updateRecords = false;
          $scope.compareRecordsBy = {
            "courseCode":{
              csvField: null,
              compareBy: null
            },
            "courseNumber":{
              csvField: null,
              compareBy: null
            },
            "courseTerm":{
              csvField: null,
              compareBy: null
            },
            "courseYear":{
              csvField: null,
              compareBy: null
            }
          };
        }
        $state.go('app.map-importedCourses-data', {file: $scope.csvFields, dbFields: $scope.contensiveFields, originalCSV: $scope.originalCSV, importNewRecords: importNewRecords, updateMatchingRecords: updateMatchingRecords, compareBy: $scope.compareRecordsBy});
      }
    }


  };

  //Step3
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
        // NOTE: Keep the following - useful!!
        // if(field.csvData.length < 3) {
        //   if(field.csvData.length == 0) {
        //     field.csvData[0] = 'empty';
        //     field.csvData[1] = 'empty';
        //     field.csvData[2] = 'empty';
        //   }
        //   else if(field.csvData.length == 1) {
        //     field.csvData[1] = 'empty';
        //     field.csvData[2] = 'empty';
        //   }
        //   else if(field.csvData.length == 2) {
        //     field.csvData[2] = 'empty';
        //   }
        // }
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

  //Step 3 --> 4
  $scope.goToMapPreview = function(contensiveFields) {
    var keepGoing = true;
    angular.forEach(contensiveFields, function(field, index) {
      if(keepGoing) {
        if(index == 0 || index == 1 || index == 2 || index == 3) {
          keepGoing = true;
        }
        else {
          if(field.required && (field.csvData.length == 0)) {
            errorMessage.showErrorModal('Warning',  [{description: 'Please make sure you match all required fields'}]);
            keepGoing = false;
          }
        }

      }
    })
    if(keepGoing) {
      $state.go('app.preview-mapped-data', {
        mappedFile: contensiveFields, originalCSV: $scope.originalCSV, importNewRecords: $scope.importNewRecords, updateMatchingRecords: $scope.updateMatchingRecords,
        compareBy: $scope.compareRecordsBy, duplicateCSVRows: $scope.duplicateCSVRows, importPath: $state.current.name, importName: 'Courses'
      });
    }
  };

  //Step 4
  $scope.saveDbMap = function() {
    $scope.importCSVModal();
  };
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

    var programUI = blockUI.instances.get('programUI');
    programUI.start();

    var uploadUrl = __env.apiUrl + __env.baseUrl + '/appNameprocessSelfImportCoursesUpload/?' + $httpParamSerializerJQLike(params);
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

  //////////////// EDIT MAPPING //////////////////
  $scope.whatDoYouWantToDo = 'Some explanation should go here';
  $scope.matchContensiveFieldExplanation = 'These are fields in the database. Select the field you want to use to identify the user.';
  $scope.matchCVSFieldExplanation = 'These are fields in your CVS file.  Match the corresponding field in your CSV file to the one you selected from the database.';

});
