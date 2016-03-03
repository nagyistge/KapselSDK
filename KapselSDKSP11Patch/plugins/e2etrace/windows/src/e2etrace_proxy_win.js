var exec = require("cordova/exec");

    module.exports = {
        _nativeE2ETraceInstance: new SAP.E2ETrace.EndToEndTrace(),
        startTrace: function (successCB, errorCB, args) {
            transactionName = args[0];
            module.exports._nativeE2ETraceInstance.startTrace(transactionName).then(
             function () {
                 console.log("Trace Started");
                 successCB("Trace started");
             }, function () {
                 console.error("Trace Start Failed");
                 errorCB();
             });
        },

        endTrace: function (successCB, errorCB, args) {
            module.exports._nativeE2ETraceInstance.endTrace().then(
                function () {
                    console.log("Ended trace succesfully");
                    successCB("Trace Stopped")
                },
                function () {
                    console.error("End trace failed");
                    errorCB();
                }
                );
        },
        setTraceLevel: function (successCB, errorCB, args) {
            traceLevel = args[0];
            module.exports._nativeE2ETraceInstance.setTraceLevel(traceLevel).then(
                function()
                {
                    console.log("Set Trace level is successful");
                    successCB();
                },
                function()
                {
                    console.error("Set Trace Level Failed");
                    errorCB();
                }
                );
        },
        traceBefore: function (successCB, errorCB, args) {
            request = JSON.stringify(args[0]);
            module.exports._nativeE2ETraceInstance.traceBefore(request).then(function () {
                console.log("Trace before succesful");
                successCB();
            },
            function () {
                console.error("Trace before failed");
                errorCB();
            });
        },
        traceAfter: function (successCB, errorCB, args) {
            url = args[0]
            request = JSON.stringify(args[1]);
            module.exports._nativeE2ETraceInstance.traceAfter(url, request).then(function () {
                console.log("Trace after successful");
                successCB();
            },
            function () {
                console.error("Trace after failed");
                errorCB();
            });
        },
        uploadTrace: function (successCB, errorCB, args) {
            connectionInfo = JSON.stringify(args[0]);
            module.exports._nativeE2ETraceInstance.uploadTrace(connectionInfo).then(function (response) {
                console.log("Upload log call succeeded : " + response);
                successCB();
            }, 
            function (error) {
                console.error("Upload log call failed: " + error);
                errorCB();
            })
        }
    }
    require("cordova/exec/proxy").add("E2ETrace", module.exports);
