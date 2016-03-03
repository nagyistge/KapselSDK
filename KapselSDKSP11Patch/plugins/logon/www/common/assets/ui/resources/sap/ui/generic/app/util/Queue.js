/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["jquery.sap.global"],function(q){"use strict";var Q=function(m){this._iMaxLength=m;this._aQueue=[];};Q.prototype._execNext=function(){var n;this._aQueue.shift();n=this._aQueue[0];if(n){this._exec(n);}};Q.prototype._exec=function(i){var t=this,s=function(){t._execNext();};i.jqdeferred.resolve();i.wait.then(function(){i.wait.then(s);},q.proxy(t._cancel,t));};Q.prototype.enqueue=function(f){var i={fn:f};i.jqdeferred=q.Deferred();i.defer=new Promise(function(a,r){i.jqdeferred.then(a,r);});i.wait=i.defer.then(f);if(this._aQueue.length>=this._iMaxLength){i.jqdeferred.reject(new Error("Queue overflow: "+this._aQueue.length));}else{this._aQueue.push(i);if(this._aQueue.length===1){this._exec(i);}}return i.wait.then();};Q.prototype._cancel=function(){var I,i,l=this._aQueue.length;for(i=0;i<l;i++){I=this._aQueue[i];I.jqdeferred.reject(new Error("Queue cancellation"));}this._aQueue=[];};Q.prototype.destroy=function(){this._aQueue=[];};return Q;},true);
