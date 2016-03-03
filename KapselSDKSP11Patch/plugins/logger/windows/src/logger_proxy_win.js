	var exec = require("cordova/exec");

	module.exports = {
		_loglevel: -1,
		_fileName: "emailLog.txt",
		_file: null,
		_WinConsole: window.console,
		_nativeLoggerInstance: new SAP.Logger.Logger(),
		_loggerId: "kapsel",
		setLogLevel: function (successCB, errorCB, args) {
			loglevel = args[0];
			module.exports._loglevel = loglevel;
			module.exports._nativeLoggerInstance.setLogLevel(loglevel).then(
              function () { successCB(); }, function () { errorCB(); });;

		},

		getLogLevel: function (sucessCB, errorCB, arg) {
			sucessCB(module.exports._loglevel);
		},

		getLogger: function (sucessCB, errorCB, logName) {
			return new LoggerPlugin.Logger().getLogger(logName);
		},



		logInfo: function (successCB, errorCB, args) {
			logtext = args[0];
			tag = args[1];
			module.exports._nativeLoggerInstance.logInfo(module.exports._loggerId, tag + ": " + logtext).then(
			   function () { successCB(); }, function () { errorCB(); });
		},

		logWarning: function (successCB, errorCB, args) {
			logtext = args[0];
			tag = args[1];
			module.exports._nativeLoggerInstance.logWarning(module.exports._loggerId, tag + ": " + logtext).then(
              function () { successCB(); }, function () { errorCB(); });

		},

		logError: function (successCB, errorCB, args) {
			logtext = args[0];
			tag = args[1];
			module.exports._nativeLoggerInstance.logError(module.exports._loggerId, tag + ": " + logtext).then(
              function () { successCB(); }, function () { errorCB(); });

		},

		logFatal: function (successCB, errorCB, args) {
			logtext = args[0];
			tag = args[1];
			module.exports._nativeLoggerInstance.logFatal(module.exports._loggerId, tag + ": " + logtext).then(
              function () { successCB(); }, function () { errorCB(); });
		},
		logDebug: function (successCB, errorCB, args) {
			logtext = args[0];
			tag = args[1];
			module.exports._nativeLoggerInstance.logDebug(module.exports._loggerId, tag + ": " + logtext).then(
              function () {
              	successCB();
              },
            function () {
            	errorCB();
            });
		},
		log: function (successCB, errorCB, args) {
			logtext = args[0];
			tag = args[1];
			module.exports._nativeLoggerInstance.log(module.exports._loggerId, tag + ": " + logtext).then(
              function () { successCB(); }, function () { errorCB(); });
		},

		uploadLog: function (successCB, errorCB, connectioninfo) {
			// url = "http://smpqa12-02.sybase.com/logFile/appconnectionid";
			var context = connectioninfo[0].registrationContext;
			var scheme = context.https ? "https" : "http";
			var host = context.serverHost + ":" + context.serverPort;
			var url = scheme + "://" + host + "/clientlogs/";
			//var url = scheme+"://"+host + "/logFile/" + connectioninfo[0].applicationConnectionId;
			module.exports._nativeLoggerInstance.uploadLog(url, connectioninfo[0].applicationConnectionId, connectioninfo[0].registrationContext.mobileUser, connectioninfo[0].registrationContext.password).then(function () { successCB(); }, function () { errorCB(); });
		},
		getLogEntries: function (successCB, errorCB) {
			module.exports._nativeLoggerInstance.getLogEntries().then(function (serializedLogEntries) {
				var result = '';
				var currentLog;
				var logEntries = JSON.parse(serializedLogEntries);

				for (var i = 0; i < logEntries.length; i++) {
					currentLog = logEntries[i];
					result += currentLog.message + '\n';
				}

				successCB(result);
			}, errorCB);
		},
		getFormattedLog: function (successCB, errorCB) {
			module.exports._nativeLoggerInstance.getLogEntries().then(function (serializedLogEntries) {
				var result = '';
				var currentLog;
				var logEntries = JSON.parse(serializedLogEntries);

				for (var i = 0; i < logEntries.length; i++) {
					currentLog = logEntries[i];

					result += '<tr class=\"' + (i % 2 == 0 ? 'odd' : 'even') + '\">' +
						'<td>' + currentLog.entryDateTime + ' ' + currentLog.sourceName + ' ' + getLogLevel(currentLog) + ' ' + currentLog.message + '</td></tr>';
				}

				successCB(result);
			}, errorCB);
		},
		emailLog: function (successCB, errorCB, args) {
			var to = args[0];
			var subject = args[1];
			var message = args[2];

			module.exports._nativeLoggerInstance.getLogEntries().then(
              function (serializedLogEntries) {
              	var result = '';
              	var currentLog;
              	var logEntries = JSON.parse(serializedLogEntries);

              	for (var i = 0; i < logEntries.length; i++) {
              		currentLog = logEntries[i];
              		result += currentLog.entryDateTime + ' ' + currentLog.sourceName + ' ' + getLogLevel(currentLog) + ' ' + currentLog.message + '\n';
              	}

              	var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
              	dataTransferManager.addEventListener("datarequested", shareFileWithLocalSave);
              	Windows.ApplicationModel.DataTransfer.DataTransferManager.showShareUI();

              	function shareFileWithLocalSave(event) {
              		dataTransferManager.removeEventListener('datarequested', shareFileWithLocalSave);

              		var request = event.request;
              		request.data.properties.title = subject ? subject : ' ';

              		if (message) {
              			request.data.setText(message);
              		}

              		var deferral = request.getDeferral();

              		try {
              			Windows.Storage.ApplicationData.current.localFolder.createFileAsync(module.exports._fileName, Windows.Storage.CreationCollisionOption.replaceExisting).done(function (file) {
              				file.openTransactedWriteAsync().then(function (transaction) {
              					var dataWriter = new Windows.Storage.Streams.DataWriter(transaction.stream);
              					dataWriter.writeString(result);
              					dataWriter.storeAsync().then(function (size) {
              						transaction.stream.size = size; // reset stream size to override the file
              						transaction.commitAsync().done(function () {
              							transaction.close();
              							transaction.stream.close();
              							request.data.setStorageItems([file]);
              							deferral.complete();
              							successCB();
              						}, deferralErrorHandling);
              					}, deferralErrorHandling);
              				}, deferralErrorHandling)
              			}, deferralErrorHandling);
              		} catch (error) {
              			deferralErrorHandling(error);
              		}

              		function deferralErrorHandling(error) {
              			deferral.complete();
              			errorCB(error);
              		}
              	};

              }, errorCB);
		},

		clearLog: function (successCB, errorCB) {
		    module.exports._nativeLoggerInstance.wipeClientLogs().then(
                function () { successCB(); }, function (error) { errorCB(error); }
            );
	    }
	};

	var formatter = new Windows.Globalization.DateTimeFormatting.DateTimeFormatter("{year.full}-{month.integer(2)}-{day.integer(2)} {hour.integer}:{minute.integer(2)}:{second.integer(2)}{period.abbreviated}", [Windows.System.UserProfile.GlobalizationPreferences.languages[0], "en-US"],
		new Windows.Globalization.GeographicRegion().code,
		Windows.Globalization.CalendarIdentifiers.gregorian,
		Windows.Globalization.ClockIdentifiers.twentyFourHour);

	function getFormattedLogDateFormat(dateTime) {
		return formatter.format(dateTime) + '.' + dateTime.getMilliseconds();
	}

	function getLogLevel(logEntry) {
		switch (logEntry.severity) {
			case SAP.Supportability.Logging.ClientLogLevel.fatal:
				return 'FATAL';
			case SAP.Supportability.Logging.ClientLogLevel.error:
				return 'ERROR';
			case SAP.Supportability.Logging.ClientLogLevel.warning:
				return 'WARNING';
			case SAP.Supportability.Logging.ClientLogLevel.info:
				return 'INFO';
			case SAP.Supportability.Logging.ClientLogLevel.debug:
				return 'DEBUG';
			case SAP.Supportability.Logging.ClientLogLevel.all:
				return 'ALL';
			case SAP.Supportability.Logging.ClientLogLevel.none:
			default:
				return 'NONE';
		}
	}

	require("cordova/exec/proxy").add("Logging", module.exports);

