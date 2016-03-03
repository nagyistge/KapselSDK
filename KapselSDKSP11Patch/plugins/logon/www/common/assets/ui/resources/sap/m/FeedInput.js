/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2015 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['jquery.sap.global','./library','sap/ui/core/Control','sap/ui/core/HTML','sap/ui/core/IconPool'],function(q,l,C,H,I){"use strict";var F=C.extend("sap.m.FeedInput",{metadata:{library:"sap.m",properties:{enabled:{type:"boolean",group:"Behavior",defaultValue:true},maxLength:{type:"int",group:"Behavior",defaultValue:0},placeholder:{type:"string",group:"Appearance",defaultValue:"Post something here"},value:{type:"string",group:"Data",defaultValue:null},icon:{type:"sap.ui.core.URI",group:"Data",defaultValue:null},showIcon:{type:"boolean",group:"Behavior",defaultValue:true},iconDensityAware:{type:"boolean",group:"Appearance",defaultValue:true},buttonTooltip:{type:"string",altTypes:["sap.ui.core.TooltipBase"],multiple:false,group:"Data",defaultValue:"Submit"},ariaLabelForPicture:{type:"string",group:"Accessibility",defaultValue:null}},events:{post:{parameters:{value:{type:"string"}}}}}});F.prototype.init=function(){var b=sap.ui.getCore().getLibraryResourceBundle("sap.m");this.setProperty("placeholder",b.getText("FEEDINPUT_PLACEHOLDER"),true);this.setProperty("buttonTooltip",b.getText("FEEDINPUT_SUBMIT"),true);};F.prototype.exit=function(){if(this._oTextArea){this._oTextArea.destroy();}if(this._oButton){this._oButton.destroy();}if(this._oImageControl){this._oImageControl.destroy();}};F.prototype.setIconDensityAware=function(i){this.setProperty("iconDensityAware",i,true);if(this._getImageControl()instanceof sap.m.Image){this._getImageControl().setDensityAware(i);}return this;};F.prototype.setMaxLength=function(m){this.setProperty("maxLength",m,true);this._getTextArea().setMaxLength(m);return this;};F.prototype.setValue=function(v){this.setProperty("value",v,true);this._getTextArea().setValue(v);this._enablePostButton();return this;};F.prototype.setPlaceholder=function(v){this.setProperty("placeholder",v,true);this._getTextArea().setPlaceholder(v);return this;};F.prototype.setEnabled=function(e){this.setProperty("enabled",e,true);this._getTextArea().setEnabled(e);this._enablePostButton();return this;};F.prototype.setButtonTooltip=function(b){this.setProperty("buttonTooltip",b,true);this._getPostButton().setTooltip(b);return this;};F.prototype._getTextArea=function(){if(!this._oTextArea){this._oTextArea=new sap.m.TextArea(this.getId()+"-textArea",{rows:1,value:null,maxLength:this.getMaxLength(),placeholder:this.getPlaceholder(),liveChange:q.proxy(function(e){var v=e.getParameter("value");this.setProperty("value",v,true);this._enablePostButton();},this)});this._oTextArea.setParent(this);}return this._oTextArea;};F.prototype._getPostButton=function(){if(!this._oButton){this._oButton=new sap.m.Button(this.getId()+"-button",{enabled:false,type:sap.m.ButtonType.Default,icon:"sap-icon://feeder-arrow",tooltip:this.getButtonTooltip(),press:q.proxy(function(e){this.firePost({value:this.getValue()});this.setValue(null);this._oTextArea.focus();},this)});this._oButton.setParent(this);}return this._oButton;};F.prototype._enablePostButton=function(){var v=this.getProperty("value");var i=this.getProperty("enabled");var p=(i&&!!v&&v.trim().length>0);var b=this._getPostButton();if(b.getEnabled()!==p){b.setEnabled(p);}};F.prototype._getImageControl=function(){var i=this.getIcon()||I.getIconURI("person-placeholder"),s=this.getId()+'-icon',p={src:i,alt:this.getAriaLabelForPicture(),densityAware:this.getIconDensityAware(),decorative:false,useIconTooltip:false},c=['sapMFeedInImage'];this._oImageControl=sap.m.ImageHelper.getImageControl(s,this._oImageControl,this,p,c);return this._oImageControl;};return F;},true);
