// 3.11.4-SNAPSHOT
var exec = require('cordova/exec'),
    channel = require('cordova/channel'),
    logonFired = false, // Flag to determine if logon manager is done
    promptActive = false, // Flag to prevent prompt from displaying more than once
    bundle = null; // Internationalization. Loaded with device ready

// Event channels for AppUpdate
var channels = {
    'checking': channel.create('checking'),
    'noupdate': channel.create('noupdate'),
    'insufficientspace': channel.create('insufficientspace'),
    'updatetoolargeforcellular': channel.create('updatetoolargeforcellular'),
    'downloading': channel.create('downloading'),
    'progress': channel.create('progress'),
    'error': channel.create('error'),
    'updateready': channel.create('updateready')
};

// Holds the dom 0 handlers that are registered for the channels
var domZeroHandlers = {};

// Private callback that plugin calls for events
var _eventHandler = function (event) {
    if (event && event.type) {
        if (event.type in channels) {
            channels[event.type].fire(event);
        }
    }
};

/**
 * Used to provide server-based updates to the application content.
 * <br/><br/>
 * The AppUpdate plugin updates the contents of the www folder of deployed Kapsel
 * applications.  After an application successfully does a logon to an SAP Mobile Platform 3
 * server, the AppUpdate plugin is able to download an available update. See Uploading Hybrid Apps in user documentation
 * for information on how to upload an update to SAP Mobile Platform 3 server.
 * <br/><br/>
 * After an update is completely downloaded, the application user is 
 * prompted to install the update and restart the application.  They can decline
 * if they wish.
 * <br/><br/>
 * Once an update is installed, the application's revision number is updated.
 * <br/><br/>
 * <b>Adding and Removing the AppUpdate Plugin</b><br/>
 * The AppUpdate plugin is added and removed using the
 * <a href="http://cordova.apache.org/docs/en/edge/guide_cli_index.md.html#The%20Command-line%20Interface">Cordova CLI</a>.<br/>
 * <br/>
 * To add the AppUpdate plugin to your project, use the following command:<br/>
 * cordova plugin add kapsel-plugin-appupdate<br/>
 * <br/>
 * To remove the AppUpdate plugin from your project, use the following command:<br/>
 * cordova plugin rm kapsel-plugin-appupdate
 * <br/><br/>
 * 
 * <b>Hybrid App Revision Preference</b><br/>
 * This is an optional preference that tells the AppUdate plugin if the local 
 * assets are uploaded to the server, and at what number.  If this preference is 
 * not provided, the default revision is 0.
 * In your config.xml file you can add the following preference:<br/>
 * <preference name="hybridapprevision" value="1" />
<br/>
<br/>
 * This means that the local assets in your www folder are uploaded to the server 
 * and the server is reporting revision 1 for them.  This allows the application 
 * to receive a delta update when revision 2 is available instead of a full update.
 * <br/><br/>
 *
 * <b>Caveats</b><br/>
 * It is important to test that your update has valid HTML, Javascript, and CSS.  
 * Otherwise, the update could prevent the application from functioning correctly, 
 * and may no longer be updateable.  You can test the updated application in a 
 * separate simulator or additional test device.  You can also validate your 
 * Javascript with tools like <a href="http://www.jslint.com">JSLint</a>, or 
 * <a href="http://www.jshint.com">JSHint</a>.  
 * You can validate CSS with <a href="http://csslint.net">CSS Lint</a>.
 * <br/><br/>
 * 
 * @namespace
 * @alias AppUpdate
 * @memberof sap
 */
module.exports = {
    /**
     * Force an update check.  By default updates are done automatically during logon and resume.
     * See events for what will be fired during this process. 
     * @example
     * sap.AppUpdate.update();
     */
    update: function () {
        // Abort if logon event has not yet fired
        if (logonFired) {
            sap.Logon.unlock(function (connectionInfo) {
                //Add application ID required for REST call
                connectionInfo.applicationId = sap.Logon.applicationId;

                exec(_eventHandler, null, 'AppUpdate', 'update', [connectionInfo]);
            });
        }
    },

    /**
     * Replaces the app resources with any newly downloaded resources.
     * @example
     * sap.AppUpdate.reloadApp();
     */
    reloadApp: function () {
        exec(null, null, 'AppUpdate', 'reloadApp', []);
    },

    /**
     * Removes all local updates and loads the original web assets bundled with the app. Call this after delete registration.
     * Reset calls error callback if called during the update process.
     * @example
     * sap.Logon.core.deleteRegistration(function() { 
     *     sap.AppUpdate.reset();
     * }, function() {});
     */
    reset: function (successCallback, errorCallback) {
        exec(successCallback, errorCallback, 'AppUpdate', 'reset', []);
    },

    /**
     * Add a listener for an AppUpdate event.  See events for available event names.
     * @param {string} eventname Name of the app update event.
     * @param {function} f Function to call when event is fired.
     * @example
     * sap.AppUpdate.addEventListener('checking', function(e) {
     *     console.log("Checking for update");
     * });
     */
    addEventListener: function (eventname, f) {
        if (eventname in channels) {
            channels[eventname].subscribe(f);
        }
    },

    /**
     * Removes a listener for an AppUpdate event.  See events for available event names.
     * @param {string} eventname Name of the app update event.
     * @param {function} f Function that was registered.
     * @example
     * // Adding the listener
     * var listener = function(e) {
     *     console.log("Checking for update");
     * });
     * sap.AppUpdate.addEventListener('checking', listener);
     *
     * // Removing the listener
     * sap.AppUpdate.removeEventListener('checking', listener);
     */
    removeEventListener: function (eventname, f) {
        if (eventname in channels) {
            channels[eventname].unsubscribe(f);
        }
    }

    /**
     * Event fired when AppUpdate is checking for an update.
     *
     * @event sap.AppUpdate#checking
     * @type {object}
     * @property {string} type - The name of the event.  Value will be checking. 
     * @example
     * sap.AppUpdate.addEventListener('checking', function(e) {
     *     console.log("Checking for update");
     * });
     */

    /**
     * Event fired when AppUpdate finds no available updates on server.
     *
     * @event sap.AppUpdate#noupdate
     * @type {object}
     * @property {string} type - The name of the event.  Value will be noupdate. 
     * @example
     * sap.AppUpdate.addEventListener('noupdate', function(e) {
     *     console.log("No update");
     * });
     */

    /**
     * Event fired when AppUpdate does not have enough space to download or apply an update.
     *
     * @event sap.AppUpdate#insufficientspace
     * @type {object}
     * @property {string} type - The name of the event.  Value will be insufficientspace.
     * @example
     * sap.AppUpdate.addEventListener('insufficientspace', function(e) {
     *     console.log("No update");
     * });
     */

   /**
    * Event fired when the device is connected to a non-WIFI network and the size of the update
    * is greater than the value set with the config.xml preference named appUpdateWifiDownloadLimit.
    * That value is in bytes.  For example, to set the limit to 1024 bytes, add the following to config.xml:
    * <preference name="appUpdateWifiDownloadLimit" value="1024"/>
    *
    * @event sap.AppUpdate#updatetoolargeforcellular
    * @type {object}
    * @property {string} type - The name of the event.  Value will be updatetoolargeforcellular.
    * @example
    * sap.AppUpdate.addEventListener('updatetoolargeforcellular', function(e) {
    *     console.log("No update");
    * });
    */

    /**
     * Event fired when AppUpdate has found an update and is starting the download.
     *
     * @event sap.AppUpdate#downloading
     * @type {object}
     * @property {string} type - The name of the event.  Value will be downloading. 
     * @example
     * sap.AppUpdate.addEventListener('downloading', function(e) {
     *     console.log("Downloading update");
     * });
     */

    
    /**
     * Event fired when AppUpdate has made progress downloading the update.
     *
     * @since 3.0.2
     * @event sap.AppUpdate#progress
     * @type {object}
     * @property {string} type - The name of the event.  Value will be progress.
     * @property {boolean} lengthComputable - Specifies whether or not the total size is known.
     * @property {int} loaded - The number of bytes transferred so far.
     * @property {int} total - The total number of bytes of content that will be transferred.  If total size is unknown, this value is zero.
     * @example
     * sap.AppUpdate.addEventListener('progress', function(e) {
     *     if (e.lengthComputable) {
     *          var percent = Math.round(e.loaded / e.total * 100);
     *          console.log("Progress " + percent);
     *     }
     * });
     */
    
    /**
     * Event fired when AppUpdate encounters an error while checking for an update or downloading an update.
     * The status code and status message are provided with this event.
     *
     * @event sap.AppUpdate#error
     * @type {object}
     * @property {string} type - The name of the event.  Value will be error. 
     * @property {int} statusCode - The http error code.
     * @property {string} statusMessage - The http status message.     
     * @example
     * sap.AppUpdate.addEventListener('error', function(e) {
     *     console.log("Error downloading update. statusCode: " + e.statusCode + " statusMessage: " + e.statusMessage);
     * });
     */

    /**
     * Event fired when AppUpdate has a newly downloaded update available.  
     * A default handler is already added to sap.AppUpdate.onupdateready that will ask the user to reload the app.
     * When handling this event you should call sap.AppUpdate.reloadApp() to apply the downloaded update.
     *
     * @event sap.AppUpdate#updateready
     * @type {object}
     * @property {string} type - The name of the event.  Value will be updateready.
     * @property {int} revision - The revision that was downloaded.
     * @example
     *
     * // This will listen for updateready event.  
     * // Note: Use sap.AppUpdate.onupdateready if you want to override the default handler.
     * sap.AppUpdate.addEventListener('updateready', function(e) {
     *     console.log("Update ready");
     * });
     *
     * // Override default handler so that we automatically load the update 
     * // without first prompting the user for permission,
     * sap.AppUpdate.onupdateready = function(e) {
     *     // No notification just reload
     *     console.log("Apply application update...");
     *     sap.AppUpdate.reloadApp();
     * };
     *
     * // Override default handler with custom prompt to warn the user that the 
     * // application is ready to update.
     * sap.AppUpdate.onupdateready = function() {
     *     console.log("Confirming application update…");
     *     navigator.notification.confirm('Update Available',
     *        function(buttonIndex) {
     *            if (buttonIndex === 2) {
     *                console.log("Applying application update…");
     *                sap.AppUpdate.reloadApp();
     *            }
     *        }, 
     *        "Update", ["Later", "Relaunch Now"]);
     * };
     */
};

// Add getter/setter for DOM0 style events
for (var type in channels) {
    function defineSetGet(eventType) {
        module.exports.__defineGetter__("on" + eventType, function () {
            return domZeroHandlers[eventType];
        });

        module.exports.__defineSetter__("on" + eventType, function (val) {
            // Remove current handler
            if (domZeroHandlers[eventType]) {
                module.exports.removeEventListener(eventType, domZeroHandlers[eventType]);
            }

            // Add new handler
            if (val) {
                domZeroHandlers[eventType] = val;
                module.exports.addEventListener(eventType, domZeroHandlers[eventType]);
            }
        });
    }

    defineSetGet(type);
}

// Add default update ready implementation
module.exports.onupdateready = function () {
    if (!promptActive) {
        promptActive = true;

        var onConfirm = function (buttonIndex) {
            promptActive = false;
            if (buttonIndex === 2) {
                // Only reload if we are unlocked
                sap.Logon.unlock(function (connectionInfo) {
                    //Add application ID required for REST call
                    connectionInfo.applicationId = sap.Logon.applicationId;

                    module.exports.reloadApp();
                });
            }
        }

        function confirmUpdate()
        {
            window.navigator.notification.confirm(
                bundle.get("update_available"),
                onConfirm,
                bundle.get("update"), [bundle.get("later"), bundle.get("relaunch_now")]);
        }

        if (!bundle) {
            // Load required translations
            var i18n = require('kapsel-plugin-i18n.i18n');
            i18n.load({
                path: "plugins/kapsel-plugin-appupdate/www"
            }, function(i18nBundle) {
                bundle = i18nBundle;
                confirmUpdate();
            });
        }
        else {
            confirmUpdate();
        }
    }
}

// When logon is ready an update check is started
document.addEventListener("onSapLogonSuccess", function () {
    logonFired = true;
    module.exports.update();
}, false);

document.addEventListener("onSapResumeSuccess", module.exports.update, false);
