// 3.11.4-SNAPSHOT 

var cc = function(msg) {
	if (typeof console !== "undefined" && typeof console.log === "function") {
		console.log("[Toolbar][toolbar.js] " + msg);
	}
};

var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec');

var __typeParamForUsage; // If defined, then usage is enabled.
var __itemClickedAfterLastShow = false;

var clickListeners = [];
var clickListenersCount = 0;

function __usageObserver(args) {
    var eventId = args && args[0];
    var itemId = args && args[1];
    var infoType;
    if (eventId === 'itemClick') {
        // Menu item clicked.
        __itemClickedAfterLastShow = true;

        if (typeof sap.Usage !== "undefined" && sap.Usage != null) {
            infoType = new sap.Usage.InfoType();
            infoType.setElement(itemId);
            sap.Usage.log('toolbarEvent', infoType, __typeParamForUsage, function() {}, function() {});
        }

        for (var key in clickListeners) {
            try {
                clickListeners[key](itemId);
            } catch (e) {
                cc("Error in click listener");
            }
        }

    } else if (eventId === 'show') {
        // Toolbar shown.
        __itemClickedAfterLastShow = false;
    } else if (eventId === 'hide' && !__itemClickedAfterLastShow) {
        // Toolbar hidden and no items were clicked.
        if (typeof sap.Usage !== "undefined" && sap.Usage != null) {
            infoType = new sap.Usage.InfoType();
            infoType.setElement('None');
            sap.Usage.log('toolbarEvent', infoType, __typeParamForUsage, function () { }, function () { });
        }
    }
}

/**
 * The Toolbar plugin allows an application to create a native toolbar using JavaScript.
 * On Android, a double tap gesture is used to display/hide the toolbar.
 * On iOS, A long press with 2 fingers will display the toolbar.
 * On Windows Phone 8.1, the toolbar icon is always visible in the right bottom corner. Clicking on this icon will display the toolbar buttons.
 * On Windows 8.1, A right mouse click or Press Windows+Z or Swipe from the top or bottom edge of the screen to display the toolbar. Click anywhere on the screen to hide it.
 * @namespace
 * @alias Toolbar
 * @memberof sap
 */
var toolbar = {
    /**
     * Adds a custom item to the toolbar.
	 * Top placement is not supported on Windows Phone 8.1. In this case the items will be added to the bottom toolbar.
     * @param {Object} item - Properties used for creating the toolbar item.
     * @param {String=} item.id - The identifier of the item. Used only during usage collection. If it's absent then the label is going to be used.
     * @param {String} item.label - The text for the toolbar item.
     * @param {String} item.icon - The name of the icon to display for the toolbar item.  The name is resolved to the platforms assets.
     * @param {number} item.showAsAction - Sets how this item should be display with the Action Bar.  One of `SHOW_AS_ACTION_ALWAYS`, `SHOW_AS_ACTION_IF_ROOM`, or `SHOW_AS_ACTION_NEVER`.  Optionally you may OR the value with `SHOW_AS_ACTION_WITH_TEXT`.  Defaults to `SHOW_AS_ACTION_NEVER`.  Android Only.  
     * @param {Function} callback - Callback function that is invoked when the item is clicked.
     * @example
     * sap.Toolbar.addItem({ "label" : "Refresh", "icon" : "smp_reload", "showAsAction" : sap.Toolbar.SHOW_AS_ACTION_ALWAYS }, function() {
     *     window.location.reload();
     * });
     */
    addItem : function(item, callback) {
        argscheck.checkArgs("of", "toolbar.addItem", arguments);
        exec(callback, null, "toolbar", "add", [item]);
    },
    /**
     * Clears all the custom items from the toolbar.
     * @param {Function} callback - Callback function that is invoked when the clear is finished.
     * @example
     * sap.Toolbar.clear(function() {
     *     console.log("Cleared toolbar");
     * });
     */
    clear : function(callback) {    	
        exec(callback, callback, "toolbar", "clear", []);
    },
    /**
     * Shows the toolbar
     * @example
     * sap.Toolbar.show();
     */
    show : function(callback) {
        exec(callback, callback, "toolbar", "show", []);
    },

    /**
     * Enables collection of Toolbar usage data using the <code>sap.Usage</code> plugin. It will use the specified type to log certain events
     * about how the toolbar is being interacted with by the user. Note that this method fails if the <code>sap.Usage</code> plugin is not present.
     * <p>
     * It's the caller's responsibility to initialize the Usage plugin prior to invoking this method.
     * </p>
     * <p>
     * Invoking this method when usage collection is already enabled has no effect.
     * </p>
     *
     * @param {string} type the type to use when invoking <code>sap.Usage.log()</code>
     * @return {boolean} true if usage collection was enabled, false if it failed because <code>sap.Usage</code> is not present or it was already enabled
     */
    enableUsage: function(type) {
        argscheck.checkArgs('s', 'toolbar.enableUsage', arguments);

        if (!sap.Usage || __typeParamForUsage)
            return false;

        __typeParamForUsage = type;
        exec(__usageObserver, null, 'toolbar', 'setObserver', []);
    },

    /**
     * Disables collection of usage data. Does nothing if it's not enabled.
     */
    disableUsage: function() {},

    addClickListener: function(f) {
    	if (typeof f !== "function") {
    		throw new Error("argument_error", "the click listener must be a function!");
    	}

        f.toolbarClickId = clickListenersCount++;
    	clickListeners.push(f);
    },

    removeClickListener: function(f) {
    	if (typeof f !== "function") {
    		throw new Error("argument_error", "the click listener must be a function!");
    	}
    	if (clickListeners.length === 0) {
    		return;
    	}

    	var fId = f.toolbarClickId;
    	var i = 0;

    	for (i; i<clickListeners.length; i++) {
    		if (clickListeners[i].toolbarClickId === fId) {
    			break;
    		}
    	}

    	if (i < clickListeners.length) {
    		clickListeners.splice(i, 1);
    	}
    },
    /**
     * Always show this item as a button in an Action Bar.  It is recommended that at most 2 items have this set.  Android Only.
     * @constant
     * @type {number}
     */
    SHOW_AS_ACTION_ALWAYS : 2,
    /**
     * Show this item as a button in an Action Bar if the system decides there is room for it.  Android Only.
     * @constant
     * @type {number}
     */
    SHOW_AS_ACTION_IF_ROOM : 1,
    /**
     * Never show this item as a button in an Action Bar.  Android Only.
     * @constant
     * @type {number}
     */
    SHOW_AS_ACTION_NEVER : 0,
    /**
     * When this item is in the action bar, always show it with a text label even if it also has an icon specified.  Android Only.
     * @constant
     * @type {number}
     */
    SHOW_AS_ACTION_WITH_TEXT: 4
};


document.addEventListener("deviceready", function() {
	// If the menu button is pressed, make sure the toolbar is showing
	// (otherwise the menu buttons will not work).
	document.addEventListener("menubutton", function() {
	    toolbar.show();
	}, false);
});

module.exports = toolbar;
