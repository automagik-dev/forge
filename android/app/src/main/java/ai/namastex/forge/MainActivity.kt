package ai.namastex.forge

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.*

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private var serverJob: Job? = null

    companion object {
        init {
            System.loadLibrary("forge_app")
        }
    }

    // Native methods from Rust
    private external fun startServer(): Int
    private external fun stopServer()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)

        // Configure WebView
        webView.webViewClient = WebViewClient()
        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        webSettings.allowFileAccess = true
        webSettings.allowContentAccess = true

        // Start Rust server in background
        serverJob = CoroutineScope(Dispatchers.IO).launch {
            val port = startServer()
            withContext(Dispatchers.Main) {
                // Load app once server is ready
                webView.loadUrl("http://127.0.0.1:$port")
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serverJob?.cancel()
        stopServer()
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
