/*!
 * SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2013 SAP AG. All rights reserved
 */

/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.ushell.ui.footerbar.FlushButton.
jQuery.sap.declare("sap.ushell.shells.local.buttons.FlushButton");
jQuery.sap.require("sap.ushell.library");
jQuery.sap.require("sap.m.Button");


/**
 * Constructor for a new ui/footerbar/FlushButton.
 * 
 * Accepts an object literal <code>mSettings</code> that defines initial 
 * property values, aggregated and associated objects as well as event handlers. 
 * 
 * If the name of a setting is ambiguous (e.g. a property has the same name as an event), 
 * then the framework assumes property, aggregation, association, event in that order. 
 * To override this automatic resolution, one of the prefixes "aggregation:", "association:" 
 * or "event:" can be added to the name of the setting (such a prefixed name must be
 * enclosed in single or double quotes).
 *
 * The supported settings are:
 * <ul>
 * <li>Properties
 * <ul></ul>
 * </li>
 * <li>Aggregations
 * <ul></ul>
 * </li>
 * <li>Associations
 * <ul></ul>
 * </li>
 * <li>Events
 * <ul></ul>
 * </li>
 * </ul> 
 *
 * 
 * In addition, all settings applicable to the base type {@link sap.m.Button#constructor sap.m.Button}
 * can be used as well.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Add your documentation for the newui/footerbar/FlushButton
 * @extends sap.m.Button
 * @version 1.24.3
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.footerbar.FlushButton
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.m.Button.extend("sap.ushell.shells.local.buttons.FlushButton", { metadata : {

	library : "sap.ushell"
}});


/**
 * Creates a new subclass of class sap.ushell.ui.footerbar.FlushButton with name <code>sClassName</code> 
 * and enriches it with the information contained in <code>oClassInfo</code>.
 * 
 * <code>oClassInfo</code> might contain the same kind of informations as described in {@link sap.ui.core.Element.extend Element.extend}.
 *   
 * @param {string} sClassName name of the class to be created
 * @param {object} [oClassInfo] object literal with informations about the class  
 * @param {function} [FNMetaImpl] constructor function for the metadata object. If not given, it defaults to sap.ui.core.ElementMetadata.
 * @return {function} the created class / constructor function
 * @public
 * @static
 * @name sap.ushell.ui.footerbar.FlushButton.extend
 * @function
 */


// Start of sap/ushell/ui/footerbar/FlushButton.js
// Copyright (c) 2013 SAP AG, All Rights Reserved

(function () {
    "use strict";
    /*global jQuery, sap, navigator*/

    jQuery.sap.require("sap.ui.layout.form.SimpleForm");
    jQuery.sap.require("sap.m.ObjectHeader");
    jQuery.sap.require("sap.m.VBox");
    jQuery.sap.require("sap.m.Dialog");
    jQuery.sap.require("sap.m.Button");
    jQuery.sap.require("sap.ushell.resources");

    jQuery.sap.declare("sap.ushell.shells.local.buttons.FlushButton");

    /**
     * FlushButton
     *
     * @name sap.ushell.ui.footerbar.FlushButton
     * @private
     * @since 1.16.0
     */
    sap.ushell.shells.local.buttons.FlushButton.prototype.init = function () {
        var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ushell.shells.local");

        this.setIcon('sap-icon://forward');
        this.setWidth('100%');
        this.setText(oResourceBundle.getText("flushBtn_title"));
        this.setTooltip(oResourceBundle.getText("flushBtn_tooltip"));
        this.attachPress(this.showFlushDialog);
        this.setEnabled();  // disables button if shell not initialized
        //call the parent sap.m.Button init method
        if (sap.m.Button.prototype.init) {
            sap.m.Button.prototype.init.apply(this, arguments);
        }
    };

    sap.ushell.shells.local.buttons.FlushButton.prototype.showFlushDialog = function () {
        var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ushell.shells.local");

        sap.smp.registration.store.flush(function() {
            sap.m.MessageBox.alert(oResourceBundle.getText("storeFlushed"));
        }, function() {
            sap.m.MessageBox.alert(oResourceBundle.getText("storeFailedFlush"));
        });
   };
}());