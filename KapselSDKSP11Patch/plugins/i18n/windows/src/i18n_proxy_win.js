module.exports = {
    getMessages: function (win, fail, args) {
        var locales = args[0];
        var path = args[1];
        var name = args[2];

        var result = {};
        var count = locales.length;

        // recursive call
        iterateOverLocales(locales, path, name, 0, result, function (result) {
            win(result);
        }, function (error) {
            fail && fail(error);
        });
    }
}

// Recursive operation
function iterateOverLocales(locales, path, name, index, result, success, fail) {
    if (index === locales.length) {
        success(result);
    }
    else {
        var locale = locales[index];
        var fileName = getFilePath(locale, path, name);

        getTranslations(fileName,
            function (translations) {
                result[locale] = translations;
                iterateOverLocales(locales, path, name, index + 1, result, success, fail);
            },
            function (error) {
                iterateOverLocales(locales, path, name, index + 1, result, success, fail);
            });
    }
}

var getFilePath = function (locale, path, name) {
	var result = path + "/" + name;

	if (locale) {
		result += "_" + locale;
	}
	
	result += ".properties";

	return result;
}

var getTranslations = function (fileName, success, fail) {
    var uri = new Windows.Foundation.Uri("ms-appx:///www/" + fileName);
    Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).done(
        function (file) {
            WinJS.xhr({ url: uri.toString() }).done(function (response) {
                success(response.responseText);
            }, function (error) {
                fail(error);
            });

        },
        function (error) {
            // error accessing file.
            console.log("error accessing: " + fileName);
            fail(error);
        }
  );
}

// This should be the service name used in cordova exec that this class is proxying. 
require("cordova/exec/proxy").add("i18n", module.exports);
