// 3.11.4-SNAPSHOT
var exec = require("cordova/exec");

/**
 * The push plugin provides an abstraction layer over the
 * <a href="http://developer.android.com/google/gcm/index.html">Google Cloud Messaging for Android (GCM)</a>
 * and
 * <a href="http://developer.apple.com/library/mac/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/ApplePushService.html#//apple_ref/doc/uid/TP40008194-CH100-SW9">Apple Push Notification Service (APNS)</a>.
 * <br/><br/>
 * A notification can be sent to a device registered with an application through a
 * rest call at <pre>http://SMP_3.0_SERVER:8080/Notifications/application_registration_id</pre>
 * <br/><br/>
 * <b>Adding and Removing the Push Plugin</b><br/>
 * The Push plugin is added and removed using the
 * <a href="http://cordova.apache.org/docs/en/edge/guide_cli_index.md.html#The%20Command-line%20Interface">Cordova CLI</a>.<br/>
 * <br/>
 * To add the Push plugin to your project, use the following command:<br/>
 * cordova plugin add <path to directory containing Kapsel plugins>\push<br/>
 * <br/>
 * To remove the Push plugin from your project, use the following command:<br/>
 * cordova plugin rm com.sap.mp.cordova.plugins.push
 * <br/>
 *
 * @namespace
 * @alias Push
 * @memberof sap
 */

module.exports = {
    
    pushHandlerInstalled: false,
    
    /**
     * Helper method for handling failure callbacks. It is configured as a failure callback in <code> call_native() </code>
     *
     *
     * @param {msg} Error message with the cause of failure
     *
     * @private
     * @name failure
     * @function
     */
    
failure: function (msg) {
    sap.Logger.debug("Javascript Callback Error: " + msg,"PUSHJS",function(m){},function(m){});
    
},
    /**
     * Helper method for handling push registration success callbacks. It is configured as a failure callback in <code> call_native() </code>
     *
     *
     * @param {msg} Error message with the cause of failure
     *
     * @private
     * @name pushregsuccsss
     * @function
     */
    
pushregsuccsss: function(msg) {
    sap.Logger.debug("Javascript Callback Success ","PUSHJS",function(m){},function(m){});
},
    
    /**
     * Helper method for calling native methods
     *
     * @param {function} callback
     * @param {string} Name of the action to invoke on the plugin
     * @param {array} List of arguments
     * @private
     * @name call_native
     * @function
     */
call_native: function (callback, name, args) {
    
    if(arguments.length == 2) {
        args = [];
    }
    ret = exec(
               callback,                /**  Called when signature capture is successful */
               sap.Push.failure,            /** Called when signature capture encounters an error */
               'SMPPushPlugin',         /**  Tell Cordova that we want to run "PushNotificationPlugin" */
               name,                    /**  Tell the plugin the action we want to perform */
               args);                   /**  List of arguments to the plugin */
    return ret;
},
    
    /**
     * Helper method to check if platform is iOS.
     *
     * @return {bool} Whether the current platform is iOS or not.
     * @private
     * @name isPlatformIOS
     * @function
     */
isPlatformIOS: function () {
    return device.platform == "iPhone" || device.platform == "iPad" || device.platform == "iPod touch" || device.platform == "iOS";
},
isPlatformAndroid: function() {
    return device.platform == "Android";
},
    /**
     * Function called by the application to get connection information.
     *
     * @param {string} [types] Types of notifications the application wants to receive. The different types of notifications are expressed in <code>notificationType</code>
     * @param {string} [successCB] Success callback to call when registration is successful.
     * @param {string} [errorCB] Error callback to call when registration attempt fails.
     * @private
     * @memberof sap.Push
     * @function getConnectionSettings
     * @example
     * sap.Push.getConnectionSettings(function(){
     * sap.Logger.debug("getting Connection Settings","PUSHJS",function(m){},function(m){});
     *  console.log("getting Connection Settings");
     *  sap.Push.registerForNotification(types,  successCallback, errorCallback, notificationListenerFunc, senderId );
     **/
    getConnectionSettings : function (successCB, errorCB) {
        
        
       
            var pd ="";
            sap.Logon.unlock(function (connectionInfo) {
                             var userName = connectionInfo["registrationContext"]["user"];
                             var password  = connectionInfo["registrationContext"]["password"];
                             var applicationConnectionId = connectionInfo["applicationConnectionId"];
                             var securityConfig = connectionInfo["registrationContext"]["securityConfig"];
                             var endpoint = connectionInfo["applicationEndpointURL"];
                             var keySSLEnabled = "false";
                             var splitendpoint = endpoint.split("/");
                             if (splitendpoint[0] == "https:")
                             {
                                 keySSLEnabled="true";
                             }
                             if (securityConfig == null) {
                                 securityConfig = "";
                             }
                            var burl = ""; 
                     		for (var i=2; i<splitendpoint.length-2; i++){
                         		burl += splitendpoint[i] +"/";
                     		}
                     		burl += splitendpoint[splitendpoint.length-2];
                     		var appId = splitendpoint[splitendpoint.length-1];

                             pd = appId+userName+password;
                             //sap.Settings.store = new sap.EncryptedStorage("SettingsStore");
                             connectionData = {
                                 "keyMAFLogonOperationContextConnectionData": {
                                     "keyMAFLogonConnectionDataApplicationSettings":
                                     {
                                     "DeviceType":device.platform,
                                     "DeviceModel":device.model,
                                     "ApplicationConnectionId":applicationConnectionId
                                     },
                                     "keyMAFLogonConnectionDataBaseURL":burl
                                 },
                                 "keyMAFLogonOperationContextApplicationId":appId,
                                 "keyMAFLogonOperationContextBackendUserName":userName,
                                 "keyMAFLogonOperationContextBackendPassword":password,
                                 "keyMAFLogonOperationContextSecurityConfig":securityConfig,
                                 "keySSLEnabled":keySSLEnabled
                             };
                             sap.Settings.start(connectionData,
                                                function(mesg) {
                                                    sap.Settings.isInitialized = true;
                                                    sap.Logger.debug("Setting Exchange is succesful ","SETTINGSJS",function(m){},function(m){});
                                                    successCB();
                                                },
                                                function(mesg){
                                                    sap.Logger.debug("Setting Exchange failed" + mesg,"SETTINGSJS",function(m){},function(m){});
                                                    sap.Settings.isInitialized = false;
                                                    errorCB();
                                                });
                             }
                             , function () {
                                 console.log("unlock failed");
                                 sap.Logger.debug("unlock failed ","SETTINGSJS",function(m){},function(m){});
                             }
                        );
            
       
        
        
},
    
    /**
     * Function called by the application to register notification types to receive.
     *
     * @param {string} [types] Types of notifications the application wants to receive. The different types of notifications are expressed in <code>notificationType</code>
     * @param {string} [successCallback] Success callback to call when registration is successful.
     * @param {string} [errorCallback] Error callback to call when registration attempt fails.
     * @param {string} [notificationlistenerfunc] The function that receives the notification for processing by the application.
     * @param {string} [senderId] The sender ID that is used for GCM registration. For other platforms it is null.
     * @private
     * @memberof sap.Push
     * @function registerForNotificationTypes
     * @example
     * regid = "211112269206";
         * function registerSuccess(mesg){}
         * function registerFailure(mesg) {}
         * function ProcessNotification(mesg){}
         * sap.Push.registerForNotificationTypes(sap.Push.notificationType.badge | sap.Push.notificationType.sound | sap.Push.notificationType.alert, registerSuccess, registerFailure, ProcessNotification, regid);
     */
    
        registerForNotification: function (types, successCallback, errorCallback, notificationListenerFunc, senderId) {
        	sap.Push.RegisterSuccess = successCallback;
        	sap.Push.RegisterFailed = errorCallback;
            if (notificationListenerFunc) {
               sap.Push.initPush(notificationListenerFunc,0);
            }
            if ((notificationListenerFunc == null ) || (notificationListenerFunc == undefined))
            {
               console.log("No Processing function provided");
               sap.Logger.debug("Notification listener function is not registered. Register it by calling registerForNotificationTypes","PUSHJS",function(m){},function(m){});
            }
        	sap.Push.call_native(sap.Push.pushregsuccsss, "registerForNotificationTypes", [types, senderId]);
            
    
},
    /** 
     * This function is called by the apliation to update push capability value for fiori client
     * @param {string} [capabilityNeme] The name of the capability.
     * @param {string} [capabilityValue] the value of the capability.
     * @public
     * @memberof sap.Push
     * @function updatePushCapability
     * @example 
     * sap.Push.updatePushCapability('testName', 'testValue');
     **/
    updatePushCapability: function(capabilityName, capabilityValue) {
               var nameVals = null;
               if (capabilityName == '*') {
                    nameVals = { "Capability": {"results":[{"Category":"push","CapabilityName":capabilityName}]} };
               } else {
                        nameVals = { "Capability": {"results":[{"Category":"push","CapabilityName":capabilityName, "CapabilityValue":capabilityValue}]} };
               }
               //var nameVals = {"Category":"push","CapabilityName":CapabilityName};
               sap.Settings.setConfigProperty(nameVals,
                                              function (m) {
                                              sap.Logger.debug("Device Capability Update Successful","SMP_PUSH_JS",function(m){},function(m){});
                                              },
                                              function (mesg) {
                                              sap.Logger.debug("Device Capability Update failed","SMP_PUSH_JS",function(m){},function(m){});
                                              });

    },
    /**
     * This function is called by the aplication to update push capability value for fiori client
     * @param {object} [capabilityJsonValue] The JSON value of capability list.
     * @public
     * @memberof sap.Push
     * @function updatePushCapabilityWithJson
     * @example
     * sap.Push.updatePushCapabilityWithJson([{"Category": 'categoryName1','CapabilityName':'testName1', 'CapabilityValue':'testValue1'},{"Category": 'categoryName2','CapabilityName':'testName2', 'CapabilityValue':'testValue2'}]);
    **/
    updatePushCapabilityWithJson: function(capabilityJsonValue) {
        var lengthOfData = 0;
        if (typeof capabilityJsonValue == 'object') {
              lengthOfData = capabilityJsonValue.length;
              if (lengthOfData > 0) {
                    for (each = 0; each< lengthOfData; each++) {
                        var theObject = capabilityJsonValue[each];
                        if (typeof theObject == 'object') {
                            if (theObject.CapabilityName == '*') {
                                    if (theObject.CapabilityValue)   {
                                             sap.Logger.debug("For capability name with * capability value should not be provided","SMP_PUSH_JS",function(m){},function(m){});
                                            delete theObject.CapabilityValue;
                                    }
                              }
                        } else {
                             sap.Logger.debug("Ivalid Json value","SMP_PUSH_JS",function(m){},function(m){});
                        }

                   }
               
               var nameVals = { "Capability": {"results":capabilityJsonValue} };
               sap.Settings.setConfigProperty(nameVals,
                                              function (m) {
                                              sap.Logger.debug("Device Capability Update Successful","SMP_PUSH_JS",function(m){},function(m){});
                                              },
                                              function (mesg) {
                                              sap.Logger.error("Device Capability Update failed","SMP_PUSH_JS",function(m){},function(m){});
                                              });
               }
         }
    },

    /* Core APIS */
    
    /**
     * Function called by the application to register notification types to receive.
     *
     * @param {string} types Types of notifications the application wants to receive. The different types of notifications are expressed in <code>notificationType</code>
         *                  Notificaion types allowed are Disable all notifications (NONE: 0), Set badge count on app icon (BADGE: 1), Play sounds on receiving notification (SOUNDS: 2) and Show alert on receiving notification (ALERT: 4).
     * @param {string} successCallback Success callback to call when registration is successful.
     * @param {string} errorCallback Error callback to call when registration attempt fails.
     * @param {string} notificationlistenerfunc The function that receives the notification for processing by the application.
     * @param {string} [senderId] The sender ID that is used for GCM registration. For other platforms it is null.
     * @public
     * @memberof sap.Push
     * @function registerForNotificationTypes
     * @example
     * regid = "211112269206";
     * function registerSuccess(mesg){}
     * function registerFailure(mesg) {}
     * function ProcessNotification(mesg){}
     * sap.Push.registerForNotificationTypes(sap.Push.notificationType.badge | sap.Push.notificationType.sound | sap.Push.notificationType.alert, registerSuccess, registerFailure, ProcessNotification, regid);
     */
registerForNotificationTypes: function (types, registerSuccess, registerFailure, notificationListenerFunc, senderId ) {
    var pushEnabled = null;
    if (sap.Push.isPlatformIOS() ){
         pushEnabled = "ApnsPushEnable";
    } else if (sap.Push.isPlatformAndroid()) {
         pushEnabled = "AndroidGcmPushEnabled";
    } else {
         pushEnabled = "WnsPushEnable";
    }
    sap.Settings.getConfigProperty(function(enabled){
                                   if (enabled == true) {
           if ( (device.platform == "Android")  &&  (senderId === undefined || senderId == null)) {
                 sap.Settings.getConfigProperty(function(idval){
                       sap.Push.registerForNotification(types, registerSuccess, registerFailure, notificationListenerFunc, idval);
                    },
                    function(){}, "AndroidGcmSenderId");
            } else {
                 sap.Push.registerForNotification(types, registerSuccess, registerFailure, notificationListenerFunc, senderId);
            }
          }
        },
          function(){
          },
          pushEnabled
    );
    
},
    
    
    /**
     * Function called by the application to unregister from future notifications.
     *
     * @param {function} callback Success callback to call when deregistration is successful. This callback function will contain a string with a message. This message is just for informative purpose. 
     * @public
     * @memberof sap.Push
     * @function unregisterForNotificationTypes
     * @example
     * function unregCallback(mesg){}
     * sap.Push.unregisterForNotificationTypes(unregCallback);
     */
    
unregisterForNotificationTypes: function (callbak) {
        sap.Push.call_native(callbak,"unregisterForNotification");
},
    
    /**
     * Used to fetch the badge count for the application. This function is used only by iOS. Other platforms do not have the badge count concept.
     *
     * @param {function} callback Success callback to call when to send the badge count. The callback function will contain an argument in json format with the current badge count. Look into the example for the deail on how to use them.
     * @public
     * @memberof sap.Push
     * @function getBadgeNumber
     * @example
     * function getBadgeNumCallback(data) { badgecount = data;}
     * sap.Push.getBadgeNumber(getBadgeNumCallback);
     */
getBadgeNumber: function(callback)
    {
        if (sap.Push.isPlatformIOS()) {
            sap.Push.call_native(callback, "getBadgeNumber");
        }
    },
    
    /**
     * Used to set the badge count for the application. This function is used only by iOS. Other platforms do not have the badge count concept.
     *
     * @param {number} number The badge count to set for the application.
     * @param {function} callback Success callback to call when to send the badge count. The callback function will contain an argument in string format. This argument can be used for informative purpose.
     * @public
     * @memberof sap.Push
     * @function setBadgeNumber
     * @example
     * function badgeCallback(mesg){}
     * badgenum = 10;
     * sap.Push.setBadgeNumber(badgenum, badgeCallback);
     */
setBadgeNumber: function (number, callback) {
    if (sap.Push.isPlatformIOS()) {
        sap.Push.call_native(callback, "setBadgeNumber", [number]);
    }
},
    
    /**
     * Used to reset the badge count for the application.  This function is used only by iOS. Other platforms do not have the badge count concept.
     *
     * @param {function} callback Success callback to call when the badge count is reset. The callback function will contain an argument in string format. This argument can be used for informative purpose.
     * @public
     * @memberof sap.Push
     * @function resetBadge
     * @example
     * function badgeCallback(mesg){}
     * sap.Push.resetBadge(badgeCallback);
     */
resetBadge: function (callback) {
    if (sap.Push.isPlatformIOS() || (device.platform === "windows")) {
        sap.Push.call_native(callback, "resetBadge");
    }
},
    
    
    
    
    
    /**
     * This method updates the application with the new device token in the SAP Mobile Platform server.
     *
     * @param {string} [devtok] The device token received from the APNS/GCM device registration.
     * @public
     * @callback {function} [callback] The callback function that is called with the registration result.
     * @memberof sap.Push
     * @example
     * function callback(mesg) {}
     * devToken ="123123213213";//sample device token
     * sap.Push.updateWithDeviceToken(devToken, callback);
     */
    
updateWithDeviceToken:  function (devtok, callback) {
    if (sap.Push.isPlatformIOS() || device.platform == "Android" ) {
        sap.Push.call_native(callback, "updateWithDeviceToken", [devtok]);
    }
},
    
    /**
     * This method checks for any notifications received while the application was not running in the foreground. Application developer can call this
     * function directly or register with an event handler to be called automatically. It is ok to call this function evenif the device is not yet registered for push notification.
     * @param {function} callback The callback function that receives the notification. The callback function will receive a string as it's argument. This string will contain the notification message send from the server intact.
     * @memberof sap.Push
     * @example
     * function processBackgroudMessage(mesg){
     *  
     * }
     * function checkBackgroundNotification() {
     *     sap.Push.checkForNotification(processBackgroudMessage);
     * }
     * document.addEventListener("onSapLogonSuccess", checkBackgroundNotification, false);
     * document.addEventListener("onSapResumeSuccess", checkBackgroundNotification, false);
     **/
    
checkForNotification: function(callback) {
    if (sap.Push.isPlatformIOS() || device.platform == "Android" || device.platform === "windows") {
        sap.Push.call_native(callback, "checkForNotification");
    }
},

  /**
  * This method is used to initialize the push notifiation in the javascript
  * @param {function} the pushprocesor function wich will be called based on the push event
  * @memberof sap.Push
  * @example
  * var myPushProcessor = function(msg) {
  *       alert(JSON.stringify(msg));
  * }
  * document.addEventListener("onSapResumeSuccess", function() {sap.Push.initPush(myPushProcessor);}, false);
  * document.addEventListener("onSapLogonSuccess", function() {sap.Push.initPush(myPushProcessor);}, false);
  **/
               

initPush: function(pushProcessor, version) {
          var  v = 1;
          if (typeof(version) != 'undefined') {
            v = version;
          }
          if (sap.Push.pushHandlerInstalled == false) {
                sap.Push.pushHandlerInstalled = true;
               if (cordova.require("cordova/platform").id.indexOf("windows") === 0)  {
                        WinJS.Application.addEventListener("pusharrived", function(e) { pushProcessor(e.detail.args) ;}, false);
               } else {
                    document.addEventListener("pusharrived", function(e) { pushProcessor(e.detail.args) ;}, false);
               }
                  sap.Push.call_native(sap.Push.ProcessNotification, "initPush", [v]);
           }
              
},

initPushSettings: function(){
    if (device.platform == "iPhone" || device.platform == "iPad" || device.platform == "iPod touch" || device.platform == "iOS" ) {
               var deviceFormFactor = null;
               if (/iphone/i.test(device.model) == true) {
                       deviceFormFactor = "phone";
               } else if (/ipad/i.test(device.model) == true) {
                     deviceFormFactor = "tablet";
               } else {
                      deviceFormFactor = "tablet";
               }
               sap.Settings.setConfigProperty({ "FormFactor": deviceFormFactor },
                      function () {
                         sap.Logger.debug("Device Formfactor Update Successful","SMP_PUSH_JS",function(m){},function(m){});
                       },
                       function () {
                         sap.Logger.debug("Device Formfactor Update failed","SMP_PUSH_JS",function(m){},function(m){});
                 });
    } else if ((device.platform == "Android") || (cordova.require("cordova/platform").id == 'windows')) {
                              
                 sap.Settings.setFormFactor();
    }
          
            if ((typeof(fiori_client_appConfig) != "undefined") && (typeof(fiori_client_appConfig.fioriPushCapability) != "undefined" ) )
            {
               sap.Push.updatePushCapabilityWithJson(fiori_client_appConfig.fioriPushCapability);
            } else {
               sap.Push.updatePushCapability('*', 'push');
            }
            if ((device.platform == "Android") || (cordova.require("cordova/platform").id == "ios") || (cordova.require("cordova/platform").id == "windows")) {
               /*Automatically Register for Push notification */
            	  var nTypes = sap.Push.notificationType.SOUNDS | sap.Push.notificationType.ALERT | sap.Push.notificationType.BADGE ;
            	  sap.Push.registerForNotificationTypes(nTypes,
                                                 function(){},
                                                 function(){
                                                     sap.Logger.error("Push Registration Failed","SMP_PUSH_JS",function(m){},function(m){});
                                                    /* Commenting out the following until a perfect solution
                                                    document.addEventListener("onSapLogonSuccess",
                                                        function() {
                                                           var i18n = require('kapsel-plugin-i18n.i18n');
                                                           i18n.load({
                                                                path: "plugins/kapsel-plugin-push/www"
                                                            },
                                                           function(bundle){
                                                                  navigator.notification.alert(bundle.get("push_registration_failed"), function () { }, bundle.get("pushregistration_viewer_page"), bundle.get("close"));
                                                    });
                                                    },
                                                    false); */
                                                },
                            null);
            }
 },

    /**
     * This is an internal function, which is called when there is a push notification.
     * @private
     **/
ProcessNotification: function(message) {
            
    eventId = "pusharrived";
    if (cordova.require("cordova/platform").id.indexOf("windows") === 0) {
      WinJS.Application.queueEvent({
                type: eventId,
                detail: { 'id': eventId, 'args': message }
                });
    }
    else {
      var event = new CustomEvent(eventId, { 'detail': { 'id': eventId, 'args': message } });
             setTimeout(function () {
                     document.dispatchEvent(event);
                   }, 0);
    }
},
    /**
     * This is an internal function, which is automatically called when the plugin is initialized. Used only for android.
     * @private
     **/
initPlugin: function(callback) {
    if ( device.platform == "Android")
    {
        args = [];
        exec(
             callback,
             function(){ sap.Logger.debug("Plugin Initialization","PUSHJS",function(m){},function(m){}); } ,
             'SMPPushPlugin',
             "initPlugin",
             args);
    }
}
    
};


/**
 * Local private variables
 * @private
 */
module.exports.RegisterSuccess = null;
module.exports.RegisterFailed = null;
module.exports.ProcessNotificationForUser = null;
/**
 * Enum for types of push notification.
 * @enum {number}
 * @private
 */
module.exports.notificationType = {
    /** Disable all notifications */
NONE: 0,
    /** Set badge count on app icon */
BADGE: 1,
    /** Play sound on receiving notification */
SOUND: 2,
SOUNDS: 2,
    /** Show alert on receiving notification */
ALERT: 4
};



if (cordova.require("cordova/platform").id.indexOf("windows") === 0) {
    WinJS.Application.addEventListener("deviceready", module.exports.initPlugin, false);
    WinJS.Application.addEventListener("sapLogonRegistered", module.exports.initPushSettings, false);
} else {
    document.addEventListener('deviceready', module.exports.initPlugin, false);
    document.addEventListener("sapLogonRegistered", module.exports.initPushSettings, false);
}



