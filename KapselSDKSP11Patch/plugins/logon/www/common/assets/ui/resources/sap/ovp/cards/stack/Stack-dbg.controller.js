(function () {
    "use strict";
    /*global sap, jQuery */
    jQuery.sap.require("sap.ovp.ui.ObjectStream");

    sap.ui.controller("sap.ovp.cards.stack.Stack", {
        onInit: function () {
            var oVbox = this.getView().byId("stackContent");
            oVbox.addEventDelegate({
                onclick: this.openStack.bind(this)
            });
        },
        onExit: function(){
            this.oObjectStream.destroy();
        },

        onAfterRendering: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oCardPropsModel = oView.getModel("ovpCardProperties");
            var sEntitySet = oCardPropsModel.getProperty("/entitySet");
            var oMetaModel = oModel.getMetaModel();
            var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
            var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
            var iMaxNumberOfCards = 20;
            this.oObjectStream = new sap.ovp.ui.ObjectStream({
                title: oCardPropsModel.getObject("/category"),
                content: {
                    path: "/" + sEntitySet,
                    length: iMaxNumberOfCards,
                    factory: function (sId, oContext) {
                        var oComponent = sap.ui.component({
                            name: "sap.ovp.cards.quickview",
                            componentData: {
                                model: oModel,
                                settings: {
                                    category: oEntityType.name,
                                    entitySet: sEntitySet
                                }
                            }
                        });

                        var oCardComp = new sap.ui.core.ComponentContainer({component: oComponent});
                        /* we need to override the setBindingContext method as from some reason
                         * when calling it on the container its not set on the inner component
                         */
                        oCardComp.setBindingContext = function(oContext){
                            oComponent.setBindingContext(oContext);
                        };
                        return oCardComp;
                    }
                }
            });

            //Check if we have navigate target, if there is create placeHolder card and set it
            var aIntents = this.getEntityIntents();
            if (aIntents.length > 0) {
                var sAppName = aIntents[0].label;
                var oPlaceHolder = this._createPlaceHolder(sAppName);
                var that = this;

                oPlaceHolder.addEventDelegate({
                    onclick: function () {
                        that.doIntentBasedNavigation(null);
                    }
                });

                this.oObjectStream.setPlaceHolder(oPlaceHolder);
            }

            this.oObjectStream.setModel(oModel);
            var oListBinding = this.oObjectStream.getBinding("content");
            oListBinding.attachDataReceived(function () {
                var nCardCount = oListBinding.getCurrentContexts().length;
                oView.byId("stackSize").setText(nCardCount);
            }, this);
        },

        _createPlaceHolder: function (sAppName) {

            var iIcon = new sap.ui.core.Icon({
                src: "sap-icon://offsite-work",
                layoutData: new sap.m.FlexItemData({growFactor : 1, alignSelf: sap.m.FlexAlignSelf.Center})
            });

            iIcon.addStyleClass("sapOvpStackPlaceHolderIcon");

            var lbAppName = new sap.m.Label({text: sAppName});
            var strText = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("ForMoreContentAppName", [sAppName]);
            var txtText = new sap.m.Text({text: strText});

            lbAppName.addStyleClass("sapOvpStackPlaceHolderAppName");
            txtText.addStyleClass("sapOvpStackPlaceHolderTextLine");

            var oDivVbox = new sap.m.VBox({items: [lbAppName, txtText]});
            oDivVbox.addStyleClass("sapOvpStackPlaceHolderLabelsContainer");

            var oVbox = new sap.m.VBox({items: [iIcon, oDivVbox]});
            oVbox.addStyleClass("sapOvpStackPlaceHolder");

            return oVbox;
        },

        openStack: function () {
            var oListBinding = this.oObjectStream.getBinding("content");
            if (oListBinding.getCurrentContexts().length > 0){
                var cardWidth = this.getView().$().width();
                this.oObjectStream.open(cardWidth);
            }
        }
    });
})();
