/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["jquery.sap.global"],function(q){"use strict";var M=function(m){this._oModel=m;};M.prototype.getContextFromResponse=function(r){var p="/"+this._oModel.getKey(r);return this._oModel.getContext(p);};M.getEntitySetFromContext=function(c){var p,e;if(!c){throw new Error("No context");}if(c&&c.getPath){p=c.getPath().split("(")[0];e=p.substring(1);}return e;};M.prototype.hasClientMessages=function(){var m,o,a,b,i=0,l=0;m=sap.ui.getCore().getMessageManager();o=m.getMessageModel();a=o.getData();if(a){l=a.length;}for(i=0;i<l;i++){b=a[i];if(b.processor.getMetadata()._sClassName==="sap.ui.core.message.ControlMessageProcessor"){return true;}}return false;};M.prototype.destroy=function(){this._oModel=null;};return M;},true);
