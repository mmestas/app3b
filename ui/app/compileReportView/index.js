app3.controller('compileReportListCtrl', function ($scope, blockUI, $state, $stateParams, $location, $rootScope, AUTH_EVENTS, AuthService, apiCall, aeMimeTypes, errorMessage, $timeout, $modal, $window, $filter, $http, $compile, $sanitize, $httpParamSerializerJQLike, Upload, $q) {

    $scope.init = function () {
      console.log('Init');
        //Scope Variables
        $scope.programRequestKey = $stateParams.programRequestKey;
        $scope.program  = {};
        $scope.projects = [];
        $scope.selectedProjects = [];
        $scope.pagination = {
            current: 1,
            itemsCount: 5,
            totalItems : 0
        };
        $scope.report = {
            name : String(),
            selectedStandards : []
        };

        $scope.stages = [];
        $scope.groups = [];

        $scope.getReportProjectList($scope.pagination.current, $scope.pagination.itemsCount, String());
        $scope.isEvaluatorAtProgram = false;
    };

    if($stateParams.report) {
      $scope.report = $stateParams.report;
    }
    if($stateParams.program) {
      $scope.program = $stateParams.program;
    }
    if($stateParams.accreditorInfo) {
        $scope.accreditorInfo = $stateParams.accreditorInfo;
    }
    if($stateParams.programRequestKey) {
      $scope.programRequestKey = $stateParams.programRequestKey;
    }
    if($stateParams.stagesFilter) {
      $scope.stagesFilter = $stateParams.stagesFilter;
    }
    if($stateParams.imageArray) {
      $scope.imageArray = $stateParams.imageArray;
    }
    else {
      $scope.imageArray = [];
    }

    $scope.initCoverPage = function() {
      $scope.reportObject = $stateParams.reportObject;
      // $scope.firepad = {};

      if($stateParams.savedDefaultCoverpage) {
        console.log($stateParams.savedDefaultCoverpage);
        $scope.savedDefaultCoverpage = $stateParams.savedDefaultCoverpage;
        $scope.firepad = {};
      }
      else {
        $scope.firepad = {};
      }

    }

    $scope.setFirepad = function (firepad) {
      if($stateParams.savedDefaultCoverpage) {
        var savedCoverPage = $stateParams.savedDefaultCoverpage;
        console.log(savedCoverPage);
        firepad.on('ready', function() {
          firepad.setHtml(savedCoverPage);
          $scope.firepad = firepad;
        });

      }
      else {
        $scope.firepad = firepad;
      }

       console.log($scope.firepad);
    };

    $scope.getFirepadContents = function () {
        var coverPageHTML = $scope.firepad.getHtml();
        $scope.coverPageHTML = $scope.firepad.getHtml();
        console.log(coverPageHTML);

        // if ($scope.firepad && $scope.firepad.ready_) {
        //     $scope.coverPageHTML = $scope.firepad.getHtml();
        //     return $scope.coverPageHTML();
        // }
        // return String();

    };

    /****Image File Insert ***/
    $scope.submitEvidenceLink = function () {
        var currentSelection = $scope.firepad.getHtmlFromSelection();
        if (!currentSelection.length) {
            if (!$scope.firepadHyperlink.entityHandler)
                $scope.firepad.insertHtmlAtCursor('<a target="_blank" href="' + $scope.firepadHyperlink.file.resourceURL + '" data-guid="' + $scope.firepadHyperlink.file.evidenceRequestkey + '">' + $scope.firepadHyperlink.text + '</a>');
            else {
                $scope.firepadHyperlink.entityHandler.replace({
                    href: $scope.firepadHyperlink.file.resourceURL,
                    guid: $scope.firepadHyperlink.file.evidenceRequestkey,
                    text: $scope.firepadHyperlink.text
                });
            }
        }
        else {
            var doc = $scope.firepad.codeMirror_.getDoc();
            doc.replaceSelection(String());
            $scope.firepad.insertHtmlAtCursor('<a target="_blank" href="' + $scope.firepadHyperlink.file.resourceURL + '" data-guid="' + $scope.firepadHyperlink.file.evidenceRequestkey + '">' + $scope.firepadHyperlink.text + '</a>');
        }

        $scope.closeHyperlinkModal();
    };

    $scope.showInsertImageModal = function () {
        var params = {
            templateUrl: 'id-narrativeInsertImage',
            scope: $scope,
            closeOnClick: true,
            windowClass: 'imageURLModal',
            resolve: {}
        };
        $scope.firepadImage = {};
        $scope.inasertImgModal = $modal.open(params);

    };

    $scope.checkImageUrl = function (src) {
        return(src.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null);
    };

    $scope.submitImageLink = function () {
        $scope.firepad.insertEntity('img', {src : $scope.firepadImage.url});
        $scope.closeInsertImageModal();
    };

//UPLOAD IMAGE HERE
    $scope.uploadImageFile = function ($file) {
      var callDomain = $location.protocol() + "://" + $location.host();
      //allow files with latin characters only
      var nonLatinRegex = /[^\u0000-\u007f]/;
      if(nonLatinRegex.test($file.name)){
          errorMessage.showErrorModal("Invalid File", [{description : $file.name + ' is not a valid filename. Please rename the file to contain only latin characters, numbers, and symbols. Then try to upload the file again.'}]);
          return;
      }
      else if($file.name.length > 100){
          errorMessage.showErrorModal("Invalid File", [{description : $file.name + ' is not a valid filename because it contains more than 100 characters. Please rename the file to contain less than 100 characters. Then try to upload the file again.'}]);
          return;
      }
      var uploadUrl = __env.apiUrl + __env.baseUrl + '/default.aspx?remoteCall=webURLsaveAccreditationReportImage&RequestBinary='+true;
      $scope.uploadProgress = 0;
      var modalUI = blockUI.instances.get('modalUI');
      modalUI.start({
          message: $scope.uploadProgress + '% Uploaded'
      });
      Upload.upload({
          url: uploadUrl,
          data: {
              programRequestKey: $scope.programRequestKey,
              imagefilename : $file
          },
      })
      .progress(function (e) {
          $scope.uploadProgress = parseInt(100.0 * e.loaded / e.total, 10);
          modalUI.message($scope.uploadProgress + '% Uploaded');
      })
      .then(function(response) {
          if(response.data.success) {
            var tmpFile = response.data.data[0].dataSet;
            $scope.firepadImageURL = response.data.data[0].dataSet.resourceURL;
            $scope.imageArray.push(response.data.data[0].dataSet);
            console.log($scope.imageArray);
          }
          else {
                 //Error Handling
          }
          modalUI.stop();
      })
      // .error(function (err) {
      //     modalUI.stop();
      //     //General error Handling
      // });
    };

    //UPLOAD IMAGE HERE
        $scope.submitCoverPageImage = function () {
            if($scope.checkImageUrl($scope.firepadImageURL)) {
                $scope.firepad.insertEntity('img', {src: $scope.firepadImageURL});
                $scope.closeInsertImageModal();
            }
            else{
                $scope.firepadImage.invalidEvidence = true;
            }
        };

        $scope.closeInsertImageModal = function () {
            $scope.inasertImgModal.close();
        };

    /**** End Image File Insert ***/
    $scope.addOrRemoveSelectedStandard = function(standard){
        if(standard.selected){
            $scope.report.selectedStandards.push(standard.projectMetaData.id);
        }
        else{
            for (var i=$scope.report.selectedStandards.length-1; i>=0; i--) {
                if ($scope.report.selectedStandards[i] === standard.projectMetaData.id) {
                    $scope.report.selectedStandards.splice(i, 1);
                     break;
                }
            }
        }
    };

    //Original as of 12.5.18
    // $scope.addAllSelected = function (stagesFilter) {
    //     $scope.report.selectedStandards.length = 0;
    //     var programUI = blockUI.instances.get('programUI');
    //     programUI.start();

    //     apiCall.getData('/webURLgetReportProjectList/', {programRequestKey : $scope.programRequestKey, memberRequestKey: $scope.currentUser.userRequestKey, iDisplayStart: 0, iDisplayLength : 9999}).then(function(response) {
    //         if (response.success) {
    //             var standards = response.data[0].dataSet;
    //             $scope.report.selectedStandards = [];
    //             angular.forEach(standards, function (standard) {
    //                 if($scope.isAvailableForSelectedStage(standard, stagesFilter)) {
    //                     $scope.report.selectedStandards.push(standard.projectMetaData.id);
    //                 }
    //             });
    //             angular.forEach($scope.projects, function (standard) {
    //                 if($scope.isAvailableForSelectedStage(standard, stagesFilter)) {
    //                     standard.selected = true;
    //                 }
    //             })
    //         }
    //         programUI.stop();
    //     });
    // };

    //New from above as of 12.5.18
    $scope.addAllSelected = function (stagesFilter) {
        $scope.report.selectedStandards.length = 0;
        $scope.report.selectedStandards = [];
        var programUI = blockUI.instances.get('programUI');
        programUI.start();

        angular.forEach($scope.projects, function (standard) {
            if($scope.isAvailableForSelectedStage(standard, stagesFilter)) {
                $scope.report.selectedStandards.push(standard.projectMetaData.id);
            }
            if($scope.isAvailableForSelectedStage(standard, stagesFilter)) {
                standard.selected = true;
            }
        })
        programUI.stop();
    };

    $scope.removeAllSelected = function () {
        $scope.report.selectedStandards.length = 0;
        angular.forEach($scope.projects, function (standard) {
            standard.selected = false;
        })
    };

    //NOTE: ORIGINAL FUNCTION - NOT USED as of 5/21/18
    // $scope.filterByStage = function(stageFilter) {
    //   if(stageFilter === null) {
    //     $scope.getReportProjectList($scope.pagination.current, $scope.pagination.itemsCount, String());
    //   }
    //   else {
    //       var programUI = blockUI.instances.get('programUI');
    //       programUI.start();
    //     var start = $scope.pagination.current;
    //     var length = $scope.pagination.totalItems;
    //     apiCall.getData('/webURLgetReportProjectList/', {programRequestKey : $scope.programRequestKey, memberRequestKey: $scope.currentUser.userRequestKey, iDisplayStart: (start-1)*length, iDisplayLength : length, stageRequestKey : stageFilter})
    //     .then(function(response){
    //         if(response.success){
    //             $scope.pagination.totalItems = response.data[0].recordCount;
    //             $scope.projects = response.data[0].dataSet;
    //             var filteredProjects = [];
    //             angular.forEach($scope.projects, function (standard) {
    //                 angular.forEach(standard.standardResponses, function (standardResponse) {
    //                     if(standardResponse.stage.requestKey === stageFilter) {
    //                       filteredProjects.push(standard);
    //                     }
    //                 });
    //             })
    //             console.log(filteredProjects);
    //           $scope.projects =  filteredProjects;
    //         }
    //         else {
    //             errorMessage.showErrorModal("There was a problem with getting the standards' list", response.dataError);
    //         }
    //         programUI.stop();
    //     });
    //   }
    // }

    //NOTE: This is a copy and extension of filterByStage
    $scope.filterByStageAndOrGroup = function(stageFilter, groupFilter) {
      $scope.report.selectedStandards = [];
      if((!stageFilter) && (!groupFilter)) {
        $scope.getReportProjectList($scope.pagination.current, $scope.pagination.itemsCount, String());
      }
      else {
        var programUI = blockUI.instances.get('programUI');
        programUI.start();
        var start = $scope.pagination.current;
        var length = $scope.pagination.totalItems;
        apiCall.getData('/webURLgetReportProjectList/', {programRequestKey : $scope.programRequestKey, memberRequestKey: $scope.currentUser.userRequestKey, iDisplayStart: (start-1)*length, iDisplayLength : length, groupRequestKey : groupFilter}).then(function(response){
            if(response.success){
              $scope.pagination.totalItems = response.data[0].recordCount;
              $scope.projects = response.data[0].dataSet;
              console.log($scope.projects);
              var filteredProjects = [];
              var filteredStandardResponses = [];
              if((!groupFilter) && stageFilter) {
                angular.forEach($scope.projects, function (standard) {
                    angular.forEach(standard.standardResponses, function (standardResponse) {
                        if(standardResponse.stage && (standardResponse.stage.requestKey === stageFilter)) {
                          filteredProjects.push(standard);
                        }
                    });
                })
              }
              else if((!stageFilter) && groupFilter) {
                angular.forEach($scope.projects, function (standard) {
                  if(standard.projectMetaData.standard && standard.projectMetaData.standard.standardGroup) {
                    if(standard.projectMetaData.standard.standardGroup.requestKey === groupFilter) {
                      filteredProjects.push(standard);
                    }
                  }
                })
              }
              else {
                angular.forEach($scope.projects, function (standard) {
                    angular.forEach(standard.standardResponses, function (standardResponse) {
                      if(standardResponse.stage) {
                        if(standardResponse.stage.requestKey === stageFilter) {
                            filteredStandardResponses.push(standard);
                        }
                      }
                    });
                })
                angular.forEach(filteredStandardResponses, function(sr) {
                  if(sr.projectMetaData.standard && sr.projectMetaData.standard.standardGroup) {
                    if(sr.projectMetaData.standard.standardGroup.requestKey === groupFilter) {
                      filteredProjects.push(sr);
                    }
                  }
                })
              }
              $scope.projects = filteredProjects;
            }
            else {
                errorMessage.showErrorModal("There was a problem with getting the standards' list", response.dataError);
            }
            programUI.stop();
        });
      }
    }

    $scope.getAccessibleStage = function (standard) {
        if($scope.organizationInfo.isAccreditor || $scope.isEvaluatorAtProgram){
            var stage = String();
            angular.forEach(standard.standardResponses, function (standardResponse, i) {
                if(standardResponse.visibility > 1){
                    if(standardResponse.stage)  stage = standardResponse.stage.name;
                }
            });
            if(!stage) return standard.projectMetaData.stage;
            return stage;
        }
        else{
            return standard.projectMetaData.stage;
        }
    };

    $scope.isAvailableForSelectedStage = function (standard, stagesFilter) {
        if(!standard.standardResponses.length) return false;
        if(!$scope.organizationInfo.isAccreditor && !$scope.isEvaluatorAtProgram) {
            if(!stagesFilter) return true;
            return standard.standardResponses.filter(function (standardResponse) {
                return standardResponse.stage.requestKey === stagesFilter;
            }).length !== 0;
        }
        else{
            if(!stagesFilter){
                return standard.standardResponses.filter(function (standardResponse) {
                    return standardResponse.visibility > 1;
                }).length !== 0;
            }
            return standard.standardResponses.filter(function (standardResponse) {
                return standardResponse.stage.requestKey === stagesFilter && standardResponse.visibility > 1;
            }).length !== 0;
        }
    };

    $scope.hasResponseAvailableForSelectedStage = function (standard, stagesFilter) {
        if(!standard.standardResponses.length) return false;
        if(!stagesFilter) return true;
        return standard.standardResponses.filter(function (standardResponse) {
                return standardResponse.stage.requestKey === stagesFilter;
            }).length !== 0;

    };

    $scope.isVisibleForSelectedStage = function (standard, stagesFilter) {
        if(!standard.standardResponses.length) return false;
        if(!stagesFilter){
            return standard.standardResponses.filter(function (standardResponse) {
                    return standardResponse.visibility > 1;
                }).length !== 0;
        }
        return standard.standardResponses.filter(function (standardResponse) {
                return standardResponse.stage.requestKey === stagesFilter && standardResponse.visibility > 1;
            }).length !== 0;
    };

    $scope.getReportProjectList = function (start, length, stageFilter) {
      //For Demo Testing
      length = 500;
      //end Demo Testing
        var programUI = blockUI.instances.get('programUI');
        programUI.start();

        var apiCallPromises = [apiCall.getData('/webURLgetReportProjectList/', {programRequestKey : $scope.programRequestKey, memberRequestKey: $scope.currentUser.userRequestKey, iDisplayStart: (start-1)*length, iDisplayLength : length, stageRequestKey : stageFilter})];
        if($scope.currentUser.userRoles.isEvaluator === true){
            apiCallPromises.push(apiCall.getData('/webURLgetEvaluatorPrograms/', {personRequestKey : $scope.currentUser.userRequestKey}));
        }

        $q.all(apiCallPromises).then(function(responses){
            var response = responses[0];
            if(response.success){
                $scope.pagination.totalItems = response.data[0].recordCount;
                $scope.projects = response.data[0].dataSet;
                $scope.program = response.data[1].dataSet;
                $scope.stages = response.data[2].dataSet.stageNames;
                $scope.accreditorInfo = response.data[2].dataSet;
                $scope.standardGroups = [];

                //We will check if the logged in user is an evaluator to selected program
                if($scope.currentUser.userRoles.isEvaluator === true && responses[1] && responses[1].success && responses[1].data[0]){
                    $scope.isEvaluatorAtProgram = responses[1].data[0].dataSet.filter(function (p) {
                        return p.requestKey === $scope.program.requestKey;
                    }).length !== 0;
                }

                angular.forEach($scope.projects, function (standard) {
                    if($scope.report.selectedStandards.indexOf(standard.projectMetaData.id) != -1){
                        standard.selected = true;
                    }
                    if(standard.projectMetaData.standard) $scope.groups.push(standard.projectMetaData.standard.standardGroup);
                })

                angular.forEach($scope.groups, function(value, key) {
                  var exists = false;
                  if(value) {
                    if($scope.standardGroups.length > 1) {
                      angular.forEach($scope.standardGroups, function(val2, key) {
                  			if(angular.equals(value.id, val2.id)){ exists = true };
                  		});
                  		if(exists == false && value.id != "") { $scope.standardGroups.push(value); }
                    }
                    else {
                      if(exists == false && value.id != "") { $scope.standardGroups.push(value); }
                    }
                  }
                })
            }
            else {
                errorMessage.showErrorModal("There was a problem with getting the standards' list", response.dataError);
            }
            programUI.stop();
        });
    };

    //for testing
    // $scope.getReport = function() {
    //   console.log($scope.report);
    // }
    $scope.prepareReportStep2 = function(stagesFilter) {
      $state.go('app.compile-report-step2', {programRequestKey : $scope.programRequestKey, report: $scope.report, stagesFilter: stagesFilter, program: $scope.program, accreditorInfo: $scope.accreditorInfo});
    }

    $scope.pageBreak = 'page-break-before: always';
    // $scope.myTestBtn = true;
    $scope.generateReport = function(coverPage, defaultCoverPage) {
      console.log(defaultCoverPage);
      var listReportHtml = angular.element(listReport)
            .html()
            .replace(/(ng-\w+-\w+="(.|\n)*?"|ng-\w+="(.|\n)*?"|ng-(\w+-\w+)|ng-(\w+))/g, '')
            .replace(/<!--(.*?)-->/gm, "");
      $rootScope.jsonModel.html = listReportHtml;
      console.log(listReportHtml);
      var newModel = $rootScope.jsonModel;
      var newModelToSend = angular.toJson(newModel, true);
      console.log(newModelToSend);
      var reportObject = {
        programRequestKey : $scope.programRequestKey,
        associatedStandards : $scope.report.selectedStandards.join(","),
        reportName : $scope.report.name,
        reportJsonTemplate : newModelToSend,
        reportCoverPage : 'No Cover Page Included',
        reportDescription : $scope.report.description,
        stageRequestKey: $scope.stagesFilter
      }
      console.log(reportObject);
      if(coverPage && defaultCoverPage) {
        apiCall.sendPostData('/webURLgetAccreditationReportDefaultCoverPage', {programRequestKey: $scope.programRequestKey}).then(function(response){
          $scope.savedCoverpage = response.data[0].dataSet.html;
          $scope.imageArray = response.data[0].dataSet.images; //NOTE: this doesn't exist yet

          $state.go('app.compile-report-coverPage', {reportObject : reportObject, programRequestKey: $scope.programRequestKey, program: $scope.program, imageArray: $scope.imageArray, savedDefaultCoverpage: $scope.savedCoverpage});
        });
      }
      else if(coverPage && !defaultCoverPage) {
        $scope.imageArray = [];
        $state.go('app.compile-report-coverPage', {reportObject : reportObject, programRequestKey: $scope.programRequestKey, program: $scope.program, imageArray: $scope.imageArray});

      }
      else {
        apiCall.sendPostData('/webURLsaveAccreditationReport/', reportObject).then(function (response) {
            if(response.success){
                $scope.openReportAddedModal();
            }
            else {}
          });
      }
    };

    $scope.generateReportWithCoverPage = function(saveDefaultCoverPage) {

      console.log($scope.imageArray);
      console.log(saveDefaultCoverPage);
      // $scope.reportObject.images = $scope.imageArray;
      var imageArray = $scope.imageArray;
      var stringifyImageArray = angular.toJson(imageArray, true);
      $scope.reportObject.images = stringifyImageArray;
      console.log($scope.reportObject);

    //
      var coverPageHTML = $scope.firepad.getHtml();
    //
    //
      if(saveDefaultCoverPage) {
        apiCall.sendPostData('/webURLsaveAccreditationReportDefaultCoverPage', {programRequestKey:$scope.programRequestKey, reportCoverPage: coverPageHTML, images: stringifyImageArray}).then(function (response) {
          console.log(response);
        })
      }
    //
      $scope.reportObject.reportCoverPage = coverPageHTML;
    //   $scope.reportObject.images = $scope.imageArray;
      console.log($scope.reportObject);
      apiCall.sendPostData('/webURLsaveAccreditationReport/', $scope.reportObject).then(function (response) {
          if(response.success){
              $scope.openReportAddedModal();
          }
          else {}
        });
    }

    $scope.goBack = function () {
        $window.history.back();
    };

    $scope.openReportAddedModal = function () {
        var params = {
            templateUrl: 'id-modalReportAdded.html',
            scope: $scope,
            closeOnClick: true,
            resolve: {}
        };
        $scope.modalReportAddedInstance = $modal.open(params);

    };

    $scope.closeReportAddedModal = function () {
        $scope.modalReportAddedInstance.close();
    };

    $scope.userCanGenerateReport = function () {
        return $scope.report.selectedStandards.length;
    }

    $scope.getAllRows = function() {
        if($scope.pagination.totalItems > $scope.pagination.itemsCount) {
            $scope.pagination.itemsCount = $scope.pagination.totalItems;
        }
        else {
            $scope.pagination.itemsCount = 5;
        }
    }



});
