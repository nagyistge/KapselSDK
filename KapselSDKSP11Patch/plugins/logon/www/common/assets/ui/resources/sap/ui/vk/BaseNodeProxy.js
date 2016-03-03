/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["jquery.sap.global","./library","sap/ui/base/Object"],function(q,l,B){"use strict";var g=sap.ui.vk.dvl.getJSONObject;var a=B.extend("sap.ui.vk.BaseNodeProxy",{metadata:{publicMethods:["getNodeId","getName","getNodeMetadata","getHasChildren"]},constructor:function(n,b){this.init(n,b);},init:function(n,b){this._dvl=n?n.getGraphicsCore()._getDvl():null;this._dvlSceneId=n?n._getDvlSceneId():null;this._dvlNodeId=b;},reset:function(){this._dvlNodeId=null;this._dvlSceneId=null;this._dvl=null;},getNodeId:function(){return this._dvlNodeId;},getName:function(){return g(this._dvl.Scene.RetrieveNodeInfo(this._dvlSceneId,this._dvlNodeId,sap.ve.dvl.DVLNODEINFO.DVLNODEINFO_NAME)).NodeName;},getNodeMetadata:function(){return g(this._dvl.Scene.RetrieveMetadata(this._dvlSceneId,this._dvlNodeId)).metadata;},getHasChildren:function(){return(g(this._dvl.Scene.RetrieveNodeInfo(this._dvlSceneId,this._dvlNodeId,sap.ve.dvl.DVLNODEINFO.DVLNODEINFO_FLAGS)).Flags&(sap.ve.dvl.DVLNODEFLAG.DVLNODEFLAG_MAPPED_HASCHILDREN|sap.ve.dvl.DVLNODEFLAG.DVLNODEFLAG_CLOSED))===sap.ve.dvl.DVLNODEFLAG.DVLNODEFLAG_MAPPED_HASCHILDREN;}});return a;});
