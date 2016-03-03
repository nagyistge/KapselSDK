jQuery.sap.require("sap.ui.thirdparty.datajs");
jQuery.sap.require("sap.m.BusyDialog");

if (!sap) {
    sap = {};
}
if (!sap.smp) {
    sap.smp = {};
}

sap.smp.registration = {

    stores: {},
    
    setup: function (ctx, stores, success, failure) {
        
        var deferreds = [];
        
        for (var idx in stores) {
            var store = stores[idx];
            
            deferreds.push(this._setupStore(ctx, store));
        }
        
        new sap.m.BusyDialog("_offline_busy_", {text:"The local store is being provisioned", title: "Please wait ..."}).open();
        
        jQuery.when.apply(jQuery, deferreds).then(function() {
            // success
            sap.ui.getCore().byId("_offline_busy_").close();

            success();
        }, function (e) {
            // failure
            sap.ui.getCore().byId("_offline_busy_").close();

            failure(e);                                      
        });
    },

    /*****************************************************
     * Perform store initialization
     *****************************************************/
    _setupStore: function(ctx, storeInfo) {
        var deferred = jQuery.Deferred();
        
        var properties = {
            name             : storeInfo.name,
            host             : ctx.serverHost,
            port             : ctx.serverPort == 0 ? (ctx.https ? 443 : 80) : ctx.serverPort,
            https            : ctx.https,
            serviceRoot      : storeInfo.serviceRoot,
            definingRequests : storeInfo.definingRequests
        };
    
        function _storeOpenSuccess() {
            console.log("Offline store opened OK");
        
            sap.OData.applyHttpClient();

            this.stores[storeInfo.name] = store;
            
            deferred.resolve(store);
        }
    
        function _storeOpenFailure(e) {
            console.error("Failed to create offline store: "+ e);
        
            deferred.reject({msg: "Failed to provision the local store: " + e});
        }

        console.log("Creating offline store");
    
        var store = storeInfo;
        
        store.store = sap.OData.createOfflineStore(properties);
    
        // Listen for optional events
        store.store.onrequesterror = function(error) {
            console.error("Error occurred while sending offline modification(s) to server. " + error);
        };
    
        store.store.open(jQuery.proxy(_storeOpenSuccess, this), jQuery.proxy(_storeOpenFailure, this), ctx);
    
        console.log("Called store open ...");
        
        return deferred;
    }
}
    
