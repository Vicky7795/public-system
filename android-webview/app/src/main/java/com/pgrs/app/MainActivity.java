package com.pgrs.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import androidx.appcompat.app.AppCompatActivity;
import android.widget.Toast;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.content.Context;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private final String APP_URL = "https://ai-public-grievance-portal.onrender.com"; // Production URL

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setAllowFileAccess(true);
        webSettings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        webView.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                android.util.Log.d("WebViewConsole", consoleMessage.message() + " -- From line "
                        + consoleMessage.lineNumber() + " of "
                        + consoleMessage.sourceId());
                return super.onConsoleMessage(consoleMessage);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                // If the error is for the main frame (not an image/script), show it
                if (request.isForMainFrame()) {
                    String errorHtml = "<html><body style='display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background:#f8fafc;font-family:sans-serif;padding:20px;text-align:center;'><h2>Connection Failed</h2><p>Error Code: " + error.getErrorCode() + "</p><p>" + error.getDescription() + "</p></body></html>";
                    view.loadData(errorHtml, "text/html", "UTF-8");
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, android.webkit.WebResourceResponse errorResponse) {
                if (request.isForMainFrame()) {
                    String errorHtml = "<html><body style='display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background:#f8fafc;font-family:sans-serif;padding:20px;text-align:center;'><h2>HTTP Error</h2><p>Code: " + errorResponse.getStatusCode() + "</p></body></html>";
                    view.loadData(errorHtml, "text/html", "UTF-8");
                }
            }

            @Override
            public void onReceivedSslError(WebView view, android.webkit.SslErrorHandler handler, android.net.http.SslError error) {
                // Ignore SSL certificate errors to ensure Let's Encrypt certificates work on all older phones
                handler.proceed();
            }
        });

        if (isNetworkAvailable()) {
            webView.loadUrl(APP_URL);
        } else {
            Toast.makeText(this, "No Internet Connection", Toast.LENGTH_LONG).show();
            String offlineHtml = "<html><body style='display:flex;justify-content:center;align-items:center;height:100vh;background:#f8fafc;font-family:sans-serif;'><h2>No Internet Connection</h2><p>Please check your network and restart the app.</p></body></html>";
            webView.loadData(offlineHtml, "text/html", "UTF-8");
        }
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
        return activeNetworkInfo != null && activeNetworkInfo.isConnected();
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}