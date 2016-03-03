/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["sap/ui/base/Object","sap/ui/table/Table","sap/m/Table","sap/ui/comp/smarttable/SmartTable"],function(O,T,R,S){"use strict";var V=O.extend("sap.ui.generic.template.ViewUtil",{metadata:{properties:{}}});V.getParentTable=function(s){var c=s;while(c){if(c instanceof R||c instanceof T||c instanceof S){return c;}if(c.getParent){c=c.getParent();}else{return null;}}return null;};V.getTableBinding=function(t){if(t instanceof S){t=t.getTable();}if(t instanceof T){return t.getBindingInfo("rows");}else if(t instanceof R){return t.getBindingInfo("items");}return null;};return V;},true);
