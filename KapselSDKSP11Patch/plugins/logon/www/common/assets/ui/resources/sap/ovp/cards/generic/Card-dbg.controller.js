(function () {
    "use strict";
    /*global sap, jQuery */
    jQuery.sap.require("sap.ovp.cards.ActionUtils");
    var ActionUtils = sap.ovp.cards.ActionUtils;

    sap.ui.controller("sap.ovp.cards.generic.Card", {

        onInit: function () {
            this.getView().byId("ovpCardHeader").attachBrowserEvent("click", this.onHeaderClick.bind(this));
        },
        onAfterRendering: function(){
            var footer = this.getCardPropertiesModel().getProperty("/footerFragment");
            if (footer){
                this._handleActionFooter();
                this._handleCountFooter();
            }
        },
        onHeaderClick: function(){
            //call the navigation with the binded context to support single object cards such as quickview card
            this.doIntentBasedNavigation(this.getView().getBindingContext());
        },
        _handleActionFooter: function(footer){
            var actionFooter = this.getView().byId("ovpActionFooter");
            if (actionFooter) {
                var aActions = actionFooter.getContent();
                //remove the 'ToolbarSpacer'
                aActions = aActions.splice(1, aActions.length);
                var oLayoutData = aActions[0].getLayoutData();
                oLayoutData.setMoveToOverflow(false);
                oLayoutData.setStayInOverflow(false);
                if (aActions.length === 2) {
                    oLayoutData = aActions[1].getLayoutData();
                    oLayoutData.setMoveToOverflow(false);
                    oLayoutData.setStayInOverflow(false);
                }
            }
        },
        _handleCountFooter: function(){
            var countFooter = this.getView().byId("ovpCountFooter");
            if (countFooter) {
                //Gets the card items binding object
                var oItemsBinding = this.getCardItemsBinding();
                if (oItemsBinding) {
                    oItemsBinding.attachDataReceived(function () {
                        var iTotal = oItemsBinding.getLength();
                        var iCurrent = oItemsBinding.getCurrentContexts().length;
                        var countFooterText = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Count_Footer", [iCurrent, iTotal]);
                        countFooter.setText(countFooterText);
                    });
                }
            }
        },

        /**
         * default empty implementation for the count footer
         */
        getCardItemsBinding: function(){
        },

        onActionPress: function(oEvent) {
            var sourceObject = oEvent.getSource(),
                oCustomData = this._getActionObject(sourceObject),
                context = sourceObject.getBindingContext();
            if (oCustomData.type.indexOf("DataFieldForIntentBasedNavigation") !== -1) {
                this.doIntentBasedNavigation(context, oCustomData);
            } else {
                this.doAction(context, oCustomData);
            }
        },
        _getActionObject: function(sourceObject) {
            var aCustomData = sourceObject.getCustomData();
            var oCustomData = {};
            for (var i = 0; i < aCustomData.length; i++) {
                oCustomData[aCustomData[i].getKey()] = aCustomData[i].getValue();
            }
            return oCustomData;
        },

        doIntentBasedNavigation: function (oContext, oIntent) {
            var oParametersPromise,
                oNavArguments,
                oCompactUrlPromise,
                oSupportedPromise,
                oCrossAppNavService = sap.ushell.Container.getService("CrossApplicationNavigation"),
                oEntity = oContext ? oContext.getObject() : null;

            if (!oIntent){
                oIntent = this.getEntityIntents()[0];
            }

            if (oCrossAppNavService && oIntent) {
                oParametersPromise = this._getEntityNavigationParameters(oEntity);
                oParametersPromise.done(function(oParameters) {
                    oNavArguments = {
                        target: {
                            semanticObject: oIntent.semanticObject,
                            action: oIntent.action
                        },
                        params: oParameters
                    };

                    oCompactUrlPromise = oCrossAppNavService.hrefForExternal(oNavArguments, this.getOwnerComponent(), true);
                    oCompactUrlPromise.done(function (sIntent) {
                        oSupportedPromise = oCrossAppNavService.isIntentSupported([sIntent]);
                        oSupportedPromise.done(function (oTargets) {
                            if (oTargets[sIntent].supported) {
                                oCrossAppNavService.toExternal(oNavArguments, this.getOwnerComponent());
                            }
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
            }
        },

        doAction: function (oContext, action) {
            this.actionData = ActionUtils.getActionInfo(oContext, action, this.getEntityType());
            if (this.actionData.allParameters.length > 0) {
                this._loadParametersForm();
            } else {
                this._callFunction();
            }
        },

        getEntityIntents: function (sAnnotationPath) {
            var aIntents = [];
            var oEntityType = this.getEntityType();

            if (!sAnnotationPath){
                sAnnotationPath = 'com.sap.vocabularies.UI.v1.Identification';
            }
            var aRecords = oEntityType[sAnnotationPath];

            for (var i = 0; Array.isArray(aRecords) && i < aRecords.length; i++) {
                if (aRecords[i].RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
                    aIntents.push({
                        semanticObject: aRecords[i].SemanticObject.String,
                        action: aRecords[i].Action.String,
                        label: aRecords[i].Label.String
                    });
                }
            }

            return aIntents;
        },

        getModel: function () {
            return this.getView().getModel();
        },

        getMetaModel: function () {
            return this.getModel().getMetaModel();
        },

        getCardPropertiesModel: function () {
            return this.getView().getModel("ovpCardProperties");
        },

        getEntitySet: function () {
            if (!this.entitySet) {
                var sEntitySet = this.getCardPropertiesModel().getProperty("/entitySet");
                this.entitySet = this.getMetaModel().getODataEntitySet(sEntitySet);
            }

            return this.entitySet;
        },

        getEntityType: function () {
            if (!this.entityType) {
                this.entityType = this.getMetaModel().getODataEntityType(this.getEntitySet().entityType);
            }

            return this.entityType;
        },

        _saveAppState : function(sGlobalFilterDataSuiteFormat) {
            var oDeferred = jQuery.Deferred();
            var oAppState = sap.ushell.Container.getService("CrossApplicationNavigation").createEmptyAppState(this.getOwnerComponent());
            var sAppStateKey = oAppState.getKey();
            var oAppDataForSave = {
                selectionVariant: sGlobalFilterDataSuiteFormat
            };
            oAppState.setData(oAppDataForSave);
            var oSavePromise = oAppState.save();

            oSavePromise.done(function () {
                oDeferred.resolve(sAppStateKey);
            });

            return oDeferred.promise();
        },

        /**
         * Retrieve entity parameters (if exists) and add xAppState from oComponentData.appStateKeyFunc function (if exists)
         * @param oEntity
         * @returns {*}
         * @private
         */
        _getEntityNavigationParameters: function (oEntity) {
            var oDeferred = jQuery.Deferred();
            var result = {};
            var oEntityType;
            var oComponentData = this.getOwnerComponent().getComponentData();
            var oGlobalFilter = oComponentData ? oComponentData.globalFilter : undefined;
            var oSaveAppStatePromise;

            if (oEntity) {
                oEntityType = this.getEntityType();
                var key;

                for (var i = 0; oEntityType.property && i < oEntityType.property.length; i++) {
                    key = oEntityType.property[i].name;
                    if (oEntity.hasOwnProperty(key)) {
                        if (typeof oEntity[key] === "string") {
                            result[key] = oEntity[key];
                        } else if (window.Array.isArray(oEntity[key]) && oEntity[key].length === 1) {
                            result[key] = oEntity[key][0];
                        }
                    }
                }
            }

            if (oGlobalFilter) {
                oSaveAppStatePromise = this._saveAppState(oGlobalFilter.getFilterDataAsString());
                oSaveAppStatePromise.done(function(sAppStateKey) {
                    result["sap-xapp-state"] = sAppStateKey;
                    oDeferred.resolve(result);
                });
                oSaveAppStatePromise.fail(function () {
                    jQuery.sap.log.error("appStateKey is not saved for OVP Application");
                    oDeferred.resolve(result);
                });
            } else {
                oDeferred.resolve(result);
            }

            return oDeferred.promise();
        },

        _loadParametersForm: function() {
            var oParameterModel = new sap.ui.model.json.JSONModel();
            oParameterModel.setData(this.actionData.parameterData);
            var that = this;

            // first create dialog
            var oParameterDialog = new sap.m.Dialog('ovpCardActionDialog', {
                title: this.actionData.sFunctionLabel,
                afterClose: function() {
                    oParameterDialog.destroy();
                }
            }).addStyleClass("sapUiNoContentPadding");

            // action button (e.g. BeginButton)
            var actionButton = new sap.m.Button({
                text: this.actionData.sFunctionLabel,
                press: function(oEvent) {
                    var mParameters = ActionUtils.getParameters(oEvent.getSource().getModel(), that.actionData.oFunctionImport);
                    oParameterDialog.close();
                    that._callFunction(mParameters);
                }
            });

            // cancel button (e.g. EndButton)
            var cancelButton = new sap.m.Button({
                text: "Cancel",
                press: function() {
                    oParameterDialog.close();
                }
            });
            // assign the buttons to the dialog
            oParameterDialog.setBeginButton(actionButton);
            oParameterDialog.setEndButton(cancelButton);

            // preparing a callback function which will be invoked on the Form's Fields-change
            var onFieldChangeCB = function(oEvent) {
                var missingMandatory = ActionUtils.mandatoryParamsMissing(oEvent.getSource().getModel(),that.actionData.oFunctionImport);
                actionButton.setEnabled(!missingMandatory);
            };

            // get the form assign it the Dialog and open it
            var oForm = ActionUtils.buildParametersForm(this.actionData,onFieldChangeCB);

            oParameterDialog.addContent(oForm);
            oParameterDialog.setModel(oParameterModel);
            oParameterDialog.open();
        },

        _callFunction: function(mUrlParameters) {
            var mParameters = {
                batchGroupId: "Changes",
                changeSetId: "Changes",
                urlParameters: mUrlParameters,
                forceSubmit: true,
                context: this.actionData.oContext,
                functionImport: this.actionData.oFunctionImport
            };
            var that = this;
            var oPromise = new Promise(function(resolve, reject) {
                var model = that.actionData.oContext.getModel();
                var sFunctionImport;
                sFunctionImport = "/" + mParameters.functionImport.name;
                model.callFunction(sFunctionImport, {
                    method: mParameters.functionImport.httpMethod,
                    urlParameters: mParameters.urlParameters,
                    batchGroupId: mParameters.batchGroupId,
                    changeSetId: mParameters.changeSetId,
                    headers: mParameters.headers,
                    success: function(oData, oResponse) {
                        resolve(oResponse);
                    },
                    error : function(oResponse) {
                        reject(oResponse);
                    }
                });
            });
            //Todo: call translation on message toast
            oPromise.then(function(oResponse) {
                return sap.m.MessageToast.show(sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Toast_Action_Success"), { duration: 1000});
            }, function(oError) {
                return sap.m.MessageToast.show(sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Toast_Action_Error"), { duration: 1000});
            });
        }
    });
})();