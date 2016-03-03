/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/
package com.sap.kapsel.inappbrowser;

import android.annotation.SuppressLint;

import org.apache.cordova.CordovaArgs;
import org.apache.cordova.inappbrowser.InAppBrowser;
import org.apache.cordova.inappbrowser.InAppBrowserDialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.res.Resources;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.text.InputType;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.WindowManager.LayoutParams;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;
import android.webkit.DownloadListener;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.LOG;
import org.apache.cordova.PluginResult;
import org.json.JSONException;
import org.json.JSONObject;
import org.xwalk.core.XWalkDownloadListener;
import org.xwalk.core.XWalkNavigationHistory;
import org.xwalk.core.XWalkResourceClient;
import org.xwalk.core.XWalkUIClient;
import org.xwalk.core.XWalkView;
import org.xwalk.core.XWalkCookieManager;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;

public class XWalkInAppBrowser extends InAppBrowser {

    protected static final String LOG_TAG = "InAppBrowser";
    private static final String EXIT_EVENT = "exit";
    private static final String LOCATION = "location";
    private static final String HIDDEN = "hidden";
    private static final String LOAD_START_EVENT = "loadstart";
    private static final String LOAD_STOP_EVENT = "loadstop";
    private static final String LOAD_ERROR_EVENT = "loaderror";
    private static final String BACK_BUTTON_EVENT = "backbutton"; // Patch - Add back button event support
    private static final String CLEAR_ALL_CACHE = "clearcache";
    private static final String CLEAR_SESSION_CACHE = "clearsessioncache";
    private static final String HARDWARE_BACK_BUTTON = "hardwareback";
    private static final String OVERRIDE_BACK_BUTTON = "overridebackbutton"; // Patch - Add back button event support

    private InAppBrowserDialog dialog;
    private XWalkView inAppWebView;
    private EditText edittext;
    private CallbackContext callbackContext;
    private boolean showLocationBar = true;
    private boolean openWindowHidden = false;
    private boolean clearAllCache= false;
    private boolean clearSessionCache=false;
    private boolean hadwareBackButton=true;
    private boolean overrideBackButton = false; // Patch - Add back button event support

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action        The action to execute.
     * @param args          JSONArry of arguments for the plugin.
     * @param callbackContext    The callback context used when calling back into JavaScript.
     * @return              A PluginResult object with a status and message.
     */
    public boolean execute(String action, CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
        // TODO: Modify IAB to make injectDeferredObject public
        // TODO: Refactor show so we can override
        // TODO: protected callbackContext;
        if (action.equals("open")) {
            this.callbackContext = callbackContext;
            return super.execute(action, args, callbackContext);
        }
        else if (action.equals("injectScriptCode")) {
            String jsWrapper = null;
            if (args.getBoolean(1)) {
                jsWrapper = String.format("prompt(JSON.stringify([eval(%%s)]), 'gap-iab://%s')", callbackContext.getCallbackId());
            }
            injectDeferredObject(args.getString(0), jsWrapper);
        }
        else if (action.equals("injectScriptFile")) {
            String jsWrapper;
            if (args.getBoolean(1)) {
                jsWrapper = String.format("(function(d) { var c = d.createElement('script'); c.src = %%s; c.onload = function() { prompt('', 'gap-iab://%s'); }; d.body.appendChild(c); })(document)", callbackContext.getCallbackId());
            } else {
                jsWrapper = "(function(d) { var c = d.createElement('script'); c.src = %s; d.body.appendChild(c); })(document)";
            }
            injectDeferredObject(args.getString(0), jsWrapper);
        }
        else if (action.equals("injectStyleCode")) {
            String jsWrapper;
            if (args.getBoolean(1)) {
                jsWrapper = String.format("(function(d) { var c = d.createElement('style'); c.innerHTML = %%s; d.body.appendChild(c); prompt('', 'gap-iab://%s');})(document)", callbackContext.getCallbackId());
            } else {
                jsWrapper = "(function(d) { var c = d.createElement('style'); c.innerHTML = %s; d.body.appendChild(c); })(document)";
            }
            injectDeferredObject(args.getString(0), jsWrapper);
        }
        else if (action.equals("injectStyleFile")) {
            String jsWrapper;
            if (args.getBoolean(1)) {
                jsWrapper = String.format("(function(d) { var c = d.createElement('link'); c.rel='stylesheet'; c.type='text/css'; c.href = %%s; d.head.appendChild(c); prompt('', 'gap-iab://%s');})(document)", callbackContext.getCallbackId());
            } else {
                jsWrapper = "(function(d) { var c = d.createElement('link'); c.rel='stylesheet'; c.type='text/css'; c.href = %s; d.head.appendChild(c); })(document)";
            }
            injectDeferredObject(args.getString(0), jsWrapper);
        }
        else if (action.equals("show")) {
            this.cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    dialog.show();
                }
            });
            PluginResult pluginResult = new PluginResult(PluginResult.Status.OK);
            pluginResult.setKeepCallback(true);
            this.callbackContext.sendPluginResult(pluginResult);
        }
        else {
            return super.execute(action, args, callbackContext);
        }

        return true;
    }

    // Kapsel change  - needed for js debugging in Chrome
    @Override
    protected void pluginInitialize() {
        super.pluginInitialize();

        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
        ApplicationInfo appInfo = webView.getContext().getApplicationContext().getApplicationInfo();
        if ((appInfo.flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0 &&
                android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            try {
                WebView.setWebContentsDebuggingEnabled(true);
            } catch (IllegalArgumentException e) {
                Log.e(LOG_TAG, "Failed to set debugging for Webview!");
            }
        }
            }
        });
     }
    // Kapsel change end

    /**
     * Called when the view navigates.
     */
    @Override
    public void onReset() {
        closeDialog();
    }

    /**
     * Called by AccelBroker when listener is to be shut down.
     * Stop listener.
     */
    public void onDestroy() {
        closeDialog();
    }

    /**
     * Inject an object (script or style) into the InAppBrowser WebView.
     *
     * This is a helper method for the inject{Script|Style}{Code|File} API calls, which
     * provides a consistent method for injecting JavaScript code into the document.
     *
     * If a wrapper string is supplied, then the source string will be JSON-encoded (adding
     * quotes) and wrapped using string formatting. (The wrapper string should have a single
     * '%s' marker)
     *
     * @param source      The source object (filename or script/style text) to inject into
     *                    the document.
     * @param jsWrapper   A JavaScript string to wrap the source string in, so that the object
     *                    is properly injected, or null if the source string is JavaScript text
     *                    which should be executed directly.
     */
    private void injectDeferredObject(String source, String jsWrapper) {
        String scriptToInject;
        if (jsWrapper != null) {
            org.json.JSONArray jsonEsc = new org.json.JSONArray();
            jsonEsc.put(source);
            String jsonRepr = jsonEsc.toString();
            String jsonSourceString = jsonRepr.substring(1, jsonRepr.length()-1);
            scriptToInject = String.format(jsWrapper, jsonSourceString);
        } else {
            scriptToInject = source;
        }
        final String finalScriptToInject = scriptToInject;
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                inAppWebView.evaluateJavascript(finalScriptToInject, null);
            }
        });
    }

    /**
     * Closes the dialog
     */
    public void closeDialog() {
        final XWalkView childView = this.inAppWebView;
        // The JS protects against multiple calls, so this should happen only when
        // closeDialog() is called by other native code.
        if (childView == null) {
            return;
        }
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                childView.setResourceClient(new XWalkResourceClient(childView) {
                    // NB: wait for about:blank before dismissing
                    public void onLoadFinished(XWalkView view, String url) {
                        if (dialog != null) {
                            dialog.dismiss();
                        }
                    }
                });

                // NB: From SDK 19: "If you call methods on WebView from any thread
                // other than your app's UI thread, it can cause unexpected results."
                // http://developer.android.com/guide/webapps/migrating.html#Threads
                childView.load("about:blank", null);
            }
        });

        try {
            JSONObject obj = new JSONObject();
            obj.put("type", EXIT_EVENT);
            sendUpdate(obj, false);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Should never happen");
        }
    }

    /**
     * Checks to see if it is possible to go back one page in history, then does so.
     */
    public void goBack() {
        if (this.inAppWebView.getNavigationHistory().canGoBack()) {
            this.inAppWebView.getNavigationHistory().navigate(XWalkNavigationHistory.Direction.BACKWARD, 1);
        }
    }

    /**
     * Can the web browser go back?
     * @return boolean
     */
    public boolean canGoBack() {
        return this.inAppWebView.getNavigationHistory().canGoBack();
    }

    /**
     * Has the user set the hardware back button to go back
     * @return boolean
     */
    public boolean hardwareBack() {
        return hadwareBackButton;
    }

    /**
     * Checks to see if it is possible to go forward one page in history, then does so.
     */
    private void goForward() {
        if (this.inAppWebView.getNavigationHistory().canGoForward()) {
            this.inAppWebView.getNavigationHistory().navigate(XWalkNavigationHistory.Direction.FORWARD, 1);
        }
    }

    /**
     * Navigate to the new page
     *
     * @param url to load
     */
    private void navigate(String url) {
        InputMethodManager imm = (InputMethodManager)this.cordova.getActivity().getSystemService(Context.INPUT_METHOD_SERVICE);
        imm.hideSoftInputFromWindow(edittext.getWindowToken(), 0);

        if (!url.startsWith("http") && !url.startsWith("file:")) {
            this.inAppWebView.load("http://" + url, null);
        } else {
            this.inAppWebView.load(url, null);
        }
        this.inAppWebView.requestFocus();
    }


    /**
     * Should we show the location bar?
     *
     * @return boolean
     */
    private boolean getShowLocationBar() {
        return this.showLocationBar;
    }

    private InAppBrowser getInAppBrowser(){
        return this;
    }

    /**
     * Display a new browser with the specified URL.
     *
     * @param url           The url to load.
     * @param features
     */
    public String showWebPage(final String url, HashMap<String, Boolean> features) {
        // Determine if we should hide the location bar.
        showLocationBar = true;
        openWindowHidden = false;
        if (features != null) {
            Boolean show = features.get(LOCATION);
            if (show != null) {
                showLocationBar = show.booleanValue();
            }
            Boolean hidden = features.get(HIDDEN);
            if (hidden != null) {
                openWindowHidden = hidden.booleanValue();
            }
            Boolean hardwareBack = features.get(HARDWARE_BACK_BUTTON);
            if (hardwareBack != null) {
                hadwareBackButton = hardwareBack.booleanValue();
            }
            Boolean cache = features.get(CLEAR_ALL_CACHE);
            if (cache != null) {
                clearAllCache = cache.booleanValue();
            } else {
                cache = features.get(CLEAR_SESSION_CACHE);
                if (cache != null) {
                    clearSessionCache = cache.booleanValue();
                }
            }
            // Patch - Support back button event - Start
            Boolean overrideBack = features.get(OVERRIDE_BACK_BUTTON);
            if (overrideBack != null) {
                overrideBackButton = overrideBack.booleanValue();
            } else {
                // if it's not provided, explicitly set overrideBackButton to false
                // since it could be true from the last time showWebPage was called.
                overrideBackButton = false;
            }
            // Patch - Support back button event - End
        }

        final CordovaWebView thatWebView = this.webView;

        // Create dialog in new thread
        Runnable runnable = new Runnable() {
            /**
             * Convert our DIP units to Pixels
             *
             * @return int
             */
            private int dpToPixels(int dipValue) {
                int value = (int) TypedValue.applyDimension( TypedValue.COMPLEX_UNIT_DIP,
                                                            (float) dipValue,
                                                            cordova.getActivity().getResources().getDisplayMetrics()
                );

                return value;
            }

            @SuppressLint("NewApi")
            public void run() {
                // kapsel change - avoid leaking dialogs that become unclosable.
                if (dialog != null && dialog.isShowing()){
                    dialog.dismiss();
                }
                // kapsel change end
                // Let's create the main dialog
                dialog = new InAppBrowserDialog(cordova.getActivity(), android.R.style.Theme_NoTitleBar) {
                    @Override
                    public boolean onKeyDown(int keyCode, KeyEvent event) {

                        if (overrideBackButton && keyCode == KeyEvent.KEYCODE_BACK) {
                            try {
                                JSONObject obj = new JSONObject();
                                obj.put("type", BACK_BUTTON_EVENT);
                                sendUpdate(obj, true);
                            } catch (JSONException e) {
                                Log.d(LOG_TAG, "Should never happen");
                            }

                            return true;
                        } else {
                            return super.onKeyDown(keyCode, event);
                        }
                    }
                };
                dialog.getWindow().getAttributes().windowAnimations = android.R.style.Animation_Dialog;
                // kapsel change: set FLAG_SECURE to hide screenshot on inappbrowser for appswitcher
                dialog.getWindow().setFlags(LayoutParams.FLAG_SECURE, LayoutParams.FLAG_SECURE);
                // kapsel change end
                dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
                dialog.setCancelable(true);
                dialog.setInAppBroswer(getInAppBrowser());

                // Main container layout
                LinearLayout main = new LinearLayout(cordova.getActivity());
                main.setOrientation(LinearLayout.VERTICAL);

                // Toolbar layout
                RelativeLayout toolbar = new RelativeLayout(cordova.getActivity());
                //Please, no more black!
                toolbar.setBackgroundColor(android.graphics.Color.LTGRAY);
                toolbar.setLayoutParams(new RelativeLayout.LayoutParams(LayoutParams.MATCH_PARENT, this.dpToPixels(44)));
                toolbar.setPadding(this.dpToPixels(2), this.dpToPixels(2), this.dpToPixels(2), this.dpToPixels(2));
                toolbar.setHorizontalGravity(Gravity.LEFT);
                toolbar.setVerticalGravity(Gravity.TOP);

                // Action Button Container layout
                RelativeLayout actionButtonContainer = new RelativeLayout(cordova.getActivity());
                actionButtonContainer.setLayoutParams(new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT));
                actionButtonContainer.setHorizontalGravity(Gravity.LEFT);
                actionButtonContainer.setVerticalGravity(Gravity.CENTER_VERTICAL);
                actionButtonContainer.setId(1);

                // Back button
                Button back = new Button(cordova.getActivity());
                RelativeLayout.LayoutParams backLayoutParams = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT);
                backLayoutParams.addRule(RelativeLayout.ALIGN_LEFT);
                back.setLayoutParams(backLayoutParams);
                back.setContentDescription("Back Button");
                back.setId(2);
                Resources activityRes = cordova.getActivity().getResources();
                int backResId = activityRes.getIdentifier("ic_action_previous_item", "drawable", cordova.getActivity().getClass().getPackage().getName());
                if (backResId == 0) {
                    backResId = activityRes.getIdentifier("ic_action_previous_item", "drawable", cordova.getActivity().getPackageName());
                }
                Drawable backIcon = activityRes.getDrawable(backResId);
                if(android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.JELLY_BEAN)
                {
                    back.setBackgroundDrawable(backIcon);
                }
                else
                {
                    back.setBackground(backIcon);
                }
                back.setOnClickListener(new View.OnClickListener() {
                    public void onClick(View v) {
                        goBack();
                    }
                });

                // Forward button
                Button forward = new Button(cordova.getActivity());
                RelativeLayout.LayoutParams forwardLayoutParams = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT);
                forwardLayoutParams.addRule(RelativeLayout.RIGHT_OF, 2);
                forward.setLayoutParams(forwardLayoutParams);
                forward.setContentDescription("Forward Button");
                forward.setId(3);
                int fwdResId = activityRes.getIdentifier("ic_action_next_item", "drawable", cordova.getActivity().getClass().getPackage().getName());
                if (fwdResId == 0) {
                    fwdResId = activityRes.getIdentifier("ic_action_next_item", "drawable", cordova.getActivity().getPackageName());
                }
                Drawable fwdIcon = activityRes.getDrawable(fwdResId);
                if(android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.JELLY_BEAN)
                {
                    forward.setBackgroundDrawable(fwdIcon);
                }
                else
                {
                    forward.setBackground(fwdIcon);
                }
                forward.setOnClickListener(new View.OnClickListener() {
                    public void onClick(View v) {
                        goForward();
                    }
                });

                // Edit Text Box
                edittext = new EditText(cordova.getActivity());
                RelativeLayout.LayoutParams textLayoutParams = new RelativeLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
                textLayoutParams.addRule(RelativeLayout.RIGHT_OF, 1);
                textLayoutParams.addRule(RelativeLayout.LEFT_OF, 5);
                edittext.setLayoutParams(textLayoutParams);
                edittext.setId(4);
                edittext.setSingleLine(true);
                edittext.setText(url);
                edittext.setInputType(InputType.TYPE_TEXT_VARIATION_URI);
                edittext.setImeOptions(EditorInfo.IME_ACTION_GO);
                edittext.setInputType(InputType.TYPE_NULL); // Will not except input... Makes the text NON-EDITABLE
                edittext.setOnKeyListener(new View.OnKeyListener() {
                    public boolean onKey(View v, int keyCode, KeyEvent event) {
                        // If the event is a key-down event on the "enter" button
                        if ((event.getAction() == KeyEvent.ACTION_DOWN) && (keyCode == KeyEvent.KEYCODE_ENTER)) {
                          navigate(edittext.getText().toString());
                          return true;
                        }
                        return false;
                    }
                });

                // Close/Done button
                Button close = new Button(cordova.getActivity());
                RelativeLayout.LayoutParams closeLayoutParams = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT);
                closeLayoutParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
                close.setLayoutParams(closeLayoutParams);
                forward.setContentDescription("Close Button");
                close.setId(5);
                int closeResId = activityRes.getIdentifier("ic_action_remove", "drawable", cordova.getActivity().getClass().getPackage().getName());
                if (closeResId == 0) {
                    closeResId = activityRes.getIdentifier("ic_action_remove", "drawable", cordova.getActivity().getPackageName());
                }
                Drawable closeIcon = activityRes.getDrawable(closeResId);
                if(android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.JELLY_BEAN)
                {
                    close.setBackgroundDrawable(closeIcon);
                }
                else
                {
                    close.setBackground(closeIcon);
                }
                close.setOnClickListener(new View.OnClickListener() {
                    public void onClick(View v) {
                        closeDialog();
                    }
                });

                // WebView
                inAppWebView = new XWalkView(cordova.getActivity(), cordova.getActivity());
                // Kapsel change - attachment support
                //
                final CordovaPlugin attachmentPlugin = thatWebView.getPluginManager().getPlugin("AttachmentHandler");

                if (attachmentPlugin != null) {
                    inAppWebView.setDownloadListener(new XWalkDownloadListener(cordova.getActivity()) {
                        @Override
                        public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                            ((DownloadListener)attachmentPlugin).onDownloadStart(url, userAgent, contentDisposition, mimetype, contentLength);
                            closeDialog();
                        }
                    });
                }
                // Kapsel change - attachment support - End
                // Kapsel change - AuthProxy interception - start
                try {
                    // Use reflection because we want the AuthProxy
                    // plugin to be optional. If we get any exception, just ignore
                    // it and assume AuthProxy is not present.
                    Class<?> requestRedirectorClass = Class.forName("com.sap.mp.cordova.plugins.authProxy.RequestRedirector");
                    Method onIABLoadMethod = requestRedirectorClass.getMethod("onIABLoading", WebView.class);
                    onIABLoadMethod.invoke(null, inAppWebView);
                } catch (ClassNotFoundException e) {
                    LOG.d(LOG_TAG, "Skipped calling onIABLoad.");
                } catch (NoSuchMethodException e) {
                    LOG.d(LOG_TAG, "Skipped calling onIABLoad.");
                } catch (IllegalAccessException e) {
                    LOG.d(LOG_TAG, "Skipped calling onIABLoad.");
                } catch (IllegalArgumentException e) {
                    LOG.d(LOG_TAG, "Skipped calling onIABLoad.");
                } catch (InvocationTargetException e) {
                    LOG.d(LOG_TAG, "Skipped calling onIABLoad.");
                }
                // Kapsel change - AuthProxy interception - End

                inAppWebView.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

                inAppWebView.setUIClient(new XWalkInAppUIClient(inAppWebView, thatWebView) {
                    public void onPageLoadStarted(XWalkView view, String url) {
                        super.onPageLoadStarted(view, url);

                        String newloc = "";
                        if (url.startsWith("http:") || url.startsWith("https:") || url.startsWith("file:")) {
                            newloc = url;
                        }
                        // If dialing phone (tel:5551212)
                        else if (url.startsWith(WebView.SCHEME_TEL)) {
                            try {
                                Intent intent = new Intent(Intent.ACTION_DIAL);
                                intent.setData(Uri.parse(url));
                                cordova.getActivity().startActivity(intent);
                            } catch (android.content.ActivityNotFoundException e) {
                                LOG.e(LOG_TAG, "Error dialing " + url + ": " + e.toString());
                            }
                        }

                        else if (url.startsWith("geo:") || url.startsWith(WebView.SCHEME_MAILTO) || url.startsWith("market:")) {
                            try {
                                Intent intent = new Intent(Intent.ACTION_VIEW);
                                intent.setData(Uri.parse(url));
                                cordova.getActivity().startActivity(intent);
                            } catch (android.content.ActivityNotFoundException e) {
                                LOG.e(LOG_TAG, "Error with " + url + ": " + e.toString());
                            }
                        }
                        // If sms:5551212?body=This is the message
                        else if (url.startsWith("sms:")) {
                            try {
                                Intent intent = new Intent(Intent.ACTION_VIEW);

                                // Get address
                                String address = null;
                                int parmIndex = url.indexOf('?');
                                if (parmIndex == -1) {
                                    address = url.substring(4);
                                }
                                else {
                                    address = url.substring(4, parmIndex);

                                    // If body, then set sms body
                                    Uri uri = Uri.parse(url);
                                    String query = uri.getQuery();
                                    if (query != null) {
                                        if (query.startsWith("body=")) {
                                            intent.putExtra("sms_body", query.substring(5));
                                        }
                                    }
                                }
                                intent.setData(Uri.parse("sms:" + address));
                                intent.putExtra("address", address);
                                intent.setType("vnd.android-dir/mms-sms");
                                cordova.getActivity().startActivity(intent);
                            } catch (android.content.ActivityNotFoundException e) {
                                LOG.e(LOG_TAG, "Error sending sms " + url + ":" + e.toString());
                            }
                        }
                        else {
                            newloc = "http://" + url;
                        }

                        if (!newloc.equals(edittext.getText().toString())) {
                            edittext.setText(newloc);
                        }

                        try {
                            JSONObject obj = new JSONObject();
                            obj.put("type", LOAD_START_EVENT);
                            obj.put("url", newloc);

                            sendUpdate(obj, true);
                        } catch (JSONException ex) {
                            Log.d(LOG_TAG, "Should never happen");
                        }
                    }

                    public void onPageLoadStopped(XWalkView view, String url, XWalkUIClient.LoadStatus status) {
                        super.onPageLoadStopped(view, url, status);

                        try {
                            JSONObject obj = new JSONObject();
                            obj.put("type", LOAD_STOP_EVENT);
                            obj.put("url", url);

                            sendUpdate(obj, true);
                        } catch (JSONException ex) {
                            Log.d(LOG_TAG, "Should never happen");
                        }
                    }
                });

                XWalkResourceClient client = new XWalkInAppBrowserClient(inAppWebView, thatWebView, edittext);
                inAppWebView.setResourceClient(client);

                if (clearAllCache) {
                    XWalkCookieManager cookieManager = new XWalkCookieManager();
                    cookieManager.removeAllCookie();
                } else if (clearSessionCache) {
                    XWalkCookieManager cookieManager = new XWalkCookieManager();
                    cookieManager.removeSessionCookie();
                }

                inAppWebView.load(url, null);
                inAppWebView.setId(6);
                inAppWebView.requestFocus();
                inAppWebView.requestFocusFromTouch();

                // Add the back and forward buttons to our action button container layout
                actionButtonContainer.addView(back);
                actionButtonContainer.addView(forward);

                // Add the views to our toolbar
                toolbar.addView(actionButtonContainer);
                toolbar.addView(edittext);
                toolbar.addView(close);

                // Don't add the toolbar if its been disabled
                if (getShowLocationBar()) {
                    // Add our toolbar to our main view/layout
                    main.addView(toolbar);
                }

                // Add our webview to our main view/layout
                main.addView(inAppWebView);

                WindowManager.LayoutParams lp = new WindowManager.LayoutParams();
                lp.copyFrom(dialog.getWindow().getAttributes());
                lp.width = WindowManager.LayoutParams.MATCH_PARENT;
                lp.height = WindowManager.LayoutParams.MATCH_PARENT;

                dialog.setContentView(main);
                dialog.show();
                dialog.getWindow().setAttributes(lp);
                // the goal of openhidden is to load the url and not display it
                // Show() needs to be called to cause the URL to be loaded
                if(openWindowHidden) {
                    dialog.hide();
                }
            }
        };
        this.cordova.getActivity().runOnUiThread(runnable);
        return "";
    }

    /**
     * Create a new plugin success result and send it back to JavaScript
     *
     * @param obj a JSONObject contain event payload information
     */
    private void sendUpdate(JSONObject obj, boolean keepCallback) {
        sendUpdate(obj, keepCallback, PluginResult.Status.OK);
    }

    /**
     * Create a new plugin result and send it back to JavaScript
     *
     * @param obj a JSONObject contain event payload information
     * @param status the status code to return to the JavaScript environment
     */
    private void sendUpdate(JSONObject obj, boolean keepCallback, PluginResult.Status status) {
        if (callbackContext != null) {
            PluginResult result = new PluginResult(status, obj);
            result.setKeepCallback(keepCallback);
            callbackContext.sendPluginResult(result);
            if (!keepCallback) {
                callbackContext = null;
            }
        }
    }

    public class XWalkInAppBrowserClient extends XWalkResourceClient {
        EditText edittext;
        CordovaWebView webView;

        /**
         * Constructor.
         *
         * @param view
         * @param webView
         * @param mEditText
         */
        public XWalkInAppBrowserClient(XWalkView view, CordovaWebView webView, EditText mEditText) {
            super(view);
            this.webView = webView;
            this.edittext = mEditText;
        }

        public void onReceivedLoadError(XWalkView view, int errorCode, String description, String failingUrl) {
            super.onReceivedLoadError(view, errorCode, description, failingUrl);

            try {
                JSONObject obj = new JSONObject();
                obj.put("type", LOAD_ERROR_EVENT);
                obj.put("url", failingUrl);
                obj.put("code", errorCode);
                obj.put("message", description);

                sendUpdate(obj, true, PluginResult.Status.ERROR);
            } catch (JSONException ex) {
                Log.d(LOG_TAG, "Should never happen");
            }
        }
    }
}
