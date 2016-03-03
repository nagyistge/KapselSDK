// 3.11.4-SNAPSHOT
var exec = require('cordova/exec');

/**
 * Used to indicate when the app is busy doing something.  It uses the default indeterminite progress indicator
 * for the platorm.
 * 
 * @namespace
 * @alias Online
 * @memberof sap
 */
module.exports = {
    /**
     * Show the busy indicator.
	 * useBusyIndicator must be set to true on config.xml to see the indicator.
     * @example
     * sap.Online.showBusyIndicator();
     */
    showBusyIndicator: function () {
        exec(null, null, 'Online', 'showBusyIndicator', []);
    },

    /**
     * Hide the busy indicator.
     * @example
     * sap.Online.hideBusyIndicator();
     */
    hideBusyIndicator: function () {
        exec(null, null, 'Online', 'hideBusyIndicator', []);
    }
};
