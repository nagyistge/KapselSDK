// 3.11.4-SNAPSHOT
var exec = require('cordova/exec'),
    argscheck = require('cordova/argscheck'),
    urlutil = require('cordova/urlutil'),
    OfflineStore = require('./OfflineStore'),
    defaultHttpClient = null,
    openStores = [],
    /**
     * Provides the ability to offline OData services.
     * <br/><br/>
     * The plugin provides the client with the ability to define offline stores for an OData producer.  When an offline store is first opened, it will synchronize with the OData producer.  OData requests made against this plugin will use the available open offline stores.
     * <br/><br/>
     * <b>Requirements</b><br/>
     * <br/>
     * The plugin requires that the datajs JavaScript library is included and available to the application.  If SAPUI5/OpenUI5 is used, you can call the method `jQuery.sap.require("sap.ui.thirdparty.datajs");` otherwise use a script include for the datajs library.
     * <br/><br/>
     * <b>Custom OData httpclient</b><br/>
     * <br/>
     * A custom datajs OData httpclient is provided by the plugin.  This httpclient will resolve requests with the plugin if the service root of the request matches one of the open stores.  The httpclient will fallback to using the original OData.defaultHttpClient if the requests service root does not match any of the currently open stores.
     * <br/><br/>
     * <b>Flushing Modifications</b><br/>
     * <br/>
     * The developer must explicitly call the flush method of a store to send modification to the OData producer.
     * <br/>
     * <b>Refreshing Data</b><br/>
     * <br/>
     * The developer must explicitly refresh their stores to get changes from the OData producer.  The plugin provides a refresh method that can refresh the whole store or a subset of it.
     * @namespace
     * @alias OData
     * @memberof sap
     * @example <caption>Sample offline setup code</caption>
        var properties = {
            "name": "travel",
            "host": "smpserver",
            "port": 8080,
            "serviceRoot" : "connection_name",
            "definingRequests" : {
                "req1" : "/Travelagency"
            },
        }

        // Create the store.  Need to be online the first time this is created.
        var store = sap.OData.createOfflineStore(properties);
        store.open(function() {
            sap.OData.applyHttpClient();
            // Offline OData calls can now be made against datajs.
        }, function(e) {
            alert("Failed to open store!");
        });
     */
    odata = module.exports;

var parseURL = /^(.*):\/\/([^:\/\s]+)?(:[0-9]+)?(.*)$/;
var defaultPorts = {
    http : 80,
    https : 443
};

function getURLInfo(value) {
    var parts = parseURL.exec(value);
    if (parts)
    {
        var port = parts[3] ? parseInt(parts[3].substring(1)) : defaultPorts[parts[1].toLowerCase()];

        return {
            scheme : parts[1],
            host : parts[2] != undefined ? parts[2].toLowerCase() : undefined,
            port : port,
            path : parts[4] != undefined ? parts[4].toLowerCase() : undefined
        };
    }
}

/*
 * Custom OData httpClient that uses the SMP OData API.
 */
var httpClient = {
    request: function (request, success, error) {
        var result = {},
            done = false,
            handle = false;

        result.abort = function () {
            if (done) {
                return;
            }

            done = true;

            error({
                message: "Request aborted"
            });
        };

        var handleTimeout = function () {
            if (!done) {
                done = true;
                error({
                    message: "Request timed out"
                });
            }
        };

        var url = request.requestUri;
        var requestUrlInfo = getURLInfo(url);

        if (requestUrlInfo) {
            for (var i = 0; i < openStores.length; i++) {
                var storeUrlInfo = getURLInfo(openStores[i].serviceUri);

                if (requestUrlInfo.scheme === storeUrlInfo.scheme &&
                    requestUrlInfo.host === storeUrlInfo.host &&
                    requestUrlInfo.port === storeUrlInfo.port &&
                    requestUrlInfo.path.indexOf(storeUrlInfo.path) === 0)
                {
                    handle = true;
                    break;
                }
            }
        }

        if (handle) {
            var timeoutId;
            var failureCallback = function (e) {
                if (!done) {
                    done = true;

                    if (timeoutId) {
                        window.clearTimeout(timeoutId);
                    }

                    error({
                        message: e
                    });
                }
            };

            var successCallback = function (response) {
                if (!done) {
                    done = true;

                    if (timeoutId) {
                        window.clearTimeout(timeoutId);
                    }

                    // Format should be { statusCode: statusCode, statusText: statusText, headers: headers, body: xhr.responseText };
                    response.requestUri = url;

                    if (response.statusCode >= 200 && response.statusCode <= 299) {
                        success(response);
                    } else {
                        error({
                            message: "HTTP request failed",
                            request: request,
                            response: response
                        });
                    }
                }
            };

            if (request.timeoutMS) {
                timeoutId = window.setTimeout(handleTimeout, request.timeoutMS);
            }

            odata.request(request, successCallback, failureCallback);

            return result;
        } else if (defaultHttpClient) {
            // Default back to the original http client if we cannot handle the request.
            return defaultHttpClient.request(request, success, error);
        } else {
            error({
                message: "Request cannot be handled."
            });
        }
    }
};

/**
 * An array of the currently open stores.
 * @type {Array<OfflineStore>}
 */
odata.stores = openStores;

/**
 * Replaces the OData.defaultHttpClient with a custom one that uses the SMP OData native APIs.
 * Requests that don't map to an open store will fallback to using the
 * original `OData.defaultHttpClient`.
 */
odata.applyHttpClient = function() {
    if (window.OData)
    {
        if (window.OData.defaultHttpClient != httpClient)
        {
            defaultHttpClient = window.OData.defaultHttpClient;
            window.OData.defaultHttpClient = httpClient;
        }
    }
    else
    {
        throw Error("window.OData not found. The datajs JavaScript library must be included with the application.");
    }
};

/**
 * Removes the custom httpClient if it has been applied.
 */
odata.removeHttpClient = function() {
    if (window.OData && window.OData.defaultHttpClient === httpClient)
    {
        window.OData.defaultHttpClient = defaultHttpClient;
        defaultHttpClient = null;
    }
};

/**
 * Creates a new OfflineStore object.
 * The store will be available for offline access only after it is open successfully.
 * @param {Object} properties - Properties used for creating the store object.
 * @param {String} properties.name - Used to uniquely identify a store.
 * @param {String} properties.serviceRoot - Identifies the root of an OData service.  This can be relative to the host and should be set to a backend connection name from the server.
 * @param {Object<String, String|{url: String, retrieveStreams: boolean}>} properties.definingRequests - Object that contains the coverage of data as name value pairs. The names are arbitrary and used when performing refreshes with subsets.  The values are OData URLs that represent the coverage of data to be managed by the store.  For media requests, use the value format { "url" : "Drivers", "retrieveStreams" : true }
 * @param {String} properties.host - The host of the server.
 * @param {Number} properties.port - The port of the server.
 * @param {String} properties.urlSuffix - The URL suffix path to the server.
 * @param {Boolean} properties.https - Whether to use HTTP or HTTPS.  Default is HTTP.
 * @param {String} properties.streamParams - Any additional stream parameters.
 * @param {Object} properties.customHeaders - Object that contains the headers to send as name value pairs.
 * @param {Object} properties.customCookies - Object that contains the cookies to send as name value pairs.
 * @param {Boolean} properties.enableRepeatableRequests - If the OData Producer is able to support repeatable requests then enable use of this.
 * @returns {sap.OfflineStore} A new OfflineStore object.
 */
odata.createOfflineStore = function (properties) {
    argscheck.checkArgs('O', 'OData.createOfflineStore', arguments);

    var store = new OfflineStore(properties);

    return store;
};

/**
 * Request success callback that provides the response data.
 * @callback sap.OData~requestSuccess
 * @param {Object} response
 * @param {Number} response.statusCode - The status code of the response.
 * @param {String} response.statusText - The status line of the response.
 * @param {Object} response.headers - Object that contains the response headers as name value pairs.
 * @param {String} response.body - The response data.
 */

/**
 * Request error callback.
 * @callback sap.OData~requestError
 * @param {String} error - The error message.
 */

/**
 * Sends a request containing an OData payload to the current open stores.
 * This method can be used for requests that don't go through the datajs http client.
 *
 * @param {Object} request
 * @param {Object} request.headers - Object that contains the headers as name value pairs.
 * @param {String} request.requestUri  - OData endpoint URI.
 * @param {String} request.method - HTTP method.
 * @param {Object} request.data - Payload of the request.
 * @param {sap.OData~requestSuccess} successCallback - Callback function that is called with the response data.
 * @param {sap.OData~requestError} errorCallback - Callback function this is called if an error occurs.
 */
odata.request = function (request, successCallback, errorCallback) {
    request.requestUri = urlutil.makeAbsolute(request.requestUri);

    exec(successCallback, errorCallback, 'OData', 'request', [request]);
};
