/*!
 * ${copyright}
 */
sap.ui.define(["jquery.sap.global","sap/ovp/library"],function(q){"use strict";var C=sap.m.FlexBox.extend("sap.ovp.ui.CardContentContainer",{metadata:{library:"sap.ovp"},renderer:{render:function(r,c){r.write("<div");r.writeControlData(c);r.addClass("sapOvpCardContentContainer");r.writeClasses();r.write(">");var a=c.getItems();for(var i=0;i<a.length;i++){r.renderControl(a[i]);}r.write("</div>");}}});return C;},true);
