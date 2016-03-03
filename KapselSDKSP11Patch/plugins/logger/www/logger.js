// 3.11.4-SNAPSHOT
var exec = require('cordova/exec');

/**
 * The Kapsel Logger plugin provides a Cordova plugin wrapper around the SAP Mobile Platform client logging API (Supportability library). 
 * <br><br>
 *
 * The Logger plugin has ERROR, WARN, INFO, and DEBUG log levels and log messages are captured based on the configured and selected log level. 
 * A Kapsel application can be set to these log levels by programmatic control, and by the administrator changing a setting on the server. 
 * For Android and iOS, the default log level is ERROR, so by default only ERROR level logs are captured.
 * sap.Logger.setLogLevel() method is used to set other levels. If you want to get log messages at all log levels, 
 * you must set the log level to DEBUG. (DEBUG < INFO < WARN < ERROR) <br>
 * If the log level is set to DEBUG, the application captures all log messages. <br>
 * If you set the log level to INFO, the application captures INFO, WARN, and ERROR log messages. <br>
 * If you set the log level to WARN, the application captures WARN and ERROR log messages. <br>
 * If you set the log level to ERROR, the application captures only Error log messages. 
 * <br><br>
 *
 * Using the provided sap.Logger.upload() method allows developers to upload a log file to SAP Mobile Platform Server, 
 * where an administrator can view them and remotely set the appropriate log level to control the amount of information 
 * that is written to the log. When the sap.Logger.upload() method is triggered, a log file will be uploaded.
 * If the Log Upload checkbox is selected in the Management Cockpit, the client can upload a log file by calling sap.Logger.upload(). 
 * If the Log Upload checkbox is disabled in the Management Cockpit, the client does not upload the log file to the server. The attempt to upload causes an "HTTP/1.1 403 Forbidden" error. 
 * To support manual uploading of the log, you should implement a button or some other mechanism that calls sap.Logger.upload() when needed.
 * <br>
 * For the Logger plugin to upload a log file these conditions must be met: 1) Log Upload checkbox enabled In the Management Cockpit 2) sap.Logger.upload() is called by developer.
 * <br>
 * The expected work flow, with the current architecture consists of the following: <br>
 * 1) If a user has an issue that needs to be analyzed by an administrator or developer, the user reports the issue as appropriate.<br>
 * 2) The administrator, or developer, enables the log collection for the user on the SAP Mobile Platform server.<br> 
 * 3) The administrator lets the user know that he, or she, can upload log file. <br>
 * 4) The user uploads thelog file to the server, and the administrator gets the uploaded log file in the Management Cockpit.<br>
 * 5) The administrator sends the file to the developer to debug.
 * <br><br>
 *
 * Currently, on iOS, if the current log level is ERROR (default level), only ERROR level messages are displayed on the console 
 * even if other log level messages are generated. But if the current log level is DEBUG, INFO, or WARN, 
 * all generated log messages, regardless of log level, are displayed on the console. <br>
 * On Android, if the current log level is ERROR, only ERROR level messages are displayed in the Android logcat view (console).
 * if log level is INFO, then ERROR, WARN and INFO level messages are displayed in the Android logcat view (console).  
 * <br><br>
 *
 * When the Kapsel Settings plugin is added to the project, Settings will: 1) Get log level from the server 2) Set it into Logger on the client 
 * 3) Call sap.Logger.upload() after a logon success event, for example, when the app is launched or resumed and logon is successful. 
 * The Settings plugin retrieves the selected log level(type) from the Management Cockpit on the server,
 * sets the log level to Logger plugin, and then automatically uploads a log file to the server.
 * If the Settings plugin is not added to the project, a log file can be uploaded only by the developer calling the sap.Logger.upload() method manually.
 * To upload a log file automatically, settings plugin is required.
 * In the Management Cockpit, in the Client Logging dialog box, the Log Upload checkbox is able to enable or disable log file upload, and you can choose the log type(level). 
 * You can also view a list of the uploaded log files. On the server side, there are seven log types: NONE, FATAL, ERROR, WARNING, INFO, DEBUG and PATH. 
 * Since the Kapsel Logger plugin supports only DEBUG, INFO, WARN, and ERROR, the Logger plugin implicitly matches FATAL to ERROR, and PATH to DEBUG.
 * If NONE is set in the Management Cockpit, Logger sets it to default log level.
 * <br><br>
 * <b>Adding and Removing the Logger Plugin</b><br>
 * Add or remove the Logger plugin using the
 * <a href="http://cordova.apache.org/docs/en/edge/guide_cli_index.md.html#The%20Command-line%20Interface">Cordova CLI</a>.<br>
 * <br>
 * To add the Logger plugin to your project, use the following command:<br>
 * Cordova plugin add kapsel-plugin-logger<br>
 * <br>
 * To remove the Logger plugin from your project, use the following command:<br>
 * cordova plugin rm kapsel-plugin-logger
 * <br>
 * 
 * @namespace
 * @alias Logger
 * @memberof sap
 */

Logger = function () {
    /**
     * Formating for message
     * @private
     */
    var format = function (message) {
        if ((message === null) || (message === undefined)) {
            return "";
        }

        return message.toString();
    };
    /**
     * Log level comparison table. This table is used to define the loglevel priority
     * This all logelevel greater than the current level is included others are excluded.
     * @private
     */
    this.loglevelTable = {"ERROR":1,"WARN":2,"INFO":3,"DEBUG":4};
    
    /**
     * This function retuns true if the loglevel is appropriate to log. If the loglevel is lesser priority, it will retun false.
     * Logger uses this retun value to decide if the logging needs to go to the native bridge or not.
     * @private
     */
    this.isLogEnabled = function(level) {
        if (this.loglevelTable[level] <= this.loglevelTable[this.logLevel]) {
               return true;
        }
               //Default
               return false;
    };
               
    
    /**
     * Add a debug message to the log.
     * This function logs messages with the 'DEBUG' log level. 
     *
     * @memberof sap.Logger
     * @method debug
     * @param {String} message Log message to be logged.
     * @param {String} [tag]   Tag value added to the log entry used to indicate the source of the message (for example, SMP_LOGGER, SMP_AUTHPROXY).
     * @param {function} [successCallback]  Callback function called when the message has been successfully added to the log.
     *                                      No object will be passed to success callback.     
     * @param {function} [errorCallback]    Callback function called when an error occurs while adding the message to the log. 
     *                                      Since Kapsel Logger native code will always call the success callback function, the 
     *                                      errorCallback function will be executed by Cordova if an error or exception occurs 
     *                                      while making the call to the plugin.
     * @public
     * @memberof sap.Logger
     * @example
     * sap.Logger.debug("debug message", "DEBUG_TAG");
     */
    this.debug = function (message, tag, successCallback, errorCallback) {
        if (this.isLogEnabled("DEBUG") == true ) {
            exec(successCallback, errorCallback, "Logging", "logDebug", [format(message), tag]);
        }
    };

    /**
     * Add an info message to the log.
     * This function logs messages with the 'INFO' log level.
     * 
     * @memberof sap.Logger
     * @method info
     * @param {String} message Log message to be logged.
     * @param {String} [tag]   Tag value added to the log entry used to indicate the source of the message (for example, SMP_LOGGER, SMP_AUTHPROXY).
     * @param {function} [successCallback]  Callback function called when the message has been successfully added to the log.
     *                                      No object will be passed to success callback. 
     * @param {function} [errorCallback]    Callback function called when an error occurs while adding the message to the log. 
     *                                      Since Kapsel Logger native code will always call the success callback function, the 
     *                                      errorCallback function will be executed by Cordova if an error or exception occurs 
     *                                      while making the call to the plugin.
     * @public
     * @memberof sap.Logger
     * @example
     * sap.Logger.info("info message", "INFO_TAG");
     */
    this.info = function (message, tag, successCallback, errorCallback) {
        if (this.isLogEnabled("INFO") == true ) {
               exec(successCallback, errorCallback, "Logging", "logInfo", [format(message), tag]);
        }
    };

    /**
     * Add a warning message to the log.
     * This function logs messages with the 'WARN' log level.
     *
     * @memberof sap.Logger
     * @method warn
     * @param {String} message Log message to be logged.
     * @param {String} [tag]   Tag value added to the log entry used to indicate the source of the message (for example, SMP_LOGGER, SMP_AUTHPROXY).
     * @param {function} [successCallback]  Callback function called when the message has been successfully added to the log.
     *                                      No object will be passed to success callback.
     * @param {function} [errorCallback]    Callback function called when an error occurs while adding the message to the log. 
     *                                      Since Kapsel Logger native code will always call the success callback function, the 
     *                                      errorCallback function will be executed by Cordova if an error/exception occurs 
     *                                      while making the call to the plugin.
     * @public
     * @memberof sap.Logger
     * @example
     * sap.Logger.warn("warn message", "WARN_TAG");
     */
    this.warn = function (message, tag, successCallback, errorCallback) {
        if (this.isLogEnabled("WARN") == true ) {
               exec(successCallback, errorCallback, "Logging", "logWarning", [format(message), tag]);
        }
    };

    /**
     * Add an error message to the log.
     * This function logs messages with the 'ERROR' log level.
     *
     * @memberof sap.Logger
     * @method error 
     * @param {String} message Log message to be logged.
     * @param {String} [tag]   Tag value added to the log entry used to indicate the source of the message (for example, SMP_LOGGER, SMP_AUTHPROXY).
     * @param {function} [successCallback]  Callback function called when the message has been successfully added to the log.
     *                                      No object will be passed to success callback.
     * @param {function} [errorCallback]    Callback function called when an error occurs while adding the message to the log. 
     *                                      Since Kapsel Logger native code will always call the success callback function, the 
     *                                      errorCallback function will be executed by Cordova if an error or exception occurs 
     *                                      while making the call to the plugin.
     * @public
     * @memberof sap.Logger
     * @example
     * sap.Logger.error("error message", "ERROR_TAG");
     */
    this.error =  function (message, tag, successCallback, errorCallback) {
        if (this.isLogEnabled("ERROR") == true ) {
               exec(successCallback, errorCallback, "Logging", "logError", [format(message), tag]);
        }
    };

    /**
     * Set log level.
     * This function sets the log level for logging. <br>
     * Coverage of logging data in each log level:  DEBUG < INFO < WARN < ERROR. <br>
     * Following is the expected behavior to cover log messages at specific log levels: <br>
     *    ERROR : only ERROR messages <br>
     *    WARN  : ERROR and WARN messages <br>
     *    INFO  : ERROR, WARN and INFO <br>
     *    DEBUG : ERROR, WARN, INFO and DEBUG <br>
     * For example, if you want to get all log messages, you need to set the log to the 'Debug' level. 
     * If the WARN level is set, logging data contains WARN and ERROR messages. <br>
     * Default log level is ERROR.
     *
     * @memberof sap.Logger 
     * @method setLogLevel
     * @param {String} level Log level to set [DEBUG, INFO, WARN, ERROR]
     * @param {function} [successCallback] Callback function called when the log level has been successfully set. 
     *                                     No object will be passed to success callback.
     * @param {function} [errorCallback]   Callback function called when an error occurs while setting the log level. 
     *                                     Since Kapsel Logger native code will always call the success callback function, the 
     *                                     errorCallback function will be executed by Cordova if an error or exception occurs 
     *                                     while making the call to the plugin.
     * @memberof sap.Logger
     * @example
     * sap.Logger.setLogLevel(sap.Logger.DEBUG, successCallback, errorCallback);
     *
     * function successCallback() {
     *     alert("Log level set");
     * }
     *
     * function errorCallback() {
     *     alert("Failed to set log level");
     * }
     */
    this.setLogLevel = function (level, successCallback, errorCallback) {
        if (level.toLowerCase() === "fatal")
            level = "ERROR";
        else if (level.toLowerCase() === "path")
            level = "DEBUG";
        else if (level.toLowerCase() === "warn" || level.toLowerCase() === "warning") //setting plugin may use "warning"
            level = "WARN";
        else if (level.toLowerCase() === "debug")
            level = "DEBUG";
        else if (level.toLowerCase() === "info")
            level = "INFO";
        else if (level.toLowerCase() === "error")
            level = "ERROR";
        else if (level.toLowerCase() === "none")
            level = "ERROR";        
        
        this.logLevel = level;
        exec(successCallback, errorCallback, "Logging", "setLogLevel", [level]);
    };


/**
     * Set destination.
     * This function sets the destination for logging. <br>
     * NOTE: This function is available for Android and iOS only. Windows is not yet supported. <br>
     *
     * @memberof sap.Logger
     * @method setDestination
     * @param {Array} destination parameter [CONSOLE,FILESYSTEM]
     * @param {function} [successCallback] Callback function called when the log level has been successfully set.
     *                                     No object will be passed to success callback.
     * @param {function} [errorCallback]   Callback function called when an error occurs while setting the log level.
     *                                     Since Kapsel Logger native code will always call the success callback function, the
     *                                     errorCallback function will be executed by Cordova if an error or exception occurs
     *                                     while making the call to the plugin.
     * @example
     * sap.Logger.setDestination([sap.Logger.CONSOLE], successCallback, errorCallback);
     *
     * function successCallback() {
     *     alert("Destination set");
     * }
     *
     * function errorCallback() {
     *     alert("Failed to set destination");
     * }
     */
    this.setDestination = function (destination, successCallback, errorCallback) {
            exec(successCallback, errorCallback, "Logging", "setDestination", [destination]);
    };
 
    /**
     * Get log level. 
     * This function gets the current log level. 
     * Use this function to know what kind of log level messages can be generated and affected at the current log level.
     *
     * @memberof sap.Logger
     * @method getLogLevel
     * @param {function} successCallback Callback function called when the log level has been successfully retrieved. 
     *                                   When the current log level is successfully retrieved, it is fired with the current log level. [DEBUG, INFO, WARN, ERROR]
     *                                   Log level of String type will be passed to success callback. 
     *                                   Default log level is ERROR.
     * @param {function} [errorCallback] Callback function called when an error occurs while getting the current log level.  For this method, error callback is optional.
     *                                   Since Kapsel Logger native code will always call the success callback function, the 
     *                                   errorCallback function will be executed by Cordova if an error or exception occurs 
     *                                   while making the call to the plugin.
     * @memberof sap.Logger
     * @example
     * sap.Logger.getLogLevel(successCallback, errorCallback);
     * 
     * function successCallback(logLevel) {
     *     alert("Log level is " + logLevel);
     * }
     *
     * function errorCallback() {
     *     alert("Failed to get log level");
     * }
     */
    this.getLogLevel = function(successCallback, errorCallback) {
        exec(successCallback, errorCallback, "Logging", "getLogLevel",[]);
    };
  
    /**
     * Set the initial log level from native config. This will be the value until the setting exchange changes with what is there in the server.
     */
    var local = this;
    this.getLogLevel(
        function(logLevel){
            local.logLevel = logLevel;
            console.log('Set javacript initial log level: ' + logLevel);
        },
        function(error){
            //set to default log level if failed to get initial log level from native side
            local.logLevel = "ERROR";
            console.log('Fail to get loglevel. Set default javascript log level to ERROR');
        }
    );

    /**
     * Get log entries. 
     * This function gets the aggregated log entries from all loggers. 
     * Use this function to retrieve log entries with the given level produced during the current session till the point the API was called. 
     * (Currently, it's only for iOS. On Android, this function retrieves all log entries regardless of log level.)
     * 
     * @memberof sap.Logger
     * @method getLogEntries
     * @param {function} successCallback Callback function called when the log entries have been successfully retrieved. 
     *                                   When the current log entries are successfully retrieved, it is fired with the aggregated log entries.
     *                                   Log entries of String type will be passed to success callback. 
     * @param {function} errorCallback Callback function called when an error occurs while getting the aggregated log entries.
     * @memberof sap.Logger
     * @example
     * sap.Logger.getLogEntries(successCallback, errorCallback);
     * 
     * function successCallback(logEntries) {
     *     alert(logEntries);
     * }
     *
     * function errorCallback() {
     *     alert("Failed to get log entries");
     * }
     */
    this.getLogEntries = function(successCallback, errorCallback) {
        exec(successCallback, errorCallback, "Logging", "getLogEntries",[]);    
    };

	/**
	 * Get the log as a formatted string.  For the log viewer.
	 * @private
	 */
    this.getFormattedLog = function(successCallback, errorCallback) {
        exec(successCallback, errorCallback, "Logging", "getFormattedLog",[]);    
    };

    /**
     * Email the contents of the log as an attachment.
     * @memberof sap.Logger 
     * @method emailLog
     * @param {String} [to] email address to email log to
     * @param {String} [subject] the subject of the email
     * @param {String} [message] message placed in the body of the email
     * @param {function} [successCallback] Callback function called when the devices email application has been called with the log as an attachment. 
     * @param {function} [errorCallback]   Callback function called when an error occurs calling the devices email application.
     *
     * @memberof sap.Logger
     * @example
     * sap.Logger.emailLog();
     *
     * sap.Logger.emailLog('joe@someserver.com','The log','Please see the attached log.');
     */
     this.emailLog = function(to, subject, message, successCallback, errorCallback) {
         exec(successCallback, errorCallback, "Logging", "emailLog",[to,subject,message]);    
     };
	 
    /**
     * Clear the contents of the log.
     * @memberof sap.Logger
     * @method clearLog
     * @param {function} [successCallback] Callback function called when log has been successfully cleared.
     * @param {function} [errorCallback]   Callback function called when the log has failed to be cleared.
     *
     * @memberof sap.Logger
     * @example
     * sap.Logger.clearLog();
     */
     this.clearLog = function(successCallback, errorCallback) {
         exec(successCallback, errorCallback, "Logging", "clearLog",[]);
     };

    /**
     * Upload a log file, with log entries, to SAP Mobile Platform server.<br>
     * This function uploads a log file, which is helpful for collecting logging data from the app to trace bugs and issues.
     * It uploads a log file, which contains log entries based on log level.
     * Developers can access the log data in the Management Cockpit and/or a specific folder in installed server directly.<br><br>
     * 
     * On iOS, the uploaded log messages are filtered by the log level at upon upload. 
     * For example, when you upload a log file with an ERROR log level, the uploaded log messages contain only ERROR log level messages. 
     * When you upload log files with an INFO level, uploaded log messages contain ERROR, WARN, and INFO log level messages.
     * 
     * <br><br>
     * On Android, generated log messages are filtered "at the log level." 
     * In other words, the already generated and filtered log messages at another log level are not affected by the current log level. 
     * Log messages are not filtered upon upload. For example, if you set the log level to DEBUG log messages are filtered at four levels (DEBUG, INFO, WARN, and ERROR. 
     * Logger on Android has four log levels messages. So, if you set the log level to WARN and upload a log file, the log file has four log level messages that were already generated at the DEBUG level.  
     *
     * @memberof sap.Logger
     * @method upload 
     * @param {function} successCallback Callback function called when a log file is successfully uploaded to the server. 
     *                                   When a log file is successfully uploaded, it is fired. (with http statusCode and statusMessage for success)
     * @param {function} errorCallback   Callback function called when an error occurs while uploading a log file to the server. 
     *                                   If there is a connectivity error, such as an HTTP error, or unknown server error, 
     *                                   it is fired with http statusCode and statusMessage for error.
     * @public
     * @memberof sap.Logger
     * @example
     * sap.Logger.upload(successCallback, errorCallback);
     *
     * function successCallback() {
     *     alert("Upload Successful");
     * }
     *
     * function errorCallback(e) {
     *     alert("Upload Failed. Status: " + e.statusCode + ", Message: " + e.statusMessage);
     * }
     */
    this.upload =  function (successCallback, errorCallback) {
        sap.logon.Core.getState (function (result) {
                if(result.status === "new") {
                    errorCallback({statusCode : 0, statusMessage : "Logon in " + result.status + " state. Registration is required!!"});
                } else {
                    sap.Logon.unlock(function (connectionInfo) {
                            var uploadLog = function(){
                                 //Add application ID required for REST call
                                 connectionInfo.applicationId = sap.Logon.applicationId;
                                 exec(successCallback, errorCallback, "Logging", "uploadLog", [connectionInfo]);
                             }
                             if (device.platform.toLowerCase().indexOf("android") >= 0) {
                                 sap.AuthProxy.isInterceptingRequests(function(isInterceptingRequests){
                                    if (isInterceptingRequests) {
                                        connectionInfo["registrationContext"]["https"] = false;
                                        sap.AuthProxy.addHTTPSConversionHost(uploadLog,uploadLog,"https://"+connectionInfo["registrationContext"]["serverHost"]);
                                    } else {
                                        uploadLog();
                                    }
                                 }, function(){
                                    uploadLog();
                                 });
                             } else {
                                uploadLog();
                             }
                    }, function () {
                        errorCallback({statusCode : 0, statusMessage : "Logon failed"});
                    });
                } 
            },
            function (){
                errorCallback({statusCode : 0, statusMessage : "Failed to get current logon state."});
            }
        );
    };
}

/**
 * Constant variable for Error log level. It contains "ERROR" string.
 * @memberof sap.Logger
 * @constant
 * @type String
 * @example
 * sap.Logger.setLogLevel(sap.Logger.ERROR);
 */
Logger.prototype.ERROR = "ERROR";
    
/**
 * Constant variable for Warning log level. It contains "WARN" string.
 * @memberof sap.Logger
 * @constant
 * @type String
 * @example
 * sap.Logger.setLogLevel(sap.Logger.WARN);
 */
Logger.prototype.WARN = "WARN";

/**
 * Constant variable for Information log level. It contains "INFO" string.
 * @memberof sap.Logger
 * @constant
 * @type String
 * @example
 * sap.Logger.setLogLevel(sap.Logger.INFO);
 */
Logger.prototype.INFO = "INFO";
    
/**
 * Constant variable for Debug log level. It contains "DEBUG" string.
 * @memberof sap.Logger
 * @constant
 * @type String
 * @example
 * sap.Logger.setLogLevel(sap.Logger.DEBUG);
 */
Logger.prototype.DEBUG = "DEBUG";

/**
 * Constant variable for log destination. It contains "FILESYSTEM" string.
 * @memberof sap.Logger
 * @constant
 * @type String
 * @example
 * sap.Logger.setDestination(sap.Logger.FILESYSTEM);
 */
Logger.prototype.FILESYSTEM = "FILESYSTEM";

/**
 * Constant variable for log destination. It contains "CONSOLE" string.
 * @memberof sap.Logger
 * @constant
 * @type String
 * @example
 * sap.Logger.setDestination(sap.Logger.CONSOLE);
 */
Logger.prototype.CONSOLE = "CONSOLE";




//------------------------------------------------------------------------------
// copy of the original console object
//------------------------------------------------------------------------------
var WinConsole= window.console;
//------------------------------------------------------------------------------
// used for unimplemented methods
//------------------------------------------------------------------------------
var noop = function () { };
//------------------------------------------------------------------------------
// Timers
//------------------------------------------------------------------------------
var Timers = {};

    /**
     * Formats a string and arguments following it ala console.log()
     *
     * Any remaining arguments will be appended to the formatted string.
     *
     * for rationale, see FireBug's Console API:
     *    http://getfirebug.com/wiki/index.php/Console_API
     * @private
     */
var format = function(formatString, args) {
    return __format(arguments[0], [].slice.call(arguments,1)).join(' ');
};

    //------------------------------------------------------------------------------
    /**
     * Formats a string and arguments following it ala vsprintf()
     *
     * format chars:
     *   %j - format arg as JSON
     *   %o - format arg as JSON
     *   %c - format arg as ''
     *   %% - replace with '%'
     * any other char following % will format it's
     * arg via toString().
     *
     * Returns an array containing the formatted string and any remaining
     * arguments.
     * @private
     */
var __format = function (formatString, args) {
    if (formatString === null || formatString === undefined) return [""];
    if (arguments.length == 1) return [formatString.toString()];

    if (typeof formatString != "string")
        formatString = formatString.toString();

    var pattern = /(.*?)%(.)(.*)/;
    var rest    = formatString;
    var result  = [];

    while (args.length) {
        var match = pattern.exec(rest);
        if (!match) break;

        var arg   = args.shift();
        rest = match[3];
        result.push(match[1]);

        if (match[2] == '%') {
            result.push('%');
            args.unshift(arg);
            continue;
        }

        result.push(__formatted(arg, match[2]));
    }

    result.push(rest);

    var remainingArgs = [].slice.call(args);
    remainingArgs.unshift(result.join(''));
    return remainingArgs;
};

var __formatted = function(object, formatChar) {

    try {
        switch(formatChar) {
            case 'j':
            case 'o': return JSON.stringify(object);
            case 'c': return '';
        }
    }
    catch (e) {
        return "error JSON.stringify()ing argument: " + e;
    }

    if ((object === null) || (object === undefined)) {
        return Object.prototype.toString.call(object);
    }

    return object.toString();
};



Logger.prototype.console = {

    log: function (args) {

        sap.Logger.info(args, "CONSOLE", function () { }, function () { });
    },
    error: function (args) {
        // queue the message if not yet at deviceready
       
        sap.Logger.error(args, "CONSOLE", function () { }, function () { });
    },
    
    warn: function (args) {
        sap.Logger.warn(args, "CONSOLE", function () { }, function () { });
    },
    info: function (args) {
        sap.Logger.info(args, "CONSOLE", function () { }, function () { });
    },
    debug: function (args) {
        sap.Logger.debug(args, "CONSOLE", function () { }, function () { });
    },
    
    assert: function (expression) {
        if (expression) return;

        var message = format.apply(format, [].slice.call(arguments, 1));
        sap.Logger.error("ASSERT: " + message, function () { }, function () { });
    },
    clear: function () { },

    dir: function (object) {
        var message = format("%o", object);
        sap.Logger.info(message, "CONSOLE", function () { }, function () { });
    },

    dirxml: function (node) {
        sap.Logger.info(node.innerHTML, "CONSOLE", function () { }, function () { });
    },

    trace: noop,

    group: console.log,

    groupCollapsed: console.log,

    groupEnd: noop,

    time: function (name) {
        Timers[name] = new Date().valueOf();
    },

    timeEnd: function (name) {
        var timeStart = Timers[name];
        if (!timeStart) {
            sap.Logger.warn("unknown timer: " + name, "CONSOLE", function () { }, function () { });
            return;
        }

        var timeElapsed = new Date().valueOf() - timeStart;
        sap.Logger.info(name + ": " + timeElapsed + "ms", "CONSOLE", function () { }, function () { });
    },

    timeStamp: noop,

    profile: noop,

    profileEnd: noop,

    count: noop,

    exception: console.log,

    table: function (data, columns) {
        var message = format("%o", data);
        sap.Logger.info(message, "CONSOLE", function () { }, function () { });
    } 
}




    //------------------------------------------------------------------------------
    // return a new function that calls both functions passed as args
    //------------------------------------------------------------------------------
function wrappedOrigCall(orgFunc, newFunc) {
    return function () {
        if (!Logger.prototype.DeviceReady) {
            //var args = [].slice.call(arguments);
            //if (args.length > 1) {
            Logger.prototype.Queued.push(arguments);
            //} else {
            //    Logger.prototype.Queued.push
            //}
            return;
        }
        var args = [].slice.call(arguments);
        try { orgFunc.apply(WinConsole, args); } catch (e) { }
        try { newFunc.apply(console, args); } catch (e) { }
    };
}

    //------------------------------------------------------------------------------
    // For every function that exists in the original console object, that
    // also exists in the new console object, wrap the new console method
    // with one that calls both
    //------------------------------------------------------------------------------
for (var key in console) {
    if (typeof WinConsole[key] == "function") {
        console[key] = wrappedOrigCall(WinConsole[key], Logger.prototype.console[key]);
    }
}

Logger.prototype.DeviceReady = false;
Logger.prototype.Queued = [];


//    //------------------------------------------------------------------------------
//    // when deviceready fires, log queued messages
Logger.prototype.__onDeviceReady = function () {
    if (Logger.prototype.DeviceReady) return;

   Logger.prototype.DeviceReady = true;

   for (var i = 0; i < Logger.prototype.Queued.length; i++) {
       var messageArgs = Logger.prototype.Queued[i];
       var message = messageArgs[0];
       if (message.toLowerCase().match(/^fatal:/)) {
           console.error(message);
       }
       else if (message.toLowerCase().match(/^path:/)) {
           console.info(message);
       }
       else if (message.toLowerCase().match(/^warning:/)) {
           console.warn(message);
       }
       else if (message.toLowerCase().match(/^debug/)) {
           console.debug(message);
       }
       else if (message.toLowerCase().match(/^info:/)) {
           console.info(message);
       }
       else if (message.toLowerCase().match(/^error:/)) {
           console.error(message);
       }
       else {

           console.log(message);
           
       }
       
    }

    Logger.prototype.Queued = null;
};

//    // add a deviceready event to log queued messages
document.addEventListener("deviceready", Logger.prototype.__onDeviceReady, false);



module.exports = new Logger();

