const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, 'android-webview');
const dirs = [
    'app/src/main/java/com/pgrs/app',
    'app/src/main/res/layout',
    'app/src/main/res/values',
    'gradle/wrapper'
];

dirs.forEach(dir => {
    fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
});

const files = {
    'settings.gradle': `rootProject.name = "PGRS App"\ninclude ':app'`,
    'build.gradle': `
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.1'
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}`,
    'app/build.gradle': `
plugins {
    id 'com.android.application'
}
android {
    namespace 'com.pgrs.app'
    compileSdk 34
    defaultConfig {
        applicationId "com.pgrs.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.9.0'
}`,
    'app/src/main/AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.pgrs.app">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
    'app/src/main/res/values/strings.xml': `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">PGRS</string>
</resources>`,
    'app/src/main/res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">
    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</RelativeLayout>`,
    'app/src/main/java/com/pgrs/app/MainActivity.java': `package com.pgrs.app;

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
    private final String APP_URL = "http://10.0.2.2:3000"; // Use 10.0.2.2 for Android Emulator to access localhost, or your production URL

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                // Load an offline fallback page or simple HTML
                String offlineHtml = "<html><body style='display:flex;justify-content:center;align-items:center;height:100vh;background:#f8fafc;font-family:sans-serif;'><h2>No Internet Connection</h2></body></html>";
                view.loadData(offlineHtml, "text/html", "UTF-8");
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
}`
};

for (const [file, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(projectDir, file), content.trim());
}

console.log('Android WebView project generated at ' + projectDir);
