(function () {
    "use strict";
    /*global sap, jQuery */

    sap.ui.controller("sap.ovp.cards.loading.Loading", {

        onInit: function () {
        },

        onAfterRendering: function(){
            var oView = this.getView();
            oView.addStyleClass("sapOvpLoadingCard");
            setTimeout(function () {
                this.addStyleClass('sapOvpLoadingCardAnimation');
            }.bind(oView), 1000);
            var loadingFooter = oView.byId("ovpLoadingFooter");

            setTimeout(function () {
                loadingFooter.setBusy(true);
            }, 6000);

            setTimeout(function(){
                this.setBusy(false);
                this.setText(sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("cannotLoadCard"));
            }.bind(loadingFooter), 9000);
        }
    });
})();
