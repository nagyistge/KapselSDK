/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2015 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Element","sap/chart/utils/ChartUtils"],function(E,C){"use strict";var M=E.extend("sap.chart.data.Measure",{metadata:{library:"sap.chart",properties:{name:{type:"string"},label:{type:"string"},unitBinding:{type:"string"},valueFormat:{type:"string"},role:{type:"string",defaultValue:"axis1"}}}});M.prototype.setLabel=C.makeNotifyParentProperty("label");M.prototype.setRole=C.makeNotifyParentProperty("role");M.prototype.setUnitBinding=C.makeNotifyParentProperty("unitBinding");M.prototype.setValueFormat=C.makeNotifyParentProperty("valueFormat");return M;});
