/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2015 SAP SE. All rights reserved
 */
sap.ui.define(["jquery.sap.global","sap/ui/fl/changeHandler/Base","sap/ui/fl/Utils"],function(q,B,F){"use strict";var P=function(){};P.prototype=q.sap.newObject(B.prototype);P.prototype.applyChange=function(c,C){try{var d=c.getDefinition();d.content.forEach(function(p){var a=p.propertyName;var b=C.getMetadata().getProperties()[a];var f=b._sMutator;C[f](p.newValue);});}catch(e){throw new Error("Applying property changes failed: "+e);}};P.prototype.completeChangeContent=function(c,s){var C=c.getDefinition();if(s.parameters){C.content=s.parameters;}else{throw new Error("oSpecificChangeInfo.parameters attribute required");}};return P;},true);
