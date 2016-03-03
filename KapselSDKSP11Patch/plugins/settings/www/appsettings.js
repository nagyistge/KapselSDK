
    var exec = require("cordova/exec");
    var serviceVersion = "latest";
    var forceRegistrationServiceVersion = false;

    var getPort = function(port, bSkipDefaultPort){
		if ( port == 0 || port == null || port == "" || port =="0" ){
			return "";
		}
		else {
			if (bSkipDefaultPort){
				//theoretically if an app uses 80 for https or 443 for http, then we cannot skip the port.
				//but assume on one will configure the port in that way. So no need to handle the case.
				if (port == 80 || port == 443){
					return "";
				}
				else{
					return ":"+port;
				}
			}
			else{
				return ":"+port;		
			}
		}
	}


    function _setRegistrationServiceVersion(registrationServiceVersion){
        if(registrationServiceVersion == "v1"){
               serviceVersion = "v1";
               forceRegistrationServiceVersion = true;
        }else if (registrationServiceVersion == "v2"){
               serviceVersion = "v2";
               forceRegistrationServiceVersion = true;
        }else if (registrationServiceVersion == "latest"){
               serviceVersion = "latest";
               forceRegistrationServiceVersion = true;
        }
    }
	
    /* Builds the url from the logon information
     * @private
     */

    function _getConnectionURL(info) {
        var context = info.registrationContext;
        var scheme = context.https ? "https" : "http";
        var host = context.serverHost + getPort(context.serverPort);
        _setRegistrationServiceVersion(context.registrationServiceVersion);
        
        var path = (context.resourcePath ? context.resourcePath : "") +
               (context.farmId ? "/" + context.farmId : "");
        return scheme + "://" + host + (path ? path + "/" : "/") + "odata/applications/" + serviceVersion + "/" + sap.Logon.applicationId + "/Connections('" + info.applicationConnectionId + "')";
    };

    /*
     * Build a uril from the logon informatin for the purpose of creating a new login registatraion id.
     * @private 
    *	/
    function _getConnectionURLForRegistration(info) {
        var context = info.registrationContext;
        var scheme = context.https ? "https" : "http";
        var host = context.serverHost + getPort(context.serverPort);
        var path = (context.resourcePath.length > 0 && context.farmId.length > 0) ? (context.resourcePath + "/" + context.farmId + "/") : "";
        return scheme + "://" + host + (path?path:"/") + "odata/applications/" + serviceVersion + "/" + sap.Logon.applicationId + "/Connections";
    };

        
    /*
     * Makes request to SMP server
     */
	function _request(request, successCallback, errorCallback) {
		_sendRequest(request,
			function (response) {
				if (response && response.status == '404' && forceRegistrationServiceVersion == false) {
					// try with v1 version as fallback
					serviceVersion = "v1";
					_sendRequest(request, successCallback, errorCallback);
				} else {
					successCallback && successCallback(response);
				}
			}, errorCallback);
    }

	/*
	 * Sends request to SMP server
	 */
    function _sendRequest(request, successCallback, errorCallback) {
        var lmSuccess = function (info) {
            var url = _getConnectionURL(info);// + (request.path ? ("/" + request.path) : "");
            var operation = request.method;
            if (operation == 'undefined' || operation == null) {
              operation = "GET";
            }
            
            // Add the headers from the request.
            var headers = { 
              "Accept": "application/json",
              "Content-Type": "application/json",
              "X-SMP-APPCID": info.applicationConnectionId
            };
            
            if (request.headers) {
                for (var headerKey in request.headers) {
                    headers[headerKey] = request.headers[headerKey];
                }
            }
            
            if (cordova.require("cordova/platform").id.indexOf("windows") === 0)  {
              // this seems to be specific to the Windows platform; but not for iOS or Android. Why?
              sap.AuthProxy.sendRequest(operation,
                                      url,
                                      headers,
                                      request.data,
                                      function (response) {
                                          successCallback(response);
                                      },
                                      function (response) {
                                          errorCallback(response);
                                      },
                                      info.registrationContext.user,
                                      info.registrationContext.password,
                                      0,
                                      null
                                      );
            } else {
              sap.Logon.getConfiguration( function(jsonconfig){
                
              var authConfig = JSON.parse(jsonconfig);
              authConfig.handleChallenges = true;
                
              sap.AuthProxy.sendRequest2(operation,
                                      url,
                                      headers,
                                      request.data,
                                      function (response) {
                                          successCallback(response);
                                      },
                                      function (response) {
                                          errorCallback(response);
                                      },
                                      0,
                                      authConfig
                                      );
                          }, function(){}, "authentication");

              }

         }

        var lmError = function () {
            errorCallback({
                statusCode: 0,
                statusText: "Logon failed"
            });
        }

        sap.Logon.unlock(lmSuccess, lmError);
        
    };

    /**
     * Used to access SMP application settings. 
     * @namespace
     * @alias AppSettings
     * @memberof sap
     * @see {@link http://dcx-pubs.sybase.com/index.html#smp0300/en/com.sybase.smp3.developer/doc/html/mdw1371795615579.html|Application Connection Properties}
     */
    module.exports = {

        "applicationConnectionId": "",
        createRegistration: function (successCB, errorCB) {
             _createRegistration(successCB, errorCB);
        },

        startSettings: function (successCB, errorCB, connectionData) {
            module.exports.getConfigPropertyMap(function (args) {
                var uploadLog = args['UploadLogs'];
                var logLevel = args['ConnectionLogLevel']; 
                if ((logLevel != 'NONE') && (uploadLog == true)) {
                    sap.Logger.upload(function () { }, function () { });
                }
                sap.Logger.setLogLevel(logLevel);
                var deviceType = args['DeviceType'];
                                                
                                                
                if (deviceType == undefined || deviceType == null || deviceType.toLowerCase() == 'unknown') {
                    if (device.platform == "iPhone" || device.platform == "iPad" || device.platform == "iPod touch" || device.platform == "iOS") {
                        deviceType = "iOS";
                        
                    } else if (device.platform == "Android") {
                        deviceType = "Android";
                    } else {
                        deviceType = "Windows8";
                    }

                    sap.Settings.setConfigProperty({ "DeviceType": deviceType },
                                function (m) {
                                    sap.Logger.debug("Device Type Update Successful","SMP_SETTINGS_JS",function(m){},function(m){});
                                },
                                function (mesg) {
                                    sap.Logger.debug("Device Type Update failed","SMP_SETTINGS_JS",function(m){},function(m){});
                                });

                };
                var jsonStringValue = JSON.stringify({"data":JSON.stringify(args)});
                successCB(jsonStringValue);
            },
            errorCB
            );
          
       },

/**
 *  This is a private function. End user will not use this plugin directly.
 *  This function gets list of all the blackliste features through featureVector policy from the server.
 *  @private
 * @param {function} successCB Function to invoke if the exchange is successful.
 * @param {function} errorCB Function to invoke if the exchange failed.
 **/
               
allFeatures: function (successCB, errorCB) {
    sap.Logon.unlock(function () {
                     sap.logon.Core.getSecureStoreObject(function (datastr) {
                                                        try {
                                                                var args = JSON.parse(datastr);
                                                                if (args) {
                                                                    var featureVectorPolicyAllEnabled = args['FeatureVectorPolicyAllEnabled'];
                                                                    if (featureVectorPolicyAllEnabled == true) {
                                                                        successCB(null);
                                                                    } else {
                                                                        var featureVector = args.FeatureVectorPolicy;
                                                                        successCB(featureVector);
                                                                    }
                                                                }
                                                                else {
                                                                    successCB(null);
                                                                }
                                                           }
                                                         catch(e) {
                                                                errorCB(e.message);
                                                            }
                                                         },
                                                         
                                                         function () {
                                                            errorCB("Failed to retrive setting information");
                                                         },
                                                         "settingsdata");
                     },
                     function () {
                        errorCB("Failed to get Settings, make sure that you have done logon register succesfully");
                     });
    
    
},
    
/**
 *  This is a private function. End user will not use this plugin directly.
 *  This function gets feature specified in the name parameter.
 *  @private
 * @param (String} name Name of the feature to fetch.
 * @param {function} successCB Function to invoke if the exchange is successful.
 * @param {function} errorCB Function to invoke if the exchange failed.
 **/
               
               
getFeatureForName: function(successCB, errorCB, name) {
    module.exports.allFeatures(
                               function (featureVect) {
                                    if (featureVect == null) {
                                          successCB(null);
                                    } else {
                                            var feature = null;
                                            var vectorList = featureVect.results; //featureVect['features'];
                                            for (i = 0; i < vectorList.length; i++) {
                                              var vectorSubList = vectorList[i]['JSModule'].split(",");
                                              for (j=0; j< vectorSubList.length; j++) {
                               
                                                 if (vectorSubList[j] == name) {
                                                    feature = vectorList[i];
                                                    break;
                                                }
                                              }
                                              if (feature != null) //We have found a match
                                              {
                                                  break;
                                              }
                               
                                            }
                                            successCB(feature);
                                    }
                               },
                               function () {
                                    errorCB("Failed to get feature lists");
                               }
                               );
},
    
    
    /**
         * Retrieves a config property by name.
         * @param {function} successCallback Called with the value of the property.
         * @param {function} errorCallback Called with error object that contains status and statusText.
         * @param {string} name The property name
         * @example
         * sap.AppSettings.getConfigProperty(function(token) {
         *    console.log("DeviceToken: " + token);
         * }, function(error) {
         *    alert("Failed to get setting. Status code" + error.statusCode + " text: " + error.statusText);
         * }, "ApnsDeviceToken");
         */
        getConfigProperty: function (successCallback, errorCallback, name) {
            _request({
                path: name
            }, function (response) {
              var error = false;
              var obj;
              try {
                obj = JSON.parse(response.responseText);
              } catch (e) {
                error = true;
              }

              if (error || typeof obj === "undefined") {
                console.log("[AppSettings][appsettings.js] Parse error in getConfigProperty");
                errorCallback("parse_error");
                return;
              }

              if (typeof obj.d === "undefined") {
                if (typeof obj.error !== "undefined") {
                  console.log("[AppSettings][appsettings.js] Error in getConfigProperty: " + JSON.stringify(obj.error));
                  errorCallback(obj.error);
                }
                else {
                  console.log("[AppSettings][appsettings.js] unknown_error in getConfigProperty");
                  errorCallback("unknown_error");
                }
              }
              else {
                successCallback(obj.d[name]);
              }
            }, errorCallback);
        },

        /**
         * Updates the provided Name-Vaule pairs of config properties.
         * @param {object} nameVals Object that contains name value pairs.
         * @param {function} successCallback Called if set is successful.
         * @param {function} errorCallback Called with error object that contains status and statusText.
         * @example  
         * sap.AppSettings.setConfigProperty({ "ApnsDeviceToken" : "mytoken" }, function() {
         *    console.log("Device token set");
         * }, function(error) {
         *    alert("Failed to set setting. Status code" + error.statusCode + " text: " + error.statusText);
         * });
         */
        setConfigProperty: function (nameVals, successCallback, errorCallback) {
            _request({
                method: "POST",
                headers: {
                    "X-HTTP-METHOD": "MERGE"
                },
                data: JSON.stringify(nameVals)
            }, function (response) {
                successCallback();
            }, errorCallback);
        },

        /*
         * Returns all the settings in Name-Value pairs.
         * @param {function} successCallback Called with object that contains a collection of name value pairs.
         * @param {function} errorCallback Called with error object that contains status and statusText.
         * @example
         * sap.AppSettings.getConfigPropertyMap(function(properties) {
         *    for (var name in properties) {
         *       console.log("Property Name: " + name + " value: " + properties[name]);
         *     }
         * }, function(error) {
         *     alert("Failed to get settings. Status code" + error.statusCode + " text: " + error.statusText);
         * });
         * 
         */
        getConfigPropertyMap: function (successCallback, errorCallback) {
            _request({}, function (response) {
                try {
                    var map = JSON.parse(response.responseText).d;
                delete map["__metadata"]; // remove metadata

                successCallback(map);
                } catch (e) {
                    errorCallback("JSON parse error in config property map! " + e );
                }
            }, errorCallback);
        },

        /**
         * Retrieves the application end-point with which the application can access business data.
         * @param {function} successCallback Called with the value of the ProxyApplicationEndpoint.
         * @param {function} errorCallback Called with error object that contains status and statusText.
         * @example
         * sap.AppSettings.getApplicationEndpoint(function(endpoint) {
         *    console.log("Endpoint: " + endpoint);
         * }, function(error) {
         *    alert("Failed to get setting. Status code" + error.statusCode + " text: " + error.statusText);
         * });
         * 
         */
        getApplicationEndpoint: function (successCallback, errorCallback) {
            module.exports.getConfigProperty("ProxyApplicationEndpoint", successCallback, errorCallback);
        },

        
    };
  

