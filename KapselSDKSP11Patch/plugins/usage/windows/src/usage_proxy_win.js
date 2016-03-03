module.exports = {
    // Proxy function
    init: function (success, fail, args) {

        // Subscribing the app lifecycle events
        document.addEventListener('msvisibilitychange', function (e) { module.exports.handleVisibility(e, fail); });
        // Handling the usage initialization async action
        SAP.Usage.Plugin.Usage.initAsync(JSON.stringify(args))
            .then(function () {
                success();
            },
                    function (e) {
                        fail(e);
                    }); 
    },
    log: function (success, fail, args) {
        console.log("log called");

        // logAsync method returns with the timer ID
        SAP.Usage.Plugin.Usage.logAsync(JSON.stringify(args)).then(function (s) {
            success(s);
        },
        function (e) {
            fail(e);
        });

    },
        makeTimer: function (success, fail, key) {
            console.log("makeTimer called");
            SAP.Usage.Plugin.Usage.makeTimer(function (s) {
                success(s);
            },
        function (e) {
            fail(e);
        }, key);
    },
    stopTimer: function (success, fail, args) {
        console.log("stopTimer called");
        SAP.Usage.Plugin.Usage.stopTimerAsync(JSON.stringify(args)).then(
            function () {
                success();
            },
            function (e) {
                fail(e);
            });
    },
        timeStart: function (success, fail, key) {
            console.log("timeStart called");
            SAP.Usage.Plugin.Usage.timeStart(function (timerId) {
                success(timerId);
            },
        function (e) {
            fail(e);
        }, key);
    },
        timeEnd: function (success, fail, args) {
            console.log("timeEnd called");
            SAP.Usage.Plugin.Usage.timeEndAsync(JSON.stringify(args)).then(
                function () {
                    success();
                },
                function (e) {
                    fail(e);
                });
        },
		getReports: function (success, fail, args) {
            console.log("getReports called");
            SAP.Usage.Plugin.Usage.getReportsAsync().then(
                function (s) {
                    // returns with the stored reports as JSON string
                    success(s);
                },
                function (e) {
                    fail(e);
                });
        },
    handleVisibility: function (e, fail) {
        if (document.visibilityState === "hidden")
            // The 'fail' errorhandler equals with the init function errorHandler 
            SAP.Usage.Plugin.Usage.applicationSuspendsAsync().then(null, function (err) { fail(err); });
        else // 'visible'
            // The 'fail' errorhandler equals with the init function errorHandler 
            SAP.Usage.Plugin.Usage.applicationResuming(null, function (err) { fail(err); });
    },
    destroy: function (success, fail) {
        console.log("destroy called");
        SAP.Usage.Plugin.Usage.destroyAsync().then(
                function () {
                    success();
                },
                function (e) {
                    fail(e);
                });
    },
    changeEncryptionKey: function (success, fail, args) {
        console.log("changeEncryptionKey called");
        var arguments = JSON.stringify(args);

        fail("this feature is not supported on Windows.");
        // Data is stored in DataVault and it does not require encryption key
        //SAP.Usage.Plugin.Usage.changeEncryptionKeyAsync(arguments).then(
        //        function () {
        //            success();
        //        },
        //        function (e) {
        //            fail(e);
        //        });
    },
    uploadReport: function (success, fail) {
        console.log("uploadReport called");
        SAP.Usage.Plugin.Usage.uploadReportAsync().then(
                function () {
                    success();
                },
                function (e) {
                    fail(e);
                });
    },
    isInitialized: function (success, fail) {
        console.log("isInitialized called");
        SAP.Usage.Plugin.Usage.isInitialized(function (isInitialized) {
            success(isInitialized);
        },
        function (e) {
            fail(e);
        });
    },
    checkExistence: function (success, fail) {
        console.log("checkExistence called");
        SAP.Usage.Plugin.Usage.checkExistenceAsync().then (
        function (checkExistence) {
            success(checkExistence);
        },
        function (e) {
            fail(e);
        });
    }
}
require("cordova/exec/proxy").add("Usage", module.exports);

