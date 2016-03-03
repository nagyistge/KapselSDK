package com.sap.kapsel.inappbrowser;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.LOG;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.xwalk.core.XWalkJavascriptResult;
import org.xwalk.core.XWalkUIClient;
import org.xwalk.core.XWalkView;

public class XWalkInAppUIClient extends XWalkUIClient {

    private CordovaWebView webView;
    private String LOG_TAG = "InAppChromeClient";
    private long MAX_QUOTA = 100 * 1024 * 1024;

    public XWalkInAppUIClient(XWalkView view, CordovaWebView webView) {
        super(view);
        this.webView = webView;
    }

    /**
     * Tell the client to display a prompt dialog to the user.
     * If the client returns true, WebView will assume that the client will
     * handle the prompt dialog and call the appropriate JsPromptResult method.
     *
     * The prompt bridge provided for the InAppBrowser is capable of executing any
     * oustanding callback belonging to the InAppBrowser plugin. Care has been
     * taken that other callbacks cannot be triggered, and that no other code
     * execution is possible.
     *
     * To trigger the bridge, the prompt default value should be of the form:
     *
     * gap-iab://<callbackId>
     *
     * where <callbackId> is the string id of the callback to trigger (something
     * like "InAppBrowser0123456789")
     *
     * If present, the prompt message is expected to be a JSON-encoded value to
     * pass to the callback. A JSON_EXCEPTION is returned if the JSON is invalid.
     *
     * @param view
     * @param url
     * @param message
     * @param defaultValue
     * @param result
     */
    @Override
    public boolean onJavascriptModalDialog (XWalkView view, JavascriptMessageType type, String url, String message, String defaultValue, XWalkJavascriptResult result) {
    //public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, JsPromptResult result) {
        if (type == JavascriptMessageType.JAVASCRIPT_PROMPT) {
            // See if the prompt string uses the 'gap-iab' protocol. If so, the remainder should be the id of a callback to execute.
            if (defaultValue != null && defaultValue.startsWith("gap")) {
                if (defaultValue.startsWith("gap-iab://")) {
                    PluginResult scriptResult;
                    String scriptCallbackId = defaultValue.substring(10);
                    if (scriptCallbackId.startsWith("InAppBrowser")) {
                        if (message == null || message.length() == 0) {
                            scriptResult = new PluginResult(PluginResult.Status.OK, new JSONArray());
                        } else {
                            try {
                                scriptResult = new PluginResult(PluginResult.Status.OK, new JSONArray(message));
                            } catch (JSONException e) {
                                scriptResult = new PluginResult(PluginResult.Status.JSON_EXCEPTION, e.getMessage());
                            }
                        }
                        this.webView.sendPluginResult(scriptResult, scriptCallbackId);
                        result.confirm();
                        return true;
                    }
                } else {
                    // Anything else with a gap: prefix should get this message
                    LOG.w(LOG_TAG, "InAppBrowser does not support Cordova API calls: " + url + " " + defaultValue);
                    result.cancel();
                    return true;
                }
            }
            return false;
        }
        else {
            return super.onJavascriptModalDialog(view, type, url, message, defaultValue, result);
        }
    }
}
