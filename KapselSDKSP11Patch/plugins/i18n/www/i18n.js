// 3.11.4-SNAPSHOT
var exec = require('cordova/exec');
var defaultLocale = "en";

function getUserLocale() {
    var locale;

    // Workaround for Android 2.3.x
    if (navigator && navigator.userAgent && (androidLang = navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
        locale = androidLang[1];
    } else {
        locale = navigator.userLanguage || navigator.language;
    }

    locale = locale.replace('-', '_').toLowerCase();

    if (locale.length > 3) {
        locale = locale.substring(0, 3) + locale.substring(3).toUpperCase();
    }
               
    return locale;
}

function loadMessages(i18n, callback) {
    // Messages are loaded in the following order language_territory, language, and default
    // eg.  messages_en_us.json, messages_en.json, messages_{default}.json
    var userLocale = getUserLocale(),
        lang = userLocale.split('_')[0],
        locales = [userLocale];

    i18n.messages = {};

    // Could be en_US and en
    if (userLocale !== lang) {
        locales.push(lang);
    }

    if (locales.indexOf(defaultLocale) === -1) {
        locales.push(defaultLocale); // Default
    }
    
    exec(function(propertiesStrings) {
        if (propertiesStrings)
        {
            for (var i = 0; i < locales.length; i++) {
                var locale = locales[i];
                if (locale in propertiesStrings) {
                    i18n.messages[locale] = parse(propertiesStrings[locale]);
                }
            }
        }

        if (callback) {
            callback(i18n);
        }
    }, callback, 'i18n', 'getMessages', [locales, i18n.path, i18n.name]);
}

var i18n = function (options) {
    this.name = options.name ? options.name : "messages";
    this.path = options.path;
    this.messages = null;
}

i18n.prototype.get = function (key, defaultValue) {
    var value = undefined;
    for (var locale in this.messages) {
        if (this.messages[locale][key]) {
            value = this.messages[locale][key];
            break;
        }
    }
    
    if (typeof (value) == "string") {
        // Found a value for the current locale, return it.
        return value;
    }  else {
        // Try english.
        value = this.messages['en'][key];
        if (typeof (value) == "string") {
            // Found a value for english, return it.
            return value;
        }
    }

    // No value found.  Return with default value if it is possible.
    if(defaultValue) {
        return defaultValue;
    }
    
    // No value found.  Return the key to help track the problem down.
    return key;
}

module.exports.load = function (options, callback) {
    var bundle = new i18n(options);
    loadMessages(bundle, callback);
}

// -----------------------------------------------------------------------------
// The following, with some modifications, was taken from:
// https://sapui5.netweaver.ondemand.com/resources/jquery.sap.properties-dbg.js

/**
 * RegExp used to split file into lines, also removes leading whitespace.
 * Note: group must be non-capturing, otherwise the line feeds will be part of the split result.
 * @private
 */
var rLines = /(?:^|\r\n|\r|\n)[ \t\f]*/;

/**
 * RegExp that handles escapes, continuation line markers and key/value separators
 * 
 *              [---unicode escape--] [esc] [cnt] [---key/value separator---]
 * @private
 */
var rEscapes = /(\\u[0-9a-fA-F]{0,4})|(\\.)|(\\$)|([ \t\f]*[ \t\f:=][ \t\f]*)/g;

/**
 * Special escape characters as supported by properties format
 * @see JDK API doc for java.util.Properties
 * @private
 */
var mEscapes = {
    '\\f' : '\f',
    '\\n' : '\n',
    '\\r' : '\r',
    '\\t' : '\t'
};

/**
 * RegExp for parsing out comments, including comments at the end of a line.
 * @private
 */
var rComments =  /(.*?)([^\\\\][\!|#].*)/;

function stripCommentOut(line) {
    var parts = rComments.exec(line);
    if (parts != null) {
        line = parts[1];
    }
    return line;
}

/*
 * Parses the given text sText, and returns a dictonary of values.
 * @param {string} sText the text to parse
 * @private
 */
function parse(sText) {
    
    var aLines = sText.split(rLines), // split file into lines
        sLine,sKey,sValue,bKey,i,m,iLastIndex;
    
    mProperties = {};

    for (i = 0; i < aLines.length; i++) {
        sLine = aLines[i];
        sLine = stripCommentOut(sLine);
        // ignore empty lines
        if (sLine === "" || sLine.charAt(0) === "#" || sLine.charAt(0) === "!" ) {
            continue;
        }

        rEscapes.lastIndex = iLastIndex = 0;
        sValue = "";
        bKey = true;

        while ( (m = rEscapes.exec(sLine)) !== null ) {
            // handle any raw, unmatched input
            if ( iLastIndex < m.index ) {
                sValue += sLine.slice(iLastIndex, m.index);
            }
            iLastIndex = rEscapes.lastIndex;
            if ( m[1] ) {
                // unicode escape
                if ( m[1].length !== 6 ) {
                    throw new Error("Incomplete Unicode Escape '" + m[1] + "'");
                }
                sValue += String.fromCharCode(parseInt(m[1].slice(2), 16));
            } else if ( m[2] ) {
                // special or simple escape
                sValue += mEscapes[m[2]] || m[2].slice(1);
            } else if ( m[3] ) {
                // continuation line marker
                sLine = aLines[++i];
                rEscapes.lastIndex = iLastIndex = 0;
            } else if ( m[4] ) {
                // key/value separator                  
                if ( bKey ) {
                    bKey = false;
                    sKey = sValue;
                    sValue = "";
                } else {
                    sValue += m[4];
                }
            }
        }
        if ( iLastIndex < sLine.length ) {
            sValue += sLine.slice(iLastIndex);
        }
        if ( bKey ) {
            sKey = sValue;
            sValue = "";
        }
        mProperties[sKey] = sValue;
    }
    return mProperties;
}
//------------------------------------------------------------------------------
