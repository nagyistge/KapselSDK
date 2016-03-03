// 3.11.4-SNAPSHOT
var exec = require('cordova/exec');

var BarcodeScanner = function() {

    /**
     * Encoding constants.
     *
     * @type Object
     */
     this.Encode = {
        TEXT_TYPE: "TEXT_TYPE",
        EMAIL_TYPE: "EMAIL_TYPE",
        PHONE_TYPE: "PHONE_TYPE",
        SMS_TYPE: "SMS_TYPE"
        //  CONTACT_TYPE: "CONTACT_TYPE",  // TODO:  not implemented, requires passing a Bundle class from Javascript to Java
        //  LOCATION_TYPE: "LOCATION_TYPE" // TODO:  not implemented, requires passing a Bundle class from Javascript to Java
    };
};

/**
 * Scan barcode.
 *
 * @param {Function} successCallback This function will receive a result object: 
 *                                   text : '1234567890',    // The code that was scanned.
 *                                   format : 'FORMAT_NAME', // Code format.
 *                                   cancelled : true/false, // Whether scan is cancelled or not.
 *                                    
 * @param {Function} errorCallback This function will triggered when an error occurs during scanning a barcode.
 * @example
 * cordova.plugins.barcodeScanner.scan( function (result) {
 *                   alert("Barcode scanning result:\n" +
 *                         "Result: " + result.text + "\n" +
 *                         "Format: " + result.format + "\n" +
 *                         "Cancelled: " + result.cancelled);
 *                   }, function (error) {
 *                       console.log("Barcode scanning failed: ", error);
 *                   } );
 */
BarcodeScanner.prototype.scan = function (successCallback, errorCallback) {
    exec(successCallback, errorCallback, 'BarcodeScanner', 'scan', []);
};

/**
 * Create barcode based on type and data.
 *
 * @param {String} type type of data (supported encoding types: TEXT_TYPE, EMAIL_TYPE, PHONE_TYPE and SMS_TYPE)
 * @param {String} data data that will be encoded to barcode.
 * @param {Function} successCallback This function will triggered when encoding barcode is successful. 
 * @param {Function} errorCallback This function will triggered when an error occurs during encoding barcode.
 * @example
 * cordova.plugins.barcodeScanner.encode(cordova.plugins.barcodeScanner.Encode.TEXT_TYPE, "http://www.sap.com", function(success) {
 *                   alert("encode success: " + success);
 *                   }, function(fail) {
 *                      alert("encoding failed: " + fail);
 *                   });
 */
BarcodeScanner.prototype.encode = function (type, data, successCallback, errorCallback) {
    exec(successCallback, errorCallback, 'BarcodeScanner', 'encode', [ {"type": type, "data": data}]);
};

var barcodeScanner = new BarcodeScanner();
module.exports = barcodeScanner;

