var __defaultTimerId = "FioriLaunchpadTimer";
var __currentTimerId,
    __usage,
    __timeoutId;
var __loadStarted = false;
var __loadFinished = false;

var __returnTypes = {
    STARTED: 'Timer is started',
    STOPPED: 'Timer is stopped',
    ALREADY_STARTED: 'Timer is already started',
    NOT_STARTED: 'Timer hasn\'t been started yet',
    ALREADY_FINISHED: 'Timer is already finished',
    NOT_INITIALIZED: 'Native not initialized',
    UNKNOWN_ERROR: 'Unknown error happened'
};

var __infoTypes = {
    SUCCESS: 'success',
    INTERRUPTED: 'interrupted',
    FAILED: 'failed',
    UNDEFINED: 'undefined'
};

var __executeAction = {
    NOT_FOUND: 'not_found',
    START_LAUNCHPAD_LOAD_TIMER: 'startLaunchpadLoadTimer',
    STOP_LAUNCHPAD_LOAD_TIMER: 'stopLaunchpadLoadTimer'
};

__usage = sap.Usage;

module.exports = {
    startLaunchpadLoadTimer: function(success, fail, args) {
        var _isInitialized = false;
        var _timerId = "";
        var _timeout = 0;

        if (args.length !== 0) {
            _timerId = args[0].id;
            _timeout = args[0].timeout;

            if (typeof _timerId === "undefined") {
                _timerId = "";
                console.log("There is no timer id defined in the LaunchpadTimer. Default value will be used.");
            }

            if (typeof _timeout === "undefined" || isNaN(parseInt(_timeout))) {
                _timeout = 0;
                console.log("No timeout property was defined in the LaunchpadTimer. The timer can only be stopped explicitly.");
            } else {
                _timeout = parseInt(_timeout);
            }
        } else {
            console.log("No properties found in LaunchpadTimer. Default values will be used");
        }

        __usage.isInitialized(function(init) {
            _isInitialized = init;
            if (!_isInitialized) {
                console.log("Usage is not initialized in Fiori Client");
                fail(__returnTypes.NOT_INITIALIZED);
                return;
            }

            if (__loadStarted) {
                console.log("A LaunchpadTimer is already progress, interrupting and starting a new one.");
                stopLoadTimer(0, __infoTypes.INTERRUPTED, function(result) {
                    if (result !== __returnTypes.STOPPED) {
                        console.log("Couldn't stop the ongoing LaunchpadTimer: " + result);
                        fail(result);
                    }
                });
            }

            if (_timerId === "") {
                console.log("No specified timer id, using default: " + __defaultTimerId);
                __currentTimerId = __defaultTimerId;
            } else {
                __currentTimerId = _timerId;
            }

            __usage.timeStart(__currentTimerId, function() {
                if (_timeout > 0) {
                    startTimeout(_timeout);
                }
                __loadStarted = true;
                console.log("Launchpad-timer started");
                success(__returnTypes.STARTED);
            }, function(error) {
                console.log("Error during launchpad-load timer start: " + JSON.stringify(error));
                fail(__infoTypes.FAILED);
            });
        }, function(error) {
            console.log("Error during launchpad-load timer start: " + error);
            fail(__infoTypes.FAILED);
        });
    },

    stopLaunchpadLoadTimer: function(success, fail, args) {
        var _info,
            _stringInfoType;
        var _tileCount = 0;
        var _infoType = __infoTypes.SUCCESS;
        var _isInitialized = false;
        var _infoTypeRecognised = false;

        if (args.length !== 0) {
            _tileCount = args[0].tileCount;
            _stringInfoType = args[0].infoType;

            if (typeof _tileCount === "undefined" || isNaN(parseInt(_tileCount))) {
                _tileCount = 0;
                console.log("There is no tileCount in LaunchpadTimer");
            } else {
                _tileCount = parseInt(_tileCount);
            }

            if (typeof _stringInfoType === "undefined") {
                _infoType = __infoTypes.SUCCESS;
                console.log("There is no type in LaunchpadTimer");
            } else {
                for (var i = Object.keys(__infoTypes).length - 1; i >= 0; i--) {
                    if (Object.keys(__infoTypes)[i].toLowerCase() === _stringInfoType.toLowerCase()) {
                        _infoType = Object.keys(__infoTypes)[i];
                        _infoTypeRecognised = true;
                    }
                }

                if (!_infoTypeRecognised)
                    _infoType = __infoTypes.UNDEFINED;
            }
        } else {
            console.log("No properties found in LaunchpadTimer. Default values will be used");
        }

        if (_infoType === __infoTypes.UNDEFINED) {
            console.log("Undefined launchpad-load info type");
            fail("Undefined info type");
            return;
        }

        __usage.isInitialized(function(init) {
            _isInitialized = init;
            if (!_isInitialized) {
                console.log("Usage is not initialized in Fiori Client");
                fail(__returnTypes.NOT_INITIALIZED);
                return;
            }

            if (!__loadStarted) {
                console.log(__returnTypes.NOT_STARTED);
                fail(__returnTypes.NOT_STARTED);
                return;
            }
            stopLoadTimer(_tileCount, _infoType, function(result) {
                if (result === __returnTypes.STOPPED) {
                    deleteTimeout();
                    success(result);
                } else {
                    fail(result);
                }
            });
        }, function(error) {
            console.log("Check usage initalization failed: " + error);
            fail(__infoTypes.FAILED);
        });
    },
    isLaunchpadTimerRunning: function(success) {
    	success(__loadStarted);
    }
};

function stopLoadTimer(tileCount, type, callback) {
    var _info;

    if (tileCount < 0) {
        console.log(__returnTypes.UNKNOWN_ERROR);
        return __returnTypes.UNKNOWN_ERROR;
    }

    _info = new __usage.InfoType();
    _info.setResult(type);
    if (tileCount > 0) {
        _info.setCase(tileCount.toString());
    }
    deleteTimeout();

    __usage.timeEnd(__currentTimerId, _info, __currentTimerId, function() {
        __loadStarted = false;
        console.log("Launchpad-timer stopped");
        callback && callback(__returnTypes.STOPPED);
    }, function(error) {
        console.log("Error during launchpad-load timer stop: " + JSON.stringify(error));
        callback && callback(__infoTypes.FAILED);
    });
}

function startTimeout(timeout) {
    var _myTimeout = timeout;
    __timeoutId = setTimeout(function() {
        console.log("LaunchpadTimer has timed out");
        stopLoadTimer(0, __infoTypes.FAILED);
    }, _myTimeout);
}

function deleteTimeout() {
    if (typeof __timeoutId !== "undefined") {
        clearTimeout(__timeoutId);
        __timeoutId = undefined;
    }
}

document.addEventListener("pause", function () {
    stopLoadTimer(0, __infoTypes.INTERRUPTED);
}, false);

require("cordova/exec/proxy").add("FioriClient", module.exports);
