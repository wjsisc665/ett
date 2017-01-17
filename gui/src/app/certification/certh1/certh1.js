var certCerth1 = angular.module('ttt.certification.certh1', []);

certCerth1.config(['$stateProvider',
	function($stateProvider) {
		$stateProvider.state('certification.certh1.main', {
				url: '',
				views: {
					"certh1": {
						templateUrl: 'edge/smtp/smtpMain.tpl.html'
					}
				}
			})
			.state('certification.certh2.main', {
				url: '',
				views: {
					"certh2": {
						templateUrl: 'edge/smtp/smtpMain.tpl.html'
					}
				}
			})
			.state('certification.certh1.description', {
				url: '/description/:id',
				views: {
					"certh1": {
						templateUrl: 'edge/smtp/description/testDescription.tpl.html'
					}
				}
			})
			.state('certification.certh1.logs', {
				url: '/logs',
				views: {
					"certh1": {
						templateUrl: 'edge/smtp/logs/testLog.tpl.html'
					}
				}
			});

	}
]);

certCerth1.controller('Certh1Ctrl', ['$scope', '$stateParams','LogInfo','growl','SMTPLogFactory','SMTPTestCasesDescription','SMTPTestCases','XDRTestCasesTemplate','XDRTestCases','SMTPProfileFactory','SettingsFactory', 'PropertiesFactory',  '$timeout','$window','CCDADocumentsFactory', 'DirectCertsLinkFactory','$filter','$state','$location','$anchorScroll',
	function($scope, $stateParams, LogInfo,growl,SMTPLogFactory, SMTPTestCasesDescription,SMTPTestCases,XDRTestCasesTemplate,XDRTestCases,SMTPProfileFactory,SettingsFactory, PropertiesFactory, $timeout,$window,CCDADocumentsFactory, DirectCertsLinkFactory,$filter, $state,$location,$anchorScroll) {
         $scope.paramCri =  $stateParams.paramCri;
         $scope.pageTitle= $state.current.data.pageTitle;
		$scope.filterCrit = $state.current.data.filterCrit;

		$scope.properties = PropertiesFactory.get(function(data) {
		// Smtp
		$scope.smtpTests = [];
		$scope.xdrTests = [];
		$scope.isXdrTest = false;
		$scope.testSystem = "certification";
		$scope.edgeProtocol = "certh1";
		$scope.backToCriteria = 0;


		XDRTestCasesTemplate.getTestCasesDescription(function(response) {
			var result = response.data;
			angular.forEach(result, function(test) {
				if (!test.status) {
					test.status = 'na';
				} else if(test.status === 'configure') {
					$scope.configureXdr(test);
				}
				$scope.xdrTests.push(test);
			});
		});

		$scope.configureXdr = function(test) {
			test.status = "loading";
			var properties = {};
			XDRTestCases.configure({
				id: test.id
			}, function(data) {
				if(data.content) {
					test.endpoint = data.content.value.endpoint;
					test.endpointTLS = data.content.value.endpointTLS;
				}
				test.status = 'na';
			}, function(data) {
				test.status = 'error';
				if (data.data) {
					throw {
						code: data.data.code,
						url: data.data.url,
						message: data.data.message
					};
				}
			});
		};
		$scope.successUpload = function(message) {
			$scope.fileInfo = angular.fromJson(message);
			var validExts = new Array(".der", ".pem");
			var fileExt = $scope.fileInfo.flowFilename.substring($scope.fileInfo.flowFilename.lastIndexOf('.'));
			if (validExts.indexOf(fileExt) >= 0) {
				var certFilePath = $scope.fileInfo.flowRelativePath;
				DirectRICertFactory.save(certFilePath, function(data) {
					if (data.criteriaMet == "FALSE"){
						growl.error("Failed to Upload Certificate", {});
					}else{
						growl.success("Certificate Uploaded", {});
					}
				}, function(data) {
					throw {
						code: data.data.code,
						url: data.data.url,
						message: data.data.message
					};
				});
			}else{
				growl.error("Invalid file selected, valid files are "+validExts.toString()+" types.", {});
			}
		};

		SMTPTestCasesDescription.getTestCasesDescription(function(response) {
			var result = response.data;
			$scope.testingMode = result.testingMode;
			angular.forEach(response.data.tests, function(test) {
				test.status = 'na';
				test.testResult = [{
					"criteriaMet": "NA"
				}];
					$scope.smtpTests.push(test);
			});
		});

           $scope.criteriaSelection= [
            {  name: "Please select", xdrTest:false, testList:['h1','h2'], criteria:['h1-1']},
            {  name: "Criteria (i) Direct Home - Certificates", testList:['h1'], redirect:{hrefvalue: "direct.home",  hreflabel: "170.315(h)(1)",hrefback:"certification.certh1.main"}},
            {  name: "Criteria (i) Certificate Discovery / Hosting - 2015 DCDT", testList:['h1'], redirect:{hrefvalue: "https://sitenv.org/web/site/direct-certificate-discovery-tool-2015",newWindow: true}},
            {  name: "Criteria (i) Register Direct", testList:['h1'], redirect:{hrefvalue: "direct.register",  hreflabel: "170.315(h)(1)",hrefback:"certification.certh1.main"}},
            {  name: "Criteria (i) Send Direct Message", testList:['h1'], redirect:{hrefvalue: "direct.send", hreflabel: "170.315(h)(1)",hrefback:"certification.certh1.main"}},
            {  name: "Criteria (i) Receive - Message Status", testList:['h1','h2', 'B'], redirect:{hrefvalue: "direct.status", hreflabel: "170.315(h)(1)",hrefback:"certification.certh1.main"}},
            {  name: "Criteria (ii) Delivery Notifications", xdrTest:false, testList:['h1','h2', 'B'], criteria:['h1-1']}
            ];

            if ($scope.filterCrit == "h1"){
				$scope.filterObj = $filter('filter')($scope.criteriaSelection,  {testList: 'h1'});
			}
            if ($scope.filterCrit == "h2"){
				$scope.filterObj = $filter('filter')($scope.criteriaSelection,  {testList: 'h2'});
			}
            if ($scope.paramCri !=null){
                $scope.backToCriteria = $scope.paramCri;
             }else{
                $scope.backToCriteria = 0;
             }
            $scope.selectedItem = $scope.filterObj[$scope.backToCriteria];

            });
            $scope.onCategoryChange= function(selectedItem) {
                 $scope.selectedCrit = $scope.filterObj.indexOf( selectedItem );
                 $scope.testBench =  [];
                 $scope.isXdrTest = selectedItem.xdrTest;
                 $scope.redirectLink = selectedItem.redirect;
                 $scope.openInNewWindow = "";
                 if ($scope.isXdrTest){
                     $scope.testchange = $filter('filter')($scope.xdrTests, {criteria: "'"+selectedItem.criteria+"'"});
                 }else{
                   $scope.testchange = $filter('filter')($scope.smtpTests, {criteria: "'"+selectedItem.criteria+"'"});
                 }
                 $scope.testBench = $scope.testchange;
               if (selectedItem.redirect){
                    $scope.openInNewWindow  = selectedItem.redirect.newWindow;
                    if ($scope.openInNewWindow){
                           window.open(selectedItem.redirect.hrefvalue, '_blank');
                     }else{
                            $state.go(selectedItem.redirect.hrefvalue, {paramsObj:{"prevPage":selectedItem.redirect.hreflabel,"goBackTo":selectedItem.redirect.hrefback,"backToCriteria":$scope.selectedCrit}});
                     }
               }
             };



		$scope.scrollTop = function() {
			$window.scrollTo(0, 0);
		};
		$scope.scrollToId = function(testcaseid) {
			$state.go($scope.testSystem + '.' + $scope.edgeProtocol + '.main');
				$timeout(function() {
					$location.hash("test_" + testcaseid.name);
					$anchorScroll();
				}, 0);
		};

		$scope.displayLog = function(test) {
			$scope.logToDisplay = test;
		};

		$scope.resetTest = function(test) {
			if (!test.testResult.$resolved) {
				test.testResult.cancel();
			}
			test.status = 'na';
		};


		$scope.refreshProfile = function(current) {
			SMTPProfileFactory.query(function(data) {
				if (data.length > 0) {
					$scope.currentProfile = current || data[0];
				} else {
					$scope.currentProfile = {};
					$scope.currentProfile.profileName = "Default Profile";
				}
				$scope.profileList = data;
			});
		};

		$scope.refreshProfile();

		$scope.switchProfile = function(profile) {
			$scope.currentProfile = profile;
		};

		$scope.reset = function() {
			$scope.currentProfile.sutSMTPAddress = "";
			$scope.currentProfile.sutEmailAddress = "";
			$scope.currentProfile.sutUsername = "";
			$scope.currentProfile.sutPassword = "";
			$scope.currentProfile.profileName = "Default Profile " + $scope.profileList.length;
			$scope.refreshProfile($scope.currentProfile);
		};

		$scope.saveProfile = function(profile) {
			SMTPProfileFactory.save(profile, function() {
				growl.success("Profile saved", {});
				$scope.refreshProfile(profile);
			}, function(data) {
				throw {
					code: data.data.code,
					url: data.data.url,
					message: data.data.message
				};
			});
		};

		$scope.removeProfile = function(profile_name) {
			SMTPProfileFactory.removeProf({
				'profile': profile_name
			}, function() {
				growl.success("Profile deleted", {});
				$scope.refreshProfile();
			}, function(data) {
				throw {
					code: data.data.code,
					url: data.data.url,
					message: data.data.message
				};
			});
		};

		$scope.startTest = function(test, fieldInput) {
			// Get CCDA R2 validation objectives if exists
			var ccdaReferenceFilename = "";
			var ccdaValidationObjective = "";
			var fileLink = "";
			if (test.ccdaFileRequired && (!fieldInput.ccdaDocument)){
				throw {
					code: "Error",
					url: "",
					message: "Please select C-CDA Document Type"
               };
			}
			if (fieldInput.ccdaDocument) {
				ccdaReferenceFilename = fieldInput.ccdaDocument.name || "";
				fileLink = fieldInput.ccdaDocument.link || "";
				ccdaValidationObjective = fieldInput.ccdaDocument.path[fieldInput.ccdaDocument.path.length - 1] || "";
			}

			var previousTR = null;
            if (!angular.isUndefined(test.testResult)){
			if (test.testResult.length > 0) {
				if (test.testResult[0].criteriaMet !== "NA") {
					previousTR = test.testResult[0];
				}
			}
             }

			// Get profile info
			$scope.inputForTest = {
				"testCaseNumber": test.id,
				"sutSmtpAddress": $scope.currentProfile.sutSMTPAddress,
				"sutSmtpPort": $scope.sutSmtpPort,
				"tttSmtpPort": $scope.tttSmtpPort,
				"sutEmailAddress": $scope.currentProfile.sutEmailAddress,
				"tttEmailAddress": $scope.tttEmailAddress,
				"useTLS": true,
				"sutCommandTimeoutInSeconds": fieldInput.sutCommandTimeoutInSeconds,
				"sutUserName": $scope.currentProfile.sutUsername,
				"sutPassword": $scope.currentProfile.sutPassword,
				"tttUserName": "",
				"tttPassword": "",
				"tttSmtpAddress": $scope.tttSmtpAddress,
				"startTlsPort": 0,
				"status": test.status,
				"attachmentType": fieldInput.attachmentType,
				"ccdaReferenceFilename": ccdaReferenceFilename,
				"ccdaValidationObjective": ccdaValidationObjective,
				"ccdaFileLink": fileLink,
				"previousResult": previousTR || null
			};

			// Set status to loading for loading UI
			test.status = "loading";

			test.testResult = SMTPTestCases.startTest($scope.inputForTest, function(data) {
				// Set log result
				test.testResult = data;

				// See if the test passed, failed, pending or manual
				test.status = 'success';
				angular.forEach(data, function(res) {
					if (res.criteriaMet === 'FALSE') {
						test.status = 'fail';
					} else if (res.criteriaMet === 'MANUAL') {
						test.status = 'manual';
					} else if (res.criteriaMet === 'STEP2') {
						test.status = 'fetching';
					}
				});
				$scope.logTestData(test);

			}, function(data) {
				test.status = 'fail';
				if (data.data) {
					throw {
						code: data.data.code,
						url: data.data.url,
						message: data.data.message
					};
				}
			});
		};

	$scope.logTestData = function(test) {
			// Save log result to database
			// Get login first
			$scope.userInfo = LogInfo.getUsername();
			$scope.userInfo.$promise.then(function(logData) {
				if (logData.logged) {
					angular.forEach(test.testResult, function(smtpRes) {

						// Transform testRequestResponse
						var testResp = "";
						angular.forEach(smtpRes.testRequestResponses, function(resValue, resKey) {
							testResp += resKey;
						});

						if (test.status === 'fail' || test.status === 'success') {
							var isCriteriaMet = false;
							if (test.status === 'success') {
								isCriteriaMet = true;
							}
							var log = {
								"testCaseNumber": test.name,
								"criteriaMet": isCriteriaMet,
								"testRequestsResponse": testResp,
								"attachments": []
							};

							// Save the log to the profile
							SMTPLogFactory.save({
								'profile': $scope.currentProfile.profileName
							}, log, function(saveResult) {

							}, function(saveData) {
								test.status = 'fail';
								throw {
									code: saveData.data.code,
									url: saveData.data.url,
									message: saveData.data.message
								};
							});
						}

					});
				}
			});
		};

		$scope.getBlob = function(filename, attachment) {
			var contentType = 'text/plain';
			if (filename.indexOf('.xml') > -1) {
				contentType = 'application/xml';
			}
			return new Blob([attachment], {
				type: contentType
			});
		};

	} // end of main function

]);
