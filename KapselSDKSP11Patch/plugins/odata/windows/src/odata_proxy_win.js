var NULL_STRING = "%[NULL]%";
/* Command proxy for Windows */

var xHook = function () {
    var self = this;
    this.isInitialized = false;
    // Use a flag for enabling and disabling the hook rather then disable xhook it self.
    var hookEnabled = false;

    var getUrlInfo = function (url) {
        var parseURL = /^(.*):\/\/([^:\/\s]+)?(:[0-9]+)?(.*)$/;
        var defaultPorts = {
            http: 80,
            https: 443
        };

        var parts = parseURL.exec(url);
        if (parts) {
            var port = parts[3] ? parseInt(parts[3].substring(1)) : defaultPorts[parts[1].toLowerCase()];

            return {
                scheme: parts[1],
                host: parts[2] ? parts[2].toLowerCase() : null,
                port: port,
                path: parts[4] ? parts[4].toLowerCase() : null
            };
        }
    }

    this.isOffline = function (url) {
        var requestUrlInfo = getUrlInfo(url);
        var isOffline = false;
        if (typeof requestUrlInfo !== "undefined") {
            for (var i = 0; i < sap.OData.stores.length; i++) {
                var storeUrlInfo = getUrlInfo(sap.OData.stores[i].serviceUri);

                if (requestUrlInfo.scheme === storeUrlInfo.scheme &&
                    requestUrlInfo.host === storeUrlInfo.host &&
                    requestUrlInfo.port === storeUrlInfo.port &&
                    requestUrlInfo.path.indexOf(storeUrlInfo.path) === 0) {
                    isOffline = true;
                    break;
                }
            }
        }
        return isOffline;
    };

    this.set = function (requestExecution) {
        if (!self.isInitialized) {
            sap.Xhook.before(function (request, callback) {
                if (hookEnabled) {
                    if (self.isOffline(request.url)) {
                        console.log("Redirect to offline store");
                        requestExecution(callback, null, request);
                    } else {
                        console.log("Send to online");
                        callback(request);
                    }
                }
            });
            self.isInitialized = true;
        }
    };

    this.enable = function () {
        sap.Xhook.enable();
        hookEnabled = true;
    }

    this.disable = function () {
        if (sap.OData.stores.length == 0) {
            hookEnabled = false;
        }
    }
}

var sapXHook = new xHook();
// Todo: Handle reequest errors
//var requestErrorCallback;
module.exports = {


    openOfflineStore: function (success, fail, options) {
        // keep it around for flush errors.
        //requestErrorCallback = success;
        console.log("Open offline store");
        var mimeExtensions = new sap.MimeExtensionHandler();
        SAP.ODataOffline.OfflineStore.openStore(function (s) {
            sapXHook.enable();
            sapXHook.set(module.exports.request);
            success(s);
            //success(s, { keepCallback: true });
        },
        function (e) {
            fail(e);
        },
        options[0].serviceUri, // required
        JSON.stringify(options),
        mimeExtensions.listAsJSON()
        );
    },
    close: function (success, fail, args) {
        console.log("Close offline store");
        SAP.ODataOffline.OfflineStore.closeStore(
            function (s) {
                sapXHook.disable();
                success(s);
            },
            function (error) {
                fail(JSON.parse(error));
            },
            args[0]
            );
    },
    /*
        * @param {Object} request.headers - Object that contains the headers as name value pairs.
        * @param {String} request.requestUri  - OData endpoint URI.
        * @param {String} request.method - HTTP method.
        * @param {Object} request.data - Payload of the request. 
    */
    request: function (success, fail, request) {
        console.log("requesting from offline store");
        if (request.body instanceof File) { // Media Resource request
            var file = request.body;
            request.body = "";
            SAP.ODataOffline.OfflineStore.request(function (s) {
                var result = JSON.parse(s);
                if (result.body) {
                    if (result.headers) {
                        if (result.headers["Content-Type"] == "application/json") {
                            result.body = result.body.replace(/"\%\[NULL\]\%"/g, null);
                            result.text = result.body;
                            result.body = JSON.parse(result.body);
                        }
                    }
                }
                if (success) {
                    result.status = parseInt(result.statusCode);
                    success(result);
                } else return result;
            },
                function (error) {
                    fail(JSON.parse(error));
                },
                    JSON.stringify(request),
                    file.msDetachStream().getInputStreamAt(0)
                );
        } else {
            SAP.ODataOffline.OfflineStore.request(function (s) {
                var result = JSON.parse(s);
                if (result.body) {
                    if (result.headers) {
                        if (result.headers["Content-Type"] == "application/json") {
                            // Replace the special null string with a null value.
                            // Windows Runtime cannot pass nulls across javascript-native boundary
                            // native sends a special string which has to be converted to javascript null and viceversa
                            result.body = result.body.replace(/"\%\[NULL\]\%"/g, null);
                            result.text = result.body;
                            result.body = JSON.parse(result.body);
                            result.status = parseInt(result.statusCode);
                        }
                    }
                }
                else {

                    result.text = result.body;
                    result.body = result.body;
                    result.status = parseInt(result.statusCode);


                }
                success(result);
            },
                function (error) {
                    if (fail) {
                        fail(JSON.parse(error));
                    } else
                        return error;
                },
                JSON.stringify(request),
                null);
        }
    },
    refresh: function (success, fail, args) {
        var subset = args[1];
        if (subset == null || subset === "undefined") {
            subset = NULL_STRING;
            console.log("refresh the offline store without subset");
        } else {
            console.log("refresh the offline store with subset");
        }

        SAP.ODataOffline.OfflineStore.refreshStore(
            function (s) {
                success(s);
            },
            function (error) {
                fail(JSON.parse(error));
            },
            args[0],
            JSON.stringify(subset)
            );
    },
    clear: function (success, fail, name) {
        console.log("clear the offline store");
        SAP.ODataOffline.OfflineStore.clearStore(
            function (s) {
                success(s);
            },
            function (error) {
                fail(JSON.parse(error));
            },
            name
        );
    },
    flush: function (success, fail, args) {
        console.log("flush the offline store");
        // Ashwin:
        SAP.ODataOffline.OfflineStore.flushStore(
            function (s) {
                /*
                TODO: Handle request errors.
                var result = JSON.parse(s);
                if (result.errors !== undefined) {
                    
                    for (var i=0;i<result.errors.length;i++) {
                        // invoke the onRequestError callback for each error.
                        requestErrorCallback(result.errors[i], {keepCallback: true});
                    }
                    success("true", { keepCallback: false });
                }
                */
                // now call the callback to complete the flush operation.
                success();
            },
            function (error) {
                fail(JSON.parse(error));
            },
            args[0]
          );
    },
    registerStreamRequest: function (success, fail, args) {
        console.log("Register stream into the offline store");
        SAP.ODataOffline.OfflineStore.registerStreamRequest(
            function (s) {
                success();
            },
            function (error) {
                fail(JSON.parse(error));
            },
            JSON.stringify(args)
          );
    },
    unregisterStreamRequest: function (success, fail, args) {
        console.log("Unregister stream from the offline store");
        SAP.ODataOffline.OfflineStore.unregisterStreamRequest(
            function (s) {
                success();
            },
            function (error) {
                fail(JSON.parse(error));
            },
            JSON.stringify(args)
          );
    },
    getRequestQueueStatus: function (success, fail, args) {
        console.log("Get request queue status from offline store");
        SAP.ODataOffline.OfflineStore.getRequestQueueStatus(
            function (s) {
                success(JSON.parse(s));
            },
            function (error) {
                fail(JSON.parse(error));
            },
            JSON.stringify(args)
          );
    }
} // module.exports

require("cordova/exec/proxy").add("OData", module.exports);

