var exec = require('cordova/exec');
var cc = function(msg) {
    if (typeof console !== "undefined" && typeof console.log === "function") {
        console.log("[Usage][usage.js] " + msg);
    }
};

/**
 * Provides usage support.
 *
 * The purpose of this plugin is to enable administrators to view and generate
 * reports on application usage KPI's, across dimensions of device type & version,
 * operating system type & version, and sdk type & version.
 *  
 * @namespace
 * @alias Usage
 * @memberof sap
 */

Usage = function() {
    if (typeof WinJS !== "undefined" && typeof WinJS.Application !== "undefined") {
        WinJS.Application.addEventListener("onSapLogonSuccess", usageInitialization.eventListener, false);
        //WinJS.Application.addEventListener("onSapResumeSuccess", usageInitialization.eventListener, false);
    } else {
        document.addEventListener("onSapLogonSuccess", usageInitialization.eventListener, false);
        //document.addEventListener("onSapResumeSuccess", usageInitialization.eventListener, false);
    }
    /**
     * Initialize usage plugin.
     * @param {String} [uploadEndpoint] fully qualified URL, pointing to the Hana Mobile servers clientusage log upload endpoint, must be not null
     * @param {String} [dataEncryptionKey] encryption key, to encrypt database content, can be null.
     * @param {int} [timeFor3GUpload] time for 3G upload in days.
     * @example
     * sap.Usage.init('', function () { console.log("Initialization success"); }, function (e) { console.log("Initilization Failed"); });
     */
    this.init = function(uploadEndpoint, dataEncryptionKey, timeFor3GUpload, successCallback, errorCallback) {
        // add event listener to application visibility changes
        if (device.platform.toLowerCase() == "android") {
            document.addEventListener('msvisibilitychange', function(e) {
                handleVisibility(e, errorCallback);
            });
        }
        exec(successCallback, errorCallback, "Usage", "init", [uploadEndpoint, dataEncryptionKey, timeFor3GUpload]);
    };

    ///**
    //* Triggers usage data upload. Data upload is automatic with Usage initialization (performed with init
    //*/
    //this.uploadReport = function (successCallback, errorCallback) {
    //    exec(successCallback, errorCallback, "Usage", "uploadReport", []);
    //}

    /**
     * Checks whether the usage was already initialized by calling the Usage.init() method. The result of the check will be returned as argument of the successCallback.    
     * @example
     * sap.Usage.isInitialized(function(result) { console.log("Usage initialization status" + result);}, function(error) {console.log("Something went wrong" + error);});
     */
    this.isInitialized = function(successCallback, errorCallback) {
        exec(successCallback, errorCallback, "Usage", "isInitialized", []);
    };

    /**
     * Checks whether the usage database was initialized. The result of the check will be returned as argument of the successCallback.  
     * sap.Usage.ischeckExistence(function(result) { console.log("Usage database status" + result);}, function(error) {console.log("Something went wrong" + error);});
     */
    this.checkExistence = function(successCallback, errorCallback) {
        exec(successCallback, errorCallback, "Usage", "checkExistence", []);
    };

    /**
     * Deletes the usage database.
     * @example
     * sap.Usage.destroy(function(result) {}, function(error){});
     */
    this.destroy = function(successCallback, errorCallback) {
        exec(successCallback, errorCallback, "Usage", "destroy", []);
    };

    /**
     * Change the data encryption key of the usage database.
     * @param [oldKey] the old key of the usage database, can be null.
     * @param [newKey] the new key of the usage database, can be null.
     * @example
     * sap.Usage.changeEncryptionKey("abc", "123", function(result) {}, function(error) {});
     */
    this.changeEncryptionKey = function(oldKey, newKey, successCallback, errorCallback) {
        exec(successCallback, errorCallback, "Usage", "changeEncryptionKey", [oldKey, newKey]);
    };

    /**
     * Log timestamps for specific events.
     * Upon successful completion the successCallback function will be called with "OK".
     * @param {String} [key] identifies the usage entry, must be not null
     * @param {sap.Usage.InfoType} [info] A value object containing several predefined elements, will be also logged in the record, can be null
     * @param {String} [type] the type of the event, can be null
     * @example
     * var infoType = new sap.Usage.InfoType();
     * infoType.setScreen("1").setView("2").setAction("3");
     * sap.Usage.log("Test logging", infoType, "Sample type", successCallback, errorCallback);
     */
    this.log = function(key, info, type, successCallback, errorCallback) {
        if (typeof key === 'undefined' || key === null) {
            reportUndefinedTimerKey(errorCallback);
            return;
        }

        if (typeof info === 'undefined' || info === null) {
            info = new sap.Usage.InfoType();
        }

        if (typeof type === 'undefined' || type === null) {
            type = "";
        }
        exec(successCallback, errorCallback, "Usage", "log", [key, info, type]);
    };


    /**
     * * Starts a timer with a specific key. If a timer was already started with the same key, a new timer will be initialized. If a timer started Successfully, the timerId will be returned through the successCB callback function
     * parameter.  
     * @param {String} {key} The identifier for the timer, must be not null
     * @example
     * sap.Usage.makeTimer('timerKey', function(timerID) {alert("Timer with key " + timerKey + " and ID " + result + " successfully started."); }, errorCallback);
     */
    this.makeTimer = function(key, successCallback, errorCallback) {
        if (typeof key === 'undefined' || key === null) {
            reportUndefinedTimerKey(errorCallback);
            return;
        }
        exec(successCallback, errorCallback, "Usage", "makeTimer", [key]);
    };

    /**
     * Stop a timer. Multiple stop calls on the same Timer instance is allowed. If the timer object was not initialized correctly, no further result will occur.
     * Upon successful completion the successCallback function will be called with "OK".
     * @param {String} {timerid} The identifier for timer to stop. This value is obtained in the makeTimer call, must be not null
     * @param {sap.Usage.InfoType} {info} A value object containing several predefined elements, will be also logged in the record, can be null
     * @param {String} {type{ type of the recorded event
     * @example
     * var infoType = new sap.Usage.InfoType();
     * infoType.setAction("Timer stopped").setBehavior("normal").setCase("sample");
     * sap.Usage.stopTimer(timerID, infoType, "Sample timer", successCallback, errorCallback);
     */
    this.stopTimer = function(timerid, info, type, successCallback, errorCallback) {
        if (typeof timerid === 'undefined' || timerid === null) {
            reportUndefinedTimerID(errorCallback);
            return;
        }

        if (typeof info === 'undefined' || info === null) {
            info = new sap.Usage.InfoType();
        }

        if (typeof type === 'undefined' || type === null) {
            type = "";
        }
        exec(successCallback, errorCallback, "Usage", "stopTimer", [timerid, info, type]);
    };
    /**
     * Starts a timer with a specific key. If a timer was already started with the same key, a new timer will be initialized and the old timer will be deleted.
     * Upon successful completion the successCallback function will be called with "OK". 
     * @param {String} {key} The key for the timer to create, must be not null.
     * @example sap.Usage.timeStart('keyvalue', successCallback, errorCallback);
     */
    this.timeStart = function(key, successCallback, errorCallback) {
        if (typeof key === 'undefined' || key === null) {
            reportUndefinedTimerKey(errorCallback);
            return;
        }
        exec(successCallback, errorCallback, "Usage", "timeStart", [key]);
    };

    /**
     * Stops the timer identified by the key argument. If the timer was already stopped by a previous method call, or the timer was not initialized by timeStart, no further result
     * will occur. Upon successful completion the successCallback function will be called with "OK".
     * @param {String} {key} The key for the timer to end, must be not null.
     * @param {sap.Usage.InfoType} {info} A value object containing several predefined elements. The content of the info, will be also stored in the record, to allow more specific queries. Can be null.
     * @param {String} {type} type of the recorded event, can be null
     * @example
     * infoType.setView("Custom View").setResult("Time end called");
     * sap.Usage.timeEnd(timerKey, infoType, "Timer", successCallback, errorCallback);
     */
    this.timeEnd = function(key, info, type, successCallback, errorCallback) {
        if (typeof key === 'undefined' || key === null) {
            reportUndefinedTimerKey(errorCallback);
            return;
        }

        if (typeof info === 'undefined' || info === null) {
            info = new sap.Usage.InfoType();
        }

        if (typeof type === 'undefined' || type === null) {
            type = "";
        }
        exec(successCallback, errorCallback, "Usage", "timeEnd", [key, info, type]);
    };

    /**
     * Returns Json representation of every Usage data stored locally in the argument of the success callback.
     * @example
     * sap.Usage.getReports(function(reports) { console.log(reports); }, errorCallback);
     */
    this.getReports = function(successCallback, errorCallback) {
        exec(successCallback, errorCallback, "Usage", "getReports", []);
    };
    /**
     * @constructor sap.Usage.InfoType
     * @example
     * sap.Usage.InfoType();
     */
    this.InfoType = function() {
        var i_screen, i_view, i_element, i_action, i_behavior, i_case, i_type, i_category, i_result, i_unit, i_measurement, i_value;

        /**
         *Set a value to the i_screen variable.
         *@param {String} new value.        
         *@example
         *sap.Usage.InfoType.setScreen("main_window");
         */
        this.setScreen = function(value) {
            this.i_screen = value;
            return this;
        };

        /**
         *Set a value to the i_view variable.
         *@param {String} new value.
         *@example
         *sap.Usage.InfoType.setView("main_view");
         */
        this.setView = function(value) {
            this.i_view = value;
            return this;
        };

        /**
         *Set a value to the i_element variable.
         *@param {String} new value.
         *@example
         *sap.Usage.InfoType.setElement("button");
         */
        this.setElement = function(value) {
            this.i_element = value;
            return this;
        };

        /**
         *Set a value to the i_action variable.
         *@param {String} new value.
         *@example
         *sap.Usage.InfoType.setAction("button pressed");
         */
        this.setAction = function(value) {
            this.i_action = value;
            return this;
        };

        /**
         *Set a value to the i_behavior variable.
         *@param {String} new value.
         *@example
         *sap.Usage.InfoType.setBehavior("friendly");
         */
        this.setBehavior = function(value) {
            this.i_behavior = value;
            return this;
        };

        /**
         *Set a value to the i_case variable.
         *@param {String} new value.
         *@example
         *sap.Usage.InfoType.setCase("first case");
         */
        this.setCase = function(value) {
            this.i_case = value;
            return this;
        };

        /**
         *Set a value to the i_type variable.
         *@param {String} new value.
         *@example
         *sap.Usage.InfoType.setType("custom");
         */
        this.setType = function(value) {
            this.i_type = value;
            return this;
        };

        /**
         *Set a value to the i_category variable.
         *@param {String} new value.
         *@example
         *sap.Usage.InfoType.setCategory("unknown");
         */
        this.setCategory = function(value) {
            this.i_category = value;
            return this;
        };

        /**
         *Set a value to the i_result variable.
         *@param {String} new value.
         *@example
         *sap.Usage.InfoType.setResult("1234");
         */
        this.setResult = function(value) {
            this.i_result = value;
            return this;
        };
        /**
         *Set a value to the i_unit variable.
         *@param {String} new value.
         *@example
         *sap.Usage.InfoType.setUnit("IS");
         */
        this.setUnit = function(value) {
            this.i_action = value;
            return this;
        };
        /**
         *Set a value to the i_measurement variable.
         *@param {String} new value.
         *@example
         *sap.Usage.InfoType.setMeasurement("main_window");
         */
        this.setMeasurement = function(value) {
            this.i_measurement = value;
            return this;
        };
        /**
         *Set a value to the i_value variable.
         *@param {String} new value.
         *@example
         *sap.Usage.InfoType.setValue("main_window");
         */
        this.setValue = function(value) {
            this.i_value = value;
            return this;
        };
    };
};

reportUndefinedTimerKey = function(errorCallback) {
    errorCallback("Timer key must be not null.");
};

reportUndefinedTimerID = function(errorCallback) {
    errorCallback("Timer ID must be not null.");
};

handleVisibility = function(e, errorCallback) {
    if (document.visibilityState === "hidden")
        exec(successCallback, errorCallback, "Usage", "closeUserSession", []);
    else
        exec(successCallback, errorCallback, "Usage", "startUserSession", []);
};

var usageInitialization = function() {
    // Used by the SAP LOGON events, passing the registration object as argument
    var eventListener = function() {
        var registrationObj;
        try {
            registrationObj = arguments[0].detail.args[0];
        } catch (e) {
            cc("No registration object in onSapLogonSuccess event");
            return;
        }

        var prepareForInit = function(registrationObj, successCallback, errorCallback) {
            if (typeof successCallback === "undefined") successCallback = function() {};
            if (typeof errorCallback === "undefined") errorCallback = function() {
                if (arguments.length > 0) {
                    cc(JSON.stringify(aguments));
                } else {
                    cc("Error during Usage initialization");
                }
            };
            if (typeof registrationObj !== "object") {
                errorCallback("Invalid registration object type: " + typeof registrationObj);
                return;
            }
            if (typeof registrationObj.registrationContext === "undefined" || registrationObj.registrationContext.serverHost === "undefined") {
                errorCallback("Invalid registration object");
                return;
            }

            var usageIsEnabled = function() {

                var getState = function() {

                    var dataVauiltUnlock = function() {
                        sap.logon.Core.unlockSecureStore(
                            function(context, state) {
                                dvIsOpen();
                            },
                            function(error) {
                                console.log("An error occurred during unlockSecureStore: " + JSON.stringify(error));
                                errorCallback(error);
                            }, {
                                // TODO: What will be the passcode?
                                unlockPasscode: 'unlockPasscode'
                            }
                        );
                    };

                    var dvIsOpen = function() {
                        var keyUsageEncryptionKey = "usageEncryptionKey";

                        var usageInit = function(encryptionKey) {
                            var host = registrationObj.registrationContext.serverHost;
                            var port = registrationObj.registrationContext.serverPort ? ":" + registrationObj.registrationContext.serverPort : "";
                            var prot = registrationObj.registrationContext.https ? 'https' : 'http';
                            var path = (registrationObj.registrationContext.resourcePath ? registrationObj.registrationContext.resourcePath : "") + (registrationObj.registrationContext.farmId ? "/" + registrationObj.registrationContext.farmId : "") + '/clientusage';
                            var uploadUrl = prot + '://' + host + port + path;
                            var timeFor3GUpload = 3;

                            var doHttpsConversionIfNeeded = function(url, callback) {
                                if (device.platform.toLowerCase().indexOf("android") >= 0) {
                                    sap.AuthProxy.isInterceptingRequests(function(isInterceptingRequests) {
                                        if (isInterceptingRequests && url.toLowerCase().indexOf("https") === 0) {
                                            // Since AuthProxy is intercepting the request, make sure it is sent initially with http.
                                            // When AuthProxy sends the request over the network, it will be converted to https
                                            // (since we are calling the addHTTPSConversionHost function with the fiori URL).
                                            var splitArray = url.split('://');
                                            splitArray.shift();
                                            url = "http://" + splitArray.join('://');
                                            httpsConversionInEffect = true;
                                            sap.AuthProxy.addHTTPSConversionHost(function() {
                                                callback(url);
                                            }, function() {
                                                callback(url);
                                            }, url);
                                        } else {
                                            httpsConversionInEffect = false;
                                            callback(url);
                                        }
                                    });
                                } else {
                                    callback(url);
                                }
                            };

                            doHttpsConversionIfNeeded(uploadUrl, function(uploadEndpoint) {
                                //
                                // Prepare-flow end
                                //
                                console.log("fioriclient.js handleUsage() sap.Usage.init(" + uploadEndpoint + ")");
                                successCallback(uploadEndpoint, encryptionKey, timeFor3GUpload);
                            });
                        };

                        var gotEncryptionKey = function(encryptionKey) {
                            sap.Usage.checkExistence(
                                function(exists) {
                                    if (exists) {
                                        sap.Usage.destroy(
                                            function() {
                                                usageInit(encryptionKey);
                                            },
                                            function(error) {
                                                console.log("An error occurred during destroy: " + JSON.stringify(error));
                                                errorCallback(error);
                                            }
                                        );
                                    } else {
                                        usageInit(encryptionKey);
                                    }
                                },
                                function(error) {
                                    console.log("An error occurred during checkExistence: " + JSON.stringify(error));
                                    errorCallback(error);
                                }
                            );
                        };

                        sap.logon.Core.getSecureStoreObject(
                            function(encryptionKey) {
                                if (!encryptionKey) {
                                    cordova.exec(function(encryptionKey) {
                                        sap.logon.Core.setSecureStoreObject(
                                            function() {
                                                gotEncryptionKey(encryptionKey);
                                            },
                                            function(error) {
                                                console.log("An error occurred during setSecureStoreObject: " + JSON.stringify(error));
                                                errorCallback(error);
                                            },
                                            keyUsageEncryptionKey,
                                            encryptionKey
                                        );
                                    }, errorCallback, "Usage", "getRandomBytes", []);
                                } else {
                                    usageInit(encryptionKey);
                                }
                            },
                            function(error) {
                                console.log("An error occurred during getSecureStoreObject: " + JSON.stringify(error));
                                errorCallback(error);
                            },
                            keyUsageEncryptionKey
                        );
                    };

                    sap.logon.Core.getState(
                        function(state) {
                            if (state.secureStoreOpen) {
                                dvIsOpen();
                            } else {
                                // datavault unlock
                                dataVauiltUnlock();
                            }
                        },
                        function(error) {
                            // it can happen only if sap.logon.Core is not initialized
                            // error = {code:2, domain: "MAFLogonCoreCDVPlugin"}
                            console.log("An error occurred during get state from store: " + JSON.stringify(error));
                            errorCallback(error);
                        }
                    );
                };

                module.exports.isInitialized(
                    function(initialized) {
                        if (!initialized) {
                            getState();
                        } else {
                            // Usage is already initialized
                            successCallback(true);
                        }
                    },
                    function(error) {
                        console.log("Error occurred at sap.Usage.isInitialized: " + JSON.stringify(error));
                        errorCallback(error);
                    }
                );
            };

            sap.Settings.getConfigProperty(
                function(enable) {
                    if (enable) {
                        usageIsEnabled();
                    } else {
                        // Usage is not enabled
                        successCallback(false);
                    }
                },
                function(error) {
                    sap.Logger.error("Failed to get setting. Status code" + error.statusCode + " text: " + error.statusText);
                    errorCallback(error);
                },
                "CollectClientUsageReports"
            );
        };

        var fireUsageReadyEvent = function(eventId, args) {
            if (typeof eventId === 'string') {

                if (!window.CustomEvent) {
                    window.CustomEvent = function(type, eventInitDict) {
                        var newEvent = document.createEvent('CustomEvent');
                        newEvent.initCustomEvent(
                            type, !!(eventInitDict && eventInitDict.bubbles), !!(eventInitDict && eventInitDict.cancelable), (eventInitDict ? eventInitDict.detail : null));
                        return newEvent;
                    };
                }

                /* Windows8 changes */
                if (cordova.require("cordova/platform").id.indexOf("windows") === 0) {
                    WinJS.Application.queueEvent({
                        type: eventId,
                        detail: {
                            'id': eventId,
                            'args': args
                        }
                    });
                } else {
                    var event = new CustomEvent(eventId, {
                        'detail': {
                            'id': eventId,
                            'args': args
                        }
                    });
                    setTimeout(function() {
                        document.dispatchEvent(event);
                    }, 0);
                }
            } else {
                throw 'Invalid eventId: ' + typeof eventId;
            }
        };

        var prepareForInitDone = function() {

            var uploadEndpoint = arguments[0],
                encryptionKey = arguments[1],
                timeFor3GUpload = arguments[2];

            if (arguments.length === 0) {
                cc("Error: Prepare for init returned no arguments");
                return;
            }

            if (typeof arguments[0] === "boolean") {
                if (arguments[0]) {
                    fireUsageReadyEvent("onUsageInitialized", true);
                } else {
                    fireUsageReadyEvent("onUsageInitialized", false);
                }
                return;
            }

            if (arguments.length !== 3) {
                cc("Wrong set of arguments for usage init! " + JSON.stringify(arguments));
                return;
            }

            // sap.Usage.init
            module.exports.init(
                uploadEndpoint,
                encryptionKey,
                timeFor3GUpload,
                function() {
                    fireUsageReadyEvent("onUsageInitialized", true);
                },
                function() {
                    cc("Usage init error: " + JSON.stringify(arguments));
                    fireUsageReadyEvent("onUsageInitialized", false);
                }
            );
        };

        prepareForInit(registrationObj, prepareForInitDone, function() {
            cc(JSON.stringify(arguments));
            fireUsageReadyEvent("onUsageInitialized", false);
        });

    };

    return {
        eventListener: eventListener
    };

}();
module.exports = new Usage();
