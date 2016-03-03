/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2015 SAP SE. All rights reserved
 */
sap.ui.define(["jquery.sap.global","sap/ui/fl/changeHandler/Base","sap/ui/fl/Utils"],function(q,B,F){"use strict";var M=function(){};M.prototype=q.sap.newObject(B.prototype);M.prototype.applyChange=function(c,C){try{var d=c.getDefinition();d.content.forEach(function(m){var s=sap.ui.getCore().byId(m.sourceContainerId);var t=sap.ui.getCore().byId(m.targetContainerId);s.removeAggregation(C.sParentAggregationName,C);t.insertAggregation(m.targetAggregation,C,m.index);});}catch(e){throw new Error("Applying move changes failed: "+e);}};M.prototype.completeChangeContent=function(c,s){var C=c.getDefinition();if(s.parameters){C.content=s.parameters;}else{throw new Error("oSpecificChangeInfo.parameters attribute required");}};return M;},true);
