//error handling JS code


jQuery.sap.require("jquery.sap.resources");
var locale = sap.ui.getCore().getConfiguration().getLanguage();
var i18n = jQuery.sap.resources({'url' : "i18n.properties", 'locale': locale});
var i18nProvider = jQuery.sap.resources({'url' : "i18n.provider.properties", 'locale': locale});

window.getLocalizedString = function(key){
    var localizedValue = i18n.getText(key);
    if (localizedValue == key){
       //try to get the localized string from provider's resource to get value
       localizedValue = i18nProvider.getText(key);
    }
    return localizedValue;
}

function getGETParameters() {
    var queryString = window.location.search.substr(1);
    var decodedQueryString = decodeURIComponent (queryString); //for checkmark security scan

    return decodedQueryString != null && decodedQueryString != "" ? transformToAssocArray(decodedQueryString) : {};
}

function transformToAssocArray( queryString ) {
    var params = {};
    var prmarr = queryString.split("&");
    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split(/=(.+)?/); // split string only on first occurance

        params[tmparr[0]] = encodeURIComponent(tmparr[1]); //for checkmark security scan. encode all queryString values in JS level
    }
    return params;
}


function getPageUrl(){
    var params = getGETParameters();
    return params['failingUrl'];
}

function getErrorType(){
    var params = getGETParameters();
    return params['errorType'];
}


function getHTMLEscapedUrl(url){
	return url.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/'/g, "&#x27;").replace(/\"/g, "&quot;").replace(/\//g, "&#x2F;");
}


function updatePageUrl(){
    var url = getHTMLEscapedUrl(decodeURIComponent(getPageUrl()));
	document.getElementById('pageAddressSpan').innerHTML = url;
}


