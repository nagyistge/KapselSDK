/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(['jquery.sap.global','sap/ui/commons/CheckBox','./library'],function(q,C,l){"use strict";var a=C.extend("sap.ui.vk.CheckEye",{metadata:{library:"sap.ui.vk",properties:{}},onAfterRendering:function(){var $=this.$();$.removeClass('sapUiCb');$.removeClass('sapUiCbChk');$.removeClass('sapUiCbInteractive');$.removeClass('sapUiCbStd');$.addClass('sapUiCheckEye');},renderer:{}});return a;},true);
