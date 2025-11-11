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
    private external fun setDataDir(dataDir: String)
    private external fun startServer(): Int
    private external fun stopServer()
    private external fun getLastError(): String

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

        // Set Android data directory before starting server
        setDataDir(filesDir.absolutePath)

        // Start Rust server in background
        serverJob = CoroutineScope(Dispatchers.IO).launch {
            val port = startServer()
            withContext(Dispatchers.Main) {
                if (port > 0) {
                    // Server started successfully, load app
                    webView.loadUrl("http://127.0.0.1:$port")
                } else {
                    // Server failed to start, show error dialog
                    showServerError()
                }
            }
        }
    }

    private fun showServerError() {
        val errorMessage = getLastError()
        
        // Write error to file for sharing
        try {
            val errorFile = java.io.File(filesDir, "forge-last-error.txt")
            errorFile.writeText(errorMessage)
        } catch (e: Exception) {
            // Ignore file write errors
        }

        // Show error dialog
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Server Startup Failed")
            .setMessage("Failed to start the Forge backend server.\n\nError:\n$errorMessage\n\nPlease check the logs (adb logcat) for more details.")
            .setPositiveButton("EXIT") { _, _ ->
                finish()
            }
            .setNeutralButton("COPY ERROR") { _, _ ->
                val clipboard = getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                val clip = android.content.ClipData.newPlainText("Forge Error", errorMessage)
                clipboard.setPrimaryClip(clip)
                finish()
            }
            .setCancelable(false)
            .show()
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
