(function () {
    "use strict";
    /*global sap, jQuery */

    sap.ui.controller("sap.ovp.cards.list.List", {
        maxValue: -1,
        onInit: function () {
        },

        onListItemPress: function (oEvent) {
            this.doIntentBasedNavigation(oEvent.getSource().getBindingContext());
        },

        normalizeValueToPercentage: function (value) {
            var oEntityType = this.getEntityType(),
                sAnnotationPath = this.getCardPropertiesModel().getProperty("/annotationPath"),
                aRecords = oEntityType[sAnnotationPath],
                context = this.getMetaModel().createBindingContext(oEntityType.$path + "/" + sAnnotationPath);
            if (sap.ovp.cards.AnnotationHelper.isFirstDataPointPercentageUnit(context, aRecords)) {
                return parseInt(value, 10);
            }
            var maxV = this._getMaxValue();
            if (value > maxV) {
                return 100;
            } else {
                var iValue = (parseInt(value, 10) * 100) / maxV;
                if (iValue != 0) {
                    return iValue;
                } else { //if the value is 0 we want to show some minimal value in the bar
                    return 0.5;
                }
            }
        },

        _getMaxValue: function () {
            if (this.maxValue != -1) {
                return this.maxValue;
            }
            var oEntityType = this.getEntityType(),
                sAnnotationPath = this.getCardPropertiesModel().getProperty("/annotationPath"),
                aRecords = oEntityType[sAnnotationPath],
                context = this.getMetaModel().createBindingContext(oEntityType.$path + "/" + sAnnotationPath);
            var dataPointValue = sap.ovp.cards.AnnotationHelper.getFirstDataPointValue(context, aRecords);
            var barList = this.getView().byId("ovpList"),
                listItems = barList.getBinding("items"),
                itemsContextsArray = listItems.getCurrentContexts();

            for (var i = 0; i < itemsContextsArray.length; i++) {
                if (parseInt(itemsContextsArray[i].getObject()[dataPointValue], 10) > this.maxValue) {
                    this.maxValue = parseInt(itemsContextsArray[i].getObject()[dataPointValue], 10);
                }
            }
            return this.maxValue;
        },

        /**
         * Gets the card items binding object for the count footer
         */
        getCardItemsBinding: function() {
            var list = this.getView().byId("ovpList");
            return list.getBinding("items");
        }


    });
})();
