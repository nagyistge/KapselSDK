(function () {
    "use strict";
    /*global sap, jQuery */

    jQuery.sap.require("sap.ui.model.odata.ODataUtils");
    jQuery.sap.require("sap.ovp.cards.generic.Component");

    sap.ui.controller("sap.ovp.app.Main", {
        oCardsModels: {},
        oLoadedComponents: {},

        onInit: function () {
        },

        //clarify with UI5 Core: why can view models not be accessed in onInit?
        onBeforeRendering: function () {
        },

        onAfterRendering: function(){
            var oView = this.getView();
            this._initGlobalFilter();
            var oUIModel = oView.getModel("ui");
            var cards = oUIModel.getProperty("/cards");
            var sBaseUrl = oUIModel.getProperty("/baseUrl");

            cards.forEach(function (oCard, index) {
                this.createLoadingCard(oCard);
                oCard.settings.baseUrl = sBaseUrl;
                this._initCardModel(oCard.model);
                this._loadCardComponent(oCard.template);
            }, this);

            setTimeout(function(){
                cards.forEach(function (oCard, index) {
                    this.createCard(oCard);
                }, this);
            }.bind(this), 1500);


            if (sap.ui.Device.system.phone) {
                jQuery.sap.require("sap.ovp.ui.SmartphoneHeaderToggle");
                sap.ovp.ui.SmartphoneHeaderToggle.enable(this);
            }
        },

        verifyGlobalFilterLoaded: function(){
            if (this.globalFilter.search()) {
                return true;
            }
            //else make sure filter is open so user will see the required field
            return false;
        },

        /**
         * Register to the filterChange event of the filter bar in order to mark that
         * one or more of the filters were changed
         */
        onGlobalFilterChange: function(){
            this.filterChanged = true;
        },

        /**
         * Register to the search event of the filter bar in order to refresh all models
         * with the changes in the filter bar (if there are changes) when "go" is clicked
         */
        onGlobalFilterSearch: function(){
            if (this.filterChanged){
                var sBatchGroupId = "ovp-" + new Date().getTime();
                for (var modelKey in this.oCardsModels){
                    if (this.oCardsModels.hasOwnProperty(modelKey)){
                        this.oCardsModels[modelKey].refresh(false, false, sBatchGroupId);
                    }
                }
                this.filterChanged = false;
            }
        },

        _initGlobalFilter: function(){
            this.globalFilter = this.getView().byId("ovpGlobalFilter");
            if (!this.globalFilter){
                return;
            }

            this.oGlobalFilterLodedPromise = new Promise(function (resolve, reject){
                this.globalFilter.attachAfterVariantLoad(function(){
                    if (this.verifyGlobalFilterLoaded()){
                        resolve();
                    }
                }, this);

                this.globalFilter.attachInitialise(function(){
                    // in case no variant is selected by user then the attachAfterVariantLoad
                    //event is not fired, therefore we check if there is no variant we
                    //call the verification here
                    if (!this.globalFilter.getCurrentVariantId()) {
                        if (this.verifyGlobalFilterLoaded()){
                            resolve();
                        }
                    }
                }, this);
                this.globalFilter.attachSearch(function(){
                    //If user pressed GO, it means that the required field varification
                    //was allredy done by the globalFilter, therefore we can resolve the promise.
                    //This is needed in case some required field was empty and therefore the promise
                    //object was not resolved in the initial flow, we have to do it now after user
                    //set the filter
                    resolve();

                    this.onGlobalFilterSearch();
                }, this);
                this.globalFilter.attachFilterChange(this.onGlobalFilterChange, this);
            }.bind(this));
        },

        _loadCardComponent: function(sComponentName){
            if (!this.oLoadedComponents[sComponentName]) {
                this.oLoadedComponents[sComponentName] = sap.ui.component.load({
                    name: sComponentName,
                    url: jQuery.sap.getModulePath(sComponentName),
                    async: true
                });
            }
        },

        _initCardModel: function(sCardModel){
            if (this.oCardsModels[sCardModel]){
                return;
            }
            this.oCardsModels[sCardModel] = this.getView().getModel(sCardModel);
            this.oCardsModels[sCardModel].setUseBatch(true);
            if (this.globalFilter){
                this._overrideCardModelRead(this.oCardsModels[sCardModel]);
            }
        },



        toggleFilterBar: function toggleFilterBar() {
            function toOpenState(jqGlobalFilter, jqGlobalFilterWrapper, height) {
                jqGlobalFilterWrapper.height(height);
                jqGlobalFilter.css('top', 0);
            }
            function toCloseState(jqGlobalFilter, jqGlobalFilterWrapper, height) {
                jqGlobalFilterWrapper.height(0);
                jqGlobalFilter.css("top", "-" + height + "px");
            }

            var isVisible = this.globalFilter.getVisible();

            if ((sap.ui.Device.system.phone) || (sap.ui.Device.system.tablet)) {
                this.globalFilter.setVisible(!isVisible);
                return;
            }
            if (toggleFilterBar.animationInProcess) {
                return;
            }
            toggleFilterBar.animationInProcess = true;

            if (isVisible) {
                var jqGlobalFilter = jQuery(this.globalFilter.getDomRef());
                var jqGlobalFilterWrapper = jQuery(this.getView().byId("ovpGlobalFilterWrapper").getDomRef());
                var height = jqGlobalFilterWrapper.height();
                toOpenState(jqGlobalFilter, jqGlobalFilterWrapper, height);
                jqGlobalFilterWrapper.height(); //make browser render css change
                jqGlobalFilterWrapper.one('transitionend', function(e) {
                    this.globalFilter.setVisible(false); //set filterbar invisible in case shell wants to reRender it
                    toggleFilterBar.animationInProcess = false;
                }.bind(this));
                toCloseState(jqGlobalFilter, jqGlobalFilterWrapper, height);
            } else {
                this.globalFilter.setVisible(true);
                setTimeout(function () { //we need this to wait for globalFilter renderer
                    var jqGlobalFilter = jQuery(this.globalFilter.getDomRef());
                    var jqGlobalFilterWrapper = jQuery(this.getView().byId("ovpGlobalFilterWrapper").getDomRef());
                    var height = jqGlobalFilter.outerHeight();
                    toCloseState(jqGlobalFilter, jqGlobalFilterWrapper, height);
                    jqGlobalFilterWrapper.height(); //make browser render css change
                    jqGlobalFilterWrapper.one('transitionend', function(e) {
                        jqGlobalFilterWrapper.css("height", "auto");
                        toggleFilterBar.animationInProcess = false;
                    });
                    toOpenState(jqGlobalFilter, jqGlobalFilterWrapper, height);
                }.bind(this));
            }
        },

        /**
         * This function is overriding the read function of the oDataModel with a function that will
         * first find the relevant filters from the filter bar and then will call the original
         * read function with the relevant filters as parameters.
         * @param oModel
         * @private
         */
        _overrideCardModelRead: function(oModel){
            var fOrigRead = oModel.read;
            var that = this;
            oModel.read = function(){
                var aFilters = that.globalFilter.getFilters();
                var oParameters = arguments[1];
                if (!oParameters) {
                    oParameters = {};
                    Array.prototype.push.call(arguments, oParameters);
                }
                var oEntityType = that._getEntityTypeFromPath(oModel, arguments[0], oParameters.context);
                if (oEntityType){
                    var aRelevantFIlters = that._getEntityRelevantFilters(oEntityType, aFilters);
                    if (aRelevantFIlters.length > 0){
                        var foundIndex = -1;
                        var aUrlParams = oParameters.urlParameters;
                        if (aUrlParams){
                            for (var index = 0; index < aUrlParams.length; index++){
                                // We use here lastIndexOf instead of startsWith because it doesn't work on safari (ios devices)
                                if ((aUrlParams[index]).lastIndexOf("$filter=", 0) === 0){
                                    foundIndex = index;
                                    break;
                                }
                            }
                        }
                        if (foundIndex >= 0) {
                            aUrlParams[foundIndex] = aUrlParams[foundIndex] + "%20and%20" +
                            sap.ui.model.odata.ODataUtils.createFilterParams(aFilters, oModel.oMetadata, oEntityType).substr(8);
                        } else {
                            oParameters.filters = aRelevantFIlters;
                        }

                    }
                }

                fOrigRead.apply(oModel, arguments);
            };
        },

        /**
         * This is a temporary function used to retrieve the EntityType from a given path to an entity.
         * This function is required due to fact that the function _getEntityTypeByPath of the ODataMetadata is not public.
         * @param oModel
         * @param sPath
         * @param oContext
         * @returns {object}
         * @private
         */
        _getEntityTypeFromPath: function(oModel, sPath, oContext){
            //TODO need to request UI5 to have this a public API!!!!
            var sNormPath = sap.ui.model.odata.v2.ODataModel.prototype._normalizePath.apply(oModel, [sPath, oContext]);
            var oEntityType = sap.ui.model.odata.ODataMetadata.prototype._getEntityTypeByPath.apply(oModel.oMetadata, [sNormPath]);
            return oEntityType;
        },

        /**
         * This function goes over the provided list of filters and checks which filter appears as a field
         * in the EntityType provided. The fields that appears in both lists  (filters and EntityType fields)
         * will be returned in an array.
         * @param oEntityType
         * @param aFilters
         * @returns {array}
         * @private
         */
        _getEntityRelevantFilters: function(oEntityType, aFilters){
            var aRelevantFiltes = [];
            if (aFilters.length) {
                var allFilters = aFilters[0].aFilters;
                var entityProperties = oEntityType.property;
                for (var i = 0; i < allFilters.length; i++) {
                    var currentFilterName;
                    if (allFilters[i].aFilters) {
                        currentFilterName = allFilters[i].aFilters[0].sPath;
                    } else {
                        currentFilterName = allFilters[i].sPath;
                    }
                    for (var j = 0; j < entityProperties.length; j++) {
                        if (entityProperties[j].name ===  currentFilterName) {
                            aRelevantFiltes.push(allFilters[i]);
                            break;
                        }
                    }
                }
            }

            return aRelevantFiltes;
        },

        /*
         Check derived Card Component is implemented with respect to the below restrictions:

         Custom card must be instance of sap.ovp.cards.generic.Component. In other words, custom card must extend sap.ovp.cards.generic.Component.
         If sap.ovp.cards.generic.Card view is replaced by another custom View it means the custom card is not valid.
         [If the extended Component has customization (under the component metadata) and the sap.ovp.cards.generic.Card is replaced by another view (using sap.ui.viewReplacements)]
         If the extended Component overrides the createContent function of the base sap.ovp.cards.generic.Component class, the custom card is not valid.
         If the extended Component overrides the getPreprocessors function of the base sap.ovp.cards.generic.Component class, the custom card is not valid.

         */
        _checkIsCardValid: function (sCardTemplate) {
            var sComponentClassName = sCardTemplate + ".Component";
            var oComponentMetadata, oCustomizations;

            jQuery.sap.require(sComponentClassName);

            var oComponentClass = jQuery.sap.getObject(sComponentClassName);

            if (!oComponentClass) {
                return false;
            }

            if ((oComponentClass !== sap.ovp.cards.generic.Component) && !(oComponentClass.prototype instanceof sap.ovp.cards.generic.Component)) {
                return false;
            }

            if ((oComponentMetadata = oComponentClass.getMetadata()) && (oCustomizations = oComponentMetadata.getCustomizing())) {
                //if OVP Card view was replaced
                if (oCustomizations["sap.ui.viewReplacements"] && oCustomizations["sap.ui.viewReplacements"]["sap.ovp.cards.generic.Card"]) {
                    return false;
                }
            }

            if (oComponentClass.prototype.createContent != sap.ovp.cards.generic.Component.prototype.createContent) {
                return false;
            }

            if (oComponentClass.prototype.getPreprocessors != sap.ovp.cards.generic.Component.prototype.getPreprocessors) {
                return false;
            }

            return true;
        },

        _createCardComponent: function (oView, oModel, card) {
            if (card.template && this._checkIsCardValid(card.template)) {
                var oComponentConfig = {
                    name: card.template,
                    componentData: {
                        model: oModel,
                        settings: card.settings
                    }
                };

                if (this.globalFilter) {
                    oComponentConfig.componentData.globalFilter = {
                        getFilterDataAsString : this.globalFilter.getDataSuiteFormat.bind(this.globalFilter)
                    };
                }
                var oComponent = sap.ui.component(oComponentConfig);
                var oComponentContainer = oView.byId(card.id);

                var oOldCard = oComponentContainer.getComponentInstance();
                oComponentContainer.setComponent(oComponent);
                if (oOldCard){
                    //currently the old component is not destroyed when setting a different component
                    //so we need to do that in timeout to make sure that it will not be destoroyed
                    //too early, before real card will be rendered on the screen.
                    setTimeout(function(){
                        oOldCard.destroy();
                    }, 0);
                }
            } else {
                // TODO: define the proper behavior indicating a card loading failure
                jQuery.sap.log.error("Could not create Card from '" + card.template + "' template. Card is not valid.");
            }
        },

        createLoadingCard: function(card, opacityDelay){
            /*
             * we have to make sure metadata and filter are loaded before we create the card
             * so we first create loading card and once all promises will be resulved
             * we will create the real card and replace the loading card
             */
            var loadingCard = jQuery.extend(true, {}, card, {template: "sap.ovp.cards.loading", settings: {opacityDelay: opacityDelay}});
            this._createCardComponent(this.getView(), undefined, loadingCard);
        },

        createCard: function(card){
            var oView = this.getView();
            var oModel = oView.getModel(card.model);

            ///*
            // * we have to make sure metadata and filter are loaded before we create the card
            // * so we first create loading card and once all promises will be resulved
            // * we will create the real card and replace the loading card
            // */

            Promise.all([
                    oModel.getMetaModel().loaded(),
                    this.oGlobalFilterLodedPromise,
                    this.oLoadedComponents[card.template]]
            ).then(
                function() {
                    this._createCardComponent(oView, oModel, card);
                }.bind(this),
                function(reason) {
                    jQuery.sap.log.error("Can't load card with id:'" + card.id + "' and type:'" + card.template + "', reason:" + reason);
                }
            );
        }
    });
}());
