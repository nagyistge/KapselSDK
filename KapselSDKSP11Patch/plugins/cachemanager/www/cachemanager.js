// 3.11.4-SNAPSHOT
var exec = require('cordova/exec'),
    channel = require('cordova/channel'),
    promptActive = false, // Flag to prevent prompt from displaying more than once
    bundle = null; // Internationalization. Loaded with device ready

    // Event channels for CacheManager
    var channels = {
        'cacheinvalidated': channel.create('cacheinvalidated'),
        'noviewerfound': channel.create('noviewerfound')
    };

    // Holds the dom 0 handlers that are registered for the
    // channels
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
     * The CacheManager plugin provides the ability to cache
     * resources persistently and manage the lifecycle of SAP
     * UI5 resources.<br/> <br/> Using this plugin, you can
     * maximize the performance of online SAP UI5 applications.
     * This is achieved by caching to disk the responses that
     * are received by the webview according to their response
     * headers. CacheManager then maintains and periodically
     * checks for manifest files that tell whether resources for
     * an app has been updated. When an update is found, the
     * cache is purged. <br/> <br/> <b>Adding and Removing the
     * CacheManager</b><br/> The CacheManager plugin is added
     * and removed using the <a
     * href="http://cordova.apache.org/docs/en/edge/guide_cli_index.md.html#The%20Command-line%20Interface">Cordova
     * CLI</a>.<br/> <br/> To add the CacheManager plugin to
     * your project, use the following command:<br/> cordova
     * plugin add kapsel-plugin-cachemanager
     *  <br/> <br/> To remove the
     * CacheManager plugin from your project, use the following
     * command:<br/> cordova plugin rm
     * kapsel-plugin-cachemanager
     *
     * @namespace
     * @alias CacheManager
     * @memberof sap
     */

    // Set default behaviors. These can be overridden by the
    // parameters passed to
    // the goToUrlAndStartCaching function.
    var _shouldEnableSAPUI5LifecycleManagement = true;
    var _shouldEnableCustomCache = true;
    var _checkForUpdatesEvents = ['deviceready', 'resume'];

    module.exports = {
        /**
         * Clear the browser cache.
         *
         * @example sap.CacheManager.clearCache();
         */
        clearCache: function () {
            return exec(_eventHandler, _eventHandler, 'CacheManager', 'clearCache', []);
        },

        /**
         * Initialize the cache manager with the provided URL.
         *
         * @param {string}
         *            url The URL to navigate to. This is
         *            required.
         * @param {Array.<string>}
         *            [checkForUpdatesEvents] Array of
         *            strings representing events that should
         *            trigger a check for application updates.
         * @example sap.CacheManager.setUrl('https://m.sap.de/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html');
         */
        setUrl: function (url,
                           checkForUpdatesEvents) {

            if (typeof url !== 'string') {
                throw 'url must be a string.';
            }
            if (Object.prototype.toString
                .call(checkForUpdatesEvents) === '[object Array]') {
                _checkForUpdatesEvents = checkForUpdatesEvents;
            }
            if (_checkForUpdatesEvents.length === 0 && _shouldEnableSAPUI5LifecycleManagement) {
                throw ('SAP UI5 lifecycle management is enabled, but there are no checkForUpdates events. ' +
                   'Without any checkForUpdates events, lifecycle management can\'t function properly.');
            }

            exec(_eventHandler, _eventHandler, 'CacheManager', 'setUrl', [url]);
        },

        /**
         * Enable the cache manager.
         *
         * @param {boolean} enableCache
         *            Pass false if you do not want to override the default cache.
         * @example sap.CacheManager.setCacheEnabled(true);
         */
        setCacheEnabled: function (enableCache) {
            if (typeof enableCache === 'boolean') {
                _shouldEnableCustomCache = enableCache;

                exec(_eventHandler, _eventHandler, 'CacheManager', 'enableCache', [_shouldEnableCustomCache]);
            }
        },

        /**
         * Enable SAP UI5 life cycle management.
         *
         * @param {boolean}
         *            shouldEnableSAPUI5LifecycleManagement
         *            Pass false if you do not want to check for
         *            application updates.
         * @example sap.CacheManager.setSAPUI5LifecycleManagementEnabled(true);
         */
        setSAPUI5LifecycleManagementEnabled: function (shouldEnableSAPUI5LifecycleManagement) {
            if (typeof shouldEnableSAPUI5LifecycleManagement === 'boolean') {
                _shouldEnableSAPUI5LifecycleManagement = shouldEnableSAPUI5LifecycleManagement;

                // Keep track of UI5 manifest files and
                // invalidate UI5 lifecycle management apps when
                // they're updated.
                exec(_eventHandler, _eventHandler, 'CacheManager', 'enableSAPUI5LifecycleManagement', [_shouldEnableSAPUI5LifecycleManagement]);
            }
        },

        /**
         * Add a listener for an CacheManager event.  See events for available event names.
         * @param {string} eventname Name of the app update event.
         * @param {function} f Function to call when event is fired.
         * @example
         * sap.CacheManager.addEventListener('cacheinvalidated', function(e) {
         *     console.log("Cache invalidated");
         * });
         */
        addEventListener: function (eventname, f) {
            if (eventname in channels) {
                channels[eventname].subscribe(f);
            }
        },

        /**
         * Removes a listener for an CacheManager event.  See events for available event names.
         * @param {string} eventname Name of the app update event.
         * @param {function} f Function that was registered.
         * @example
         * // Adding the listener
         * var listener = function(e) {
         *     console.log("Checking for update");
         * });
         * sap.CacheManager.addEventListener('cacheinvalidated', listener);
         *
         * // Removing the listener
         * sap.CacheManager.removeEventListener('cacheinvalidated', listener);
         */
        removeEventListener: function (eventname, f) {
            if (eventname in channels) {
                channels[eventname].unsubscribe(f);
            }
        },

        setCheckForUpdatesEvents: function (events) {
            if (!events || !Array.isArray(events)) {
                // This function may be called without the 'events' argument
                // just so that the event listeners are added.
                events = _checkForUpdatesEvents;
            }
            _checkForUpdatesEvents.forEach(function(_event) {
                document.removeEventListener(_event, sap.CacheManager.checkForUpdates);
            });
            events.forEach(function(event){
                document.addEventListener(event, sap.CacheManager.checkForUpdates, false);
            });
            _checkForUpdatesEvents = events;

        },

        /**
         * Request new versions of the known manifest files. If a difference
         * is found, invalidate the out dated cached resources.
         */
        checkForUpdates: function () {
            if (!_shouldEnableSAPUI5LifecycleManagement) {
                throw 'checkForUpdates called while SAP UI5 lifecycle management was not enabled.';
            }
            return exec(_eventHandler, _eventHandler, 'CacheManager', 'checkForUpdates', []);
        }

        /**
         * Event fired when CacheManager has it's cache invalidated.
         *
         * @event sap.CacheManager#cacheinvalidated
         * @type {object}
         * @property {string} type - The name of the event. Value
         *           will be cacheinvalidated.
         * @example sap.CacheManager.addEventListener('cacheinvalidated',
         *          function(e) { console.log("Cache is
         *          invalidated"); });
         */

        /**
         * Event fired when CacheManager is unable to display a
         * particular mime type because there is no view for that
         * type installed on the device.
         *
         * @event sap.CacheManager#noviewerfound
         * @type {object}
         * @property {string} type - The name of the event. Value
         *           will be noviewerfound.
         * @example sap.CacheManager.addEventListener('noviewerfound',
         *          function(e) { console.log("No viewer
         *          installed"); });
         */
    };

    // Add getter/setter for DOM0 style events
    for (var type in channels) {
        function defineSetGet(eventType) {
            module.exports.__defineGetter__("on" + eventType,
                function () {
                    return domZeroHandlers[eventType];
                });

            module.exports.__defineSetter__(
                "on" + eventType,
                function (val) {
                    // Remove current handler
                    if (domZeroHandlers[eventType]) {
                        module.exports
                            .removeEventListener(
                                eventType,
                                domZeroHandlers[eventType]);
                    }

                    // Add new handler
                    if (val) {
                        domZeroHandlers[eventType] = val;
                        module.exports
                            .addEventListener(
                                eventType,
                                domZeroHandlers[eventType]);
                    }
                });
        }

        defineSetGet(type);
    }


    //Add default no viewer found implementation
    module.exports.onnoviewerfound = function (parameters) {
        var mimetype = parameters.mimetype;

        function reportNoViewer() {
            window.navigator.notification.alert(bundle.get("noviewer") + mimetype, null, bundle.get("noviewer_title"), bundle.get("ok"));
        }

        if (!bundle) {
            // Load required translations
            var i18n = require('kapsel-plugin-i18n.i18n');
            i18n.load({
                path: "plugins/kapsel-plugin-cachemanager/www"
            }, function(i18nBundle) {
                  bundle = i18nBundle;
                  reportNoViewer();
            });
        } else {
            reportNoViewer();
        }
    };

    //Add default cache invalidated implementation
    module.exports.oncacheinvalidated = function () {

        //do not set a callback method for confirm request, as when fioriclient.js will reloads the html page,
        //and all cordova plugin callback from the current page will become invalid.
        function reportCacheInvalidated() {
            window.navigator.notification.confirm(bundle.get("msg_cache_invalid"), null,
                      bundle.get("title_cache_invalid"), bundle.get("ok"));
        }

        if (!bundle) {
            // Load required translations
            var i18n = require('kapsel-plugin-i18n.i18n');
            i18n.load({
                path: "plugins/kapsel-plugin-cachemanager/www"
            }, function(i18nBundle) {
                bundle = i18nBundle;
                reportCacheInvalidated();
            });
        } else {
            reportCacheInvalidated();
        }
    };

    //Add event listeners so that checkForUpdates is called at the right time.
    document.addEventListener('deviceready', module.exports.setCheckForUpdatesEvents, false);
    
    /* //the below code causes checkForUpdates be called again on deviceready event. It will be removed after verifing the function on all other clients.
     document.addEventListener('deviceready', function () {
		for (var j = 0; j < _checkForUpdatesEvents.length; j++) {
			if (_checkForUpdatesEvents[j] === 'deviceready') {
                module.exports.checkForUpdates();
            }
        }
    });
    */
