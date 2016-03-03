
var cc = function(msg) {
    console.log("[FioriClient][launchpad.js] " + msg);
};
var isToolbarSupported = function() {
    if (typeof sap === "undefined" || typeof sap.Toolbar === "undefined") {
        cc("Toolbar is not supported");
        return false;
    }
    return true;
};

var fioriURL,
    usageInitialized,
    observer;

var launchpadTimer = function() {

    var checkUsage = function(successCallback, errorCallback) {
        var genSuccessCallback = function() {
            return function(result) {
                if (typeof result === "boolean") {
                    usageInitialized = result;
                    successCallback(result);
                } else {
                    usageInitialized = false;
                    cc("Usage init error: Expected boolean argument, received: " + JSON.stringify(arguments));
                    errorCallback("unknown_error", JSON.stringify(arguments));
                }
            };
        };
        var genErrorCallback = function() {
            return function() {
                usageInitialized = false;
                errorCallback.apply(f, arguments);
            };
        };

        if (typeof usageInitialized !== "undefined") {
            successCallback(usageInitialized);
            return;
        }

        if (typeof sap === "undefined" || typeof sap.Usage === "undefined") {
            usageInitialized = false;
            successCallback(false);
            return;
        } else {
            sap.Usage.isInitialized(genSuccessCallback(), genErrorCallback());
        }
    };

    var startLoadTimer = function(timeout, successCallback, errorCallback) {
        if (typeof successCallback !== "function") successCallback = function() {
            cc("startLoadTimer success");
        };
        if (typeof errorCallback !== "function") errorCallback = function(error) {
            cc("startLoadTimer error: " + JSON.stringify(error));
        };

        if (typeof timeout !== "undefined" && (typeof timeout !== "number" || timeout < 0)) {
            cc("If timeout is specified, it must be a number >= 0. current is: " + typeof timeout);
            return;
        }

        checkUsage(
            function(result) {
                if (result) {
                    var infoObj = {};
                    if (typeof timeout === "number") {
                        infoObj.timeout = timeout;
                    }
                    cordova.exec(successCallback, errorCallback, "FioriClient", "startLaunchpadLoadTimer", [infoObj]);
                } else {
                    errorCallback("usage_not_initialized", "Usage is not initialized.");
                }
            },
            errorCallback
        );
    };

    var stopLoadTimer = function(tileCount, infoType, successCallback, errorCallback) {
        if (typeof successCallback !== "function") successCallback = function() {
            cc("stopLoadTimer success");
        };
        if (typeof errorCallback !== "function") errorCallback = function(error) {
            cc("stopLoadTimer error: " + JSON.stringify(error));
        };

        if (typeof tileCount !== "undefined" && (typeof tileCount !== "number" || tileCount < 0)) {
            errorCallback("if tileCount specified, it must be a number >= 0. current is: " + tileCount);
            return;
        }
        if (typeof infoType !== "undefined" && typeof infoType !== "string") {
            errorCallback("If infoType is given, it must be a string. current is: " + typeof infoType);
            return;
        }

        checkUsage(
            function(result) {
                if (result) {
                    var infoObj = {};
                    if (typeof tileCount === "number") {
                        infoObj.tileCount = tileCount;
                    }
                    if (typeof infoType === "string") {
                        infoObj.infoType = infoType;
                    }
                    cordova.exec(successCallback, errorCallback, "FioriClient", "stopLaunchpadLoadTimer", [infoObj]);
                } else {
                    errorCallback("usage_not_initialized", "Usage is not initialized.");
                }
            },
            errorCallback
        );
    };

    var startLaunchpadObserver = function(errors) {

        var isLaunchpadTimerSupported = function() {
            return (typeof MutationObserver !== 'undefined');
        };

        // MutationObserver is not supported on all platforms (e.g. Android 4.3 and bellow)
        if (!isLaunchpadTimerSupported()) {
            cc('LaunchpadTimer is not supported');
            errors.push("LaunchpadTimer is not supported");
            return false;
        }

        observer = new MutationObserver(function(mutations) {

            var elementsLength = document.getElementsByClassName("sapUshellTile").length;
            if (elementsLength === 0) {
                cc('MutationObserver called');
                return;
            }

            observer.disconnect();
            cc('MutationObserver called - SAPUI5 tile elements (class=sapUshellTile) count: ' + elementsLength);

            stopLoadTimer(elementsLength);
        });

        // configuration of the observer:
        var config = {
            childList: true,
            subtree: true
        };

        observer.observe(document.body, config);
        return true;
    };

    var errors = [];
    if (cordova.platformId.toLowerCase() !== 'windows') {
        if (!startLaunchpadObserver()) {
            cc(JSON.stringify(errors));
        }
    }

    return {
        startLoadTimer: startLoadTimer,
        stopLoadTimer: stopLoadTimer
    };

};
var getFioriURL = function() {
    sap.FioriClient.getFioriURL(function(link) {
        fioriURL = link;
    });

    cordova.exec(function(result) {
        if (!result) {
            if (typeof observer !== undefined && typeof observer.disconnect === "function")
                observer.disconnect();
        }
    }, null, "FioriClient", "isLaunchpadTimerRunning", []);
};

var onDeviceReady = function() {
    if (typeof WinJS !== "undefined" && typeof WinJS.Application !== "undefined") {
        WinJS.Application.addEventListener("onSapLogonSuccess", getFioriURL, false);
    } else {
        document.addEventListener("onSapLogonSuccess", getFioriURL, false);
    }

    if (isToolbarSupported()) {
        sap.Toolbar.addClickListener(function(button) {
            var URLcheck = fioriURL === window.location.href.split('?')[0];
            if (cordova.platformId.toLowerCase() === "windows") {
                URLcheck = document.getElementById("webView").src.split('?')[0] === fioriURL;
            }
            if (button.toLowerCase() === "home" || (button.toLowerCase() === "refresh" && URLcheck)) {
                module.exports.launchpadTimer.startLoadTimer(120000);
            }
        });
    }

};

document.addEventListener("deviceready", onDeviceReady, false);

module.exports = {
    launchpadTimer: launchpadTimer()
};