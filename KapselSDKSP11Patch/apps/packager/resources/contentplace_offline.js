            function createContentPlaceFunction(oContent) {
                return function() {
                    var rendererExt = sap.ushell.renderers.fiori2.RendererExtensions;

                    jQuery.sap.require("sap.ushell.shells.local.buttons.FlushButton");
                    jQuery.sap.require("sap.ushell.shells.local.buttons.RefreshButton");

                    var refrshButton = new sap.ushell.shells.local.buttons.RefreshButton("refreshBtn");
                    var flshButton = new sap.ushell.shells.local.buttons.FlushButton("flushBtn");

                    rendererExt.addOptionsActionSheetButton(refrshButton, rendererExt.LaunchpadState.Home, rendererExt.LaunchpadState.App);
                    rendererExt.addOptionsActionSheetButton(flshButton, rendererExt.LaunchpadState.Home, rendererExt.LaunchpadState.App);

                    oContent.placeAt("canvas");
                }
            }

