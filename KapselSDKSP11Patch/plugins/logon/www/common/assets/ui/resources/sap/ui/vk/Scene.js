/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["jquery.sap.global","./library","sap/ui/base/EventProvider","./NodeHierarchy"],function(q,l,E,N){"use strict";var a=q.sap.log;var S=E.extend("sap.ui.vk.Scene",{metadata:{publicMethods:["getId","getGraphicsCore","getDefaultNodeHierarchy"]},constructor:function(g,d){a.debug("sap.ui.vk.Scene.constructor() called.");E.apply(this);this._id=q.sap.uid();this._graphicsCore=g;this._dvlSceneId=d;this._defaultNodeHierarchy=null;},destroy:function(){a.debug("sap.ui.vk.Scene.destroy() called.");if(this._defaultNodeHierarchy){this._defaultNodeHierarchy.destroy();this._defaultNodeHierarchy=null;}this._dvlSceneId=null;this._graphicsCore=null;E.prototype.destroy.apply(this);},getId:function(){return this._id;},getGraphicsCore:function(){return this._graphicsCore;},getDefaultNodeHierarchy:function(){if(!this._defaultNodeHierarchy){this._defaultNodeHierarchy=new N(this);}return this._defaultNodeHierarchy;},_getDvlSceneId:function(){return this._dvlSceneId;}});return S;});
