// 3.11.4-SNAPSHOT
var exec = require('cordova/exec'),
	urlutil = require('cordova/urlutil');

/**
 * @class
 * @classdesc Provides methods for interacting with the offline OData store.
 * @memberof sap
 */
var OfflineStore = function(properties) {
    /**
     * The unique name of the store.
     * @type {String}
     * @readonly
     */
    this.name = null;
    
    /**
     * Identifies the root of an OData service.  This can be relative to the host and should be set to a backend connection name from the server.
     * @type {String}
     * @readonly
     */
    this.serviceRoot = null;
    
    /**
     * Object that contains the coverage of data as name value pairs. The names are arbitrary and used when performing  
     * refreshes with subsets.  The values are OData URLs represent the coverage of data to be managed by the store.
     * @type {Object}
     * @readonly
     */
    this.definingRequests = {};
    
    /**
     * The host of the server.
     * @type {String}
     * @readonly
     */
    this.host = null;
    
    /**
     * The port of the server.
     * @type {Number}
     * @readonly
     */
    this.port = 80;
    
    /**
     * The URL suffix path to the server
     * @type {String}
     * @readonly
     */
    this.urlSuffix = null;
    
    /**
     * Whether to use HTTP or HTTPS.  Default is HTTP.
     * @type {Boolean}
     * @readonly
     */
    this.https = false;
    
    /**
     * Any additional stream parameters.
     * @type {String}
     * @readonly
     */
    this.streamParams = null;
    
    /**
     * Object that contains the headers to send as name value pairs.
     * @type {Object}
     * @readonly
     */
    this.customHeaders = {};
    
    /**
     * Object that contains the cookies to send as name value pairs.
     * @type {Object}
     * @readonly
     */
    this.customCookies = {};
    
    /**
     * If the OData Producer is able to support repeatable requests then enable use of this.
     * @type {Boolean}
     * @readonly
     */
    this.enableRepeatableRequests = false;
    
   /**
    * Specifies the maximum number of entities that can be returned in a single read request.
    * @type {Number}
    * @readonly
    */
    this.pageSize = -1;
    
    /**
     * Called when a modification request fails against the OData producer.
     * This can be called multiple times during a single flush if there is a bunch of pending modifications.
     * @type {OfflineStore~requesterror}
     * @example
     * store.onrequesterror = function(error) {
     *    console.log("Error occurred while sending modification to server. " + error);
     * };
     */
    this.onrequesterror = null;
    
    // Set the properties for the store.
    for (var i in properties) {
        if (typeof this[i] !== 'undefined' && properties.hasOwnProperty(i)) {
            this[i] = properties[i];
        }
    }
    
    /**
     * Return path in format "/path"
     * @private
     */
    function formatPath(path)
    {
        if (path && path.indexOf("/") !== 0)
        {
            path = "/" + path;
        }
        
        if (path && path.lastIndexOf("/") === path.length -1)
        {
            path = path.substring(0, path.length - 1);
        }
        
        return path ? path : "";
    }
    
    if (this.serviceRoot.indexOf("http://") === 0 || this.serviceRoot.indexOf("https://") === 0)
    {
        this.serviceUri = this.serviceRoot;
    }
    else
    {
        function isDefault(port)
        {
            return port === 80 || port === 443;
        }
        
        this.serviceUri = (this.https ? "https" : "http") + "://"
               + this.host + (isDefault(this.port) ? "" : (":" + this.port))
               + formatPath(this.urlSuffix) + formatPath(this.serviceRoot);
    }
    
    this.serviceUri = urlutil.makeAbsolute(this.serviceUri);
    
   /**
    * Offline service root that can be used for media entry create requests.
    * This property will be set after the store has been opened.
    * @example
    * // !! Assumes media_file exists as a file input element in the DOM.
    * var file = document.getElementById("media_file").files[0];
    * var xhr = new XMLHttpRequest();
    * // Third paramenter (async) must always be true.
    * xhr.open("POST", store.offlineServiceRoot + "Drivers", true);
    * xhr.setRequestHeader("Accept", "application/json");
    * xhr.onreadystatechange = function() {
    *    if (xhr.readyState === 4) {
    *       if (xhr.status === 201) {
    *          console.log("Media Created");
    *       } else {
    *          console.log("Failed to create media");
    *       }
    *    }
    * }
    * xhr.send(file);
    */
   this.offlineServiceRoot = this.serviceUri + "/";
};

/**
 * Offline store flush error callback.
 * @callback sap.OfflineStore~requesterror
 * @param {String} error - The error message.
 */

/**
 * Offline store success callback.
 * @callback sap.OfflineStore~success
 */

/**
 * Offline store error callback.
 * @callback sap.OfflineStore~error
 * @param {String} error - The error message.
 */

/**
 * Opens the store.
 * The store will be available for offline access only after it is open successfully.
 * @memberof sap.OfflineStore
 * @function open
 * @instance
 * @param {sap.OfflineStore~success} success - Called when store successfully opens.
 * @param {sap.OfflineStore~error} error - Called when store fails to open.
 * @param {Object} [options] - Options used when opening the store object
 * @param {String} [options.storeEncryptionKey] - Key to use to encrypt the local data store.
 */
OfflineStore.prototype.open = function(success, error, options) {
    var self = this;
    
    var win = function(result) {
        // Store events share open success callback.
        if (result && result.event)
        {
            var callback = "on" + result.event;
            if (self[callback]) {
                self[callback](result.message);
            }
        }
        else {
            if (result && result.offlineServiceRoot)
            {
                self.offlineServiceRoot = result.offlineServiceRoot;
            }

            // Remove old instance
            for (var i = 0; i < sap.OData.stores.length; i++) {
                if (self.name === sap.OData.stores[i].name) {
                    sap.OData.stores.splice(i, 1);
                }
            }
            
            sap.OData.stores.push(self);
            success();
        }
    };
    
    exec(win, error, 'OData', 'openOfflineStore', [this, options ? options : {}]);
};

/**
 * Closes the store and releases its resources.
 * Closing the store will attempt to interrupt any operation already occurring against
 * this store, and will block until the other operations have finished.
 * @memberof sap.OfflineStore
 * @function close
 * @instance
 * @param {sap.OfflineStore~success} success - Called when store successfully closes.
 * @param {sap.OfflineStore~error} error - Called when store fails to close.
 */
OfflineStore.prototype.close = function(success, error) {
    var that = this;
        
    var win = function() {
        var index = sap.OData.stores.indexOf(that);
        if (index > -1) {
            sap.OData.stores.splice(index, 1);
        }
        success();
    };
    
    exec(win, error, 'OData', 'close', [this.serviceUri]);    
};

/**
 * Refreshes the store with the OData service.
 * The application must have network connectivity to perform this operation.
 * @memberof sap.OfflineStore
 * @function refresh
 * @instance
 * @param {sap.OfflineStore~success} success - Called when store is successfully refreshed.
 * @param {sap.OfflineStore~error} error - Called if store fails to refresh itself.
 * @param {Array} [subset] - List of the names of the defining requests to refresh.
 */
OfflineStore.prototype.refresh = function(success, error, subset) {
    exec(success, error, 'OData', 'refresh', [this.serviceUri, subset]);    
};

/**
 * Removes the physical store from the filesystem. The store must be closed before clearing.
 * @memberof sap.OfflineStore
 * @function clear
 * @instance
 * @param {sap.OfflineStore~success} success - Called when store is successfully cleared.
 * @param {sap.OfflineStore~error} error - Called if store cannot be cleared.
 */
OfflineStore.prototype.clear = function(success, error) {
    exec(success, error, 'OData', 'clear', [this.name]);  
};

/**
 * Starts sending pending modification requests to the server.
 * The application must have network connectivity to perform this operation.
 * @memberof sap.OfflineStore
 * @function flush
 * @instance
 * @param {sap.OfflineStore~success} success - Called when flush has finished.
 * @param {sap.OfflineStore~error} error - Called if error calling flush.
 */
OfflineStore.prototype.flush = function(success, error) {
    exec(success, error, 'OData', 'flush', [this.serviceUri]);  
};

/**
 * Offline store queue status success callback.
 * @callback sap.OfflineStore~successQueueStatus
 * @param {Object} [status] - Status for the request queue.
 * @param {String} [status.isEmpty] - True if request queue is empty.
 */

/**
 * Returns whether or not the there are any pending requests stored in the request queue that have
 * not yet been flushed.
 * @memberof sap.OfflineStore
 * @function getRequestQueueStatus
 * @instance
 * @param {sap.OfflineStore~successQueueStatus} success - Called with the status of the request queue.
 * @param {sap.OfflineStore~error} error - Called if there was an issue determining queue state.
 */
OfflineStore.prototype.getRequestQueueStatus = function(success, error)
{
    exec(success, error, 'OData', 'getRequestQueueStatus', [this.serviceUri]);
};

/**
 * Registers a request to download an individual media stream.
 * The registered request must be the read link of the media entity (not the media stream).
 * You must refresh the store for the stream to be downloaded.
 * @memberof sap.OfflineStore
 * @function registerStreamRequest
 * @instance
 * @param name an arbitrary and unique name associated with the defining request.  
 * @param resourcePath the path to the media entity
 * @param {sap.OfflineStore~success} success - Called when registration is successful.
 * @param {sap.OfflineStore~error} error - Called if registraion fails.
 */
OfflineStore.prototype.registerStreamRequest = function(name, resourcePath, success, error)
{
    exec(success, error, 'OData', 'registerStreamRequest', [this.serviceUri, name, resourcePath]);
};

/**
 * Unregisters a previously registered stream request
 *
 * @memberof sap.OfflineStore
 * @function unregisterStreamRequest
 * @instance
 * @param name The name of the request to unregister
 * @param {sap.OfflineStore~success} success - Called when unregistration is successful.
 * @param {sap.OfflineStore~error} error - Called if unregistraion fails.
 */
OfflineStore.prototype.unregisterStreamRequest = function(name, success, error)
{
    exec(success, error, 'OData', 'unregisterStreamRequest', [this.serviceUri, name]);
};

module.exports = OfflineStore;