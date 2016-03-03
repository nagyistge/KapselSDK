/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2015 SAP SE. All rights reserved
 */
sap.ui.define(["jquery.sap.global","sap/ui/rta/changeHandler/Move","sap/ui/rta/changeHandler/Property","sap/ui/rta/changeHandler/AddControl","sap/ui/fl/registry/ChangeRegistry","sap/ui/fl/registry/SimpleChanges"],function(q,M,P,A,C,s){"use strict";s.move={changeType:"move",changeHandler:M};s.property={changeType:"property",changeHandler:P};s.addControl={changeType:"addControl",changeHandler:A};var c=C.getInstance();var S=[s.move,s.property,s.addControl,s.hideControl,s.unhideControl];c.registerControlsForChanges({"sap.m.Button":S,"sap.m.ObjectStatus":S,"sap.m.ObjectHeader":S,"sap.m.ObjectAttribute":S});});
