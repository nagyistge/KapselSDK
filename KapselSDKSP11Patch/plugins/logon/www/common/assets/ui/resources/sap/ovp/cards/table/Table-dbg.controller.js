(function () {
    "use strict";
    /*global sap, jQuery */

    sap.ui.controller("sap.ovp.cards.table.Table", {

        onInit: function () {
        },

        onColumnListItemPress: function (oEvent) {
            this.doIntentBasedNavigation(oEvent.getSource().getBindingContext());
        },

        /**
         * Gets the card items binding object for the count footer
         */
        getCardItemsBinding: function() {
            var table = this.getView().byId("ovpTable");
            return table.getBinding("items");
        }
    });
})();
