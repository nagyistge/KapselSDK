package org.apache.cordova;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.charset.Charset;

import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

public class KapselActivity extends CordovaActivity {
    public static String TAG = "KapselActivity";
    
    /**
     * Load the url into the webview.
     * 
     * @param url
     */
    public void loadUrl(String url) {
        String updateUrl = null;
        File appFile = new File(getApplicationContext().getFilesDir(), "app.json");
        if (appFile.exists()) {
            JSONObject appInfo = readFileToJSON(appFile);
            try {
                updateUrl = appInfo.getString("url");
            } catch (JSONException e) {
                Log.d(TAG,e.toString());
            }
        }
        if (updateUrl != null) {
            super.loadUrl(updateUrl);
        } else {
            super.loadUrl(url);
        }
    }

    private JSONObject readFileToJSON(File file) {
        JSONObject result = null;

        if (file.exists()) {
            FileInputStream inputStream = null;
            try {
                inputStream = new FileInputStream(file);
                StringBuilder builder = new StringBuilder(inputStream.available());
                byte[] input = new byte[inputStream.available()];
                while (inputStream.read(input) != -1) {
                    builder.append(new String(input, Charset.defaultCharset()));
                }

                result = new JSONObject(builder.toString());
            } catch (FileNotFoundException e) {
                Log.d(TAG,e.toString());
            } catch (IOException e) {
                Log.d(TAG,e.toString());
            } catch (JSONException e) {
                Log.d(TAG,e.toString());
            } finally {
                if (inputStream != null) {
                    try {
                        inputStream.close();
                    } catch (IOException ioe) {
                        Log.d(TAG,ioe.toString());
                    }
                }
            }
        }
        return result;
    }
}
