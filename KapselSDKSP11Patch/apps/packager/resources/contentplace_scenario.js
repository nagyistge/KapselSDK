function createContentPlaceFunction(oContent, ctx) {
    function success() {
        jQuery.sap.registerModulePath("__SCENARIO_ID__", "__SCENARIO_PATH__");
        jQuery.sap.require("__SCENARIO_INIT__");
        __SCENARIO_INIT__.init();
        oContent.placeAt("canvas");
    }

    function failure(e) {
        failedToStart(e);
    }

    function createStores() {
        sap.smp.registration.setup(ctx, stores, success, failure);
    }

    return createStores;
}

