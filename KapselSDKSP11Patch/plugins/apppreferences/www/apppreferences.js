// 3.11.4-SNAPSHOT   
var exec = require('cordova/exec');

/**
 * This plugin helps to handle native application preferences.
 *	
 * @namespace
 * @alias AppPreferences
 * @memberof sap
 */
AppPreferences = function() {
     
  /**
   * Get a preference value.  If a preference with the given key cannot be found, the succes callback will still be invoked, but the
   * value will be null.
   *
   * @memberof sap.AppPreferences
   * @function getPreferenceValue 
   * @param {String} key   a unique identifier for a preference value.
   * @param {Function} [successCallback]   Callback function called when a preference value has been successfully retrieved with a key.   
   * @param {Function} [errorCallback]    Callback function called when an error occurs while retrieving a preference value with a key.
   * @example
   * var successCallback = function(value) {
   *     if (value != null) {
   *         alert("Succeess: " + value); 
   *     } else {
   *         alert("preference does not exist.");
   *     }
   * }
   * sap.AppPreferences.getPreferenceValue(function() {
   *   "name_preference", 
   *    successCallback, 
   *    function(errMsg) {alert("Error: " + errMsg);} );
   */
   this.getPreferenceValue = function (key, successCallback, errorCallback) {
       var preferencesCallback = function(preferences) {
           if (preferences.hasOwnProperty(key)) {
               successCallback(preferences[key]);
           } else {
               successCallback(null);
           }
       }
       this.getPreferenceValues([key], preferencesCallback, errorCallback);
   }
      
         
   /**
    * Get multiple preference values
    *
    * @memberof sap.AppPreferences
    * @function getPreferenceValues 
    * @param {StringArray} keys  identifier array for the preference values.
    * @param {Function} [successCallback]   Callback function called when preference values have been successfully retrieved with keys.
    * @param {Function} [errorCallback]    Callback function called when an error occurs while retrieving preference values with keys.
    * @example
    * sap.AppPreferences.getPreferenceValues(function() {
    *   ["name1","name2"],
    *    function(val) {alert("Succeess: " + val);},
    *    function(errMsg) {alert("Error: " + errMsg);} );
    */
   this.getPreferenceValues = function (keys, successCallback, errorCallback) {
        exec(successCallback, errorCallback, "AppPreferences", "getPreferenceValues", [keys]);
   }

  /**
   * Set a key-value pair for a preference
   * 
   * @memberof sap.AppPreferences
   * @function setPreferenceValue 
   * @param {String} key   a unique identifier for a preference value.
   * @param {String} value    a preference value set with a key.   
   * @param {Function} [successCallback]   Callback function called when a key-value pair for a preference has been successfully set.
   * @param {Function} [errorCallback]   Callback function called when an error occurs while setting a key-value pair for a preference.
   * @example
   * sap.AppPreferences.setPreferenceValue(function() {
   *   "name_preference", 
   *   "TEST", 
   *    function(successMsg) {alert("Succeess: " + successMsg);}, 
   *    function(errMsg) {alert("Error: " + errMsg);} );
   */    
   this.setPreferenceValue = function (key, value, successCallback, errorCallback) {
       exec(successCallback, errorCallback, "AppPreferences", "setPreferenceValue", [key, value]);
   }
             
   /**
    * Set key-value pairs for preference
    *
    * @memberof sap.AppPreferences
    * @function setPreferenceValues 
    * @param {object} properties of the javascript object as name-value pairs.
    * @param {Function} [successCallback]   Callback function called when a key-value pair for a preference has been successfully set.
    * @param {Function} [errorCallback]   Callback function called when an error occurs while setting a key-value pair for a preference.
    * @example
    * sap.AppPreferences.setPreferenceValue(function() {
    *    {"name1":"value1","name2":"value2"},
    *    function(successMsg) {alert("Succeess: " + successMsg);},
    *    function(errMsg) {alert("Error: " + errMsg);} );
    */
   this.setPreferenceValues = function (items, successCallback, errorCallback) {
        exec(successCallback, errorCallback, "AppPreferences", "setPreferenceValues", [items]);
   }

  /**
   * Show an app preferences screen (only for Android)
   *
   * @memberof sap.AppPreferences
   * @function showPreferencesScreen 
   * @param {Function} [successCallback]   Callback function called when an app preferences screen built by app preferences screen JSON array has been successfully shown.
   * @param {Function} [errorCallback]   Callback function called when an error occurs while showing an app preferences screen.
   * @example 
   * sap.AppPreferences.showPreferencesScreen( 
   *         function(successMsg) {alert("Succeess: " + successMsg);}, 
   *         function(errMsg) {alert("Error: " + errMsg);} );
   */
   this.showPreferencesScreen = function(successCallback,errorCallback) {
      exec(successCallback, errorCallback, "AppPreferences","showPreferencesScreen",[]);    
   }


  /**
   * Add JSON array for configuring an app preferences screen (only for Android) 
   *
   * @memberof sap.AppPreferences
   * @function configurePreferencesScreen  
   * @param {JSONArray} preferencesUIData   JSON array for configuring an app preferences screen.    
   * @param {Function} [successCallback]   Callback function called when JSON array for an app preferences screen has been successfully configured.
   * @param {Function} [errorCallback]   Callback function called when an error occurs while adding and checking JSON array for an app preferences screen.
   * @example 
   * sap.AppPreferences.configurePreferencesScreen(preferencesUIData, 
   *         function(successMsg) {alert("Succeess: " + successMsg);}, 
   *         function(errMsg) {alert("Error: " + errMsg);} );
   */
   this.configurePreferencesScreen = function(preferencesUIData, successCallback, errorCallback) {
      exec( successCallback, errorCallback, "AppPreferences", "configurePreferencesScreen", [preferencesUIData]);
   }
        
}

module.exports = new AppPreferences();

