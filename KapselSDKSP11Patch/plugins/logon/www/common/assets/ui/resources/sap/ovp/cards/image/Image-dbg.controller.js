(function () {
    "use strict";
    /*global sap, jQuery */

    sap.ui.controller("sap.ovp.cards.image.Image", {
        onInit: function () {
        },

        onListItemPress: function (oEvent) {
            this.doIntentBasedNavigation(oEvent.getSource().getBindingContext());
        }

    });
})();
