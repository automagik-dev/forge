package ai.namastex.forge

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
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
            try {
                val port = startServer()
                
                if (port <= 0) {
                    withContext(Dispatchers.Main) {
                        showServerError()
                    }
                    return@launch
                }
                
                withContext(Dispatchers.Main) {
                    // Load app once server is ready
                    webView.loadUrl("http://127.0.0.1:$port")
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
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
        
        // Write logs to Downloads for Termux access
        try {
            saveLogsToDownloads(errorMessage)
        } catch (e: Exception) {
            android.util.Log.e("ForgeApp", "Failed to save logs to Downloads", e)
        }

        // Show error dialog
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Server Startup Failed")
            .setMessage("Failed to start the Forge backend server.\n\nError:\n$errorMessage\n\nLogs saved to Downloads/forge-debug.txt")
            .setPositiveButton("EXIT") { _, _ ->
                finish()
            }
            .setNeutralButton("COPY ERROR") { _, _ ->
                val clipboard = getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                val clip = android.content.ClipData.newPlainText("Forge Error", errorMessage)
                clipboard.setPrimaryClip(clip)
                Toast.makeText(this, "Error copied to clipboard", Toast.LENGTH_SHORT).show()
                finish()
            }
            .setCancelable(false)
            .show()
    }
    
    private fun saveLogsToDownloads(errorMessage: String) {
        val timestamp = java.text.SimpleDateFormat("yyyyMMdd-HHmmss", java.util.Locale.US).format(java.util.Date())
        val filename = "forge-debug-$timestamp.txt"
        
        val logContent = buildString {
            appendLine("=== Forge Backend Debug Log ===")
            appendLine("Timestamp: $timestamp")
            appendLine("Data Dir: ${filesDir.absolutePath}")
            appendLine()
            appendLine("=== Error Message ===")
            appendLine(errorMessage)
            appendLine()
            appendLine("=== Instructions ===")
            appendLine("From Termux, you can read this file at:")
            appendLine("/sdcard/Download/$filename")
            appendLine()
            appendLine("To view in Termux:")
            appendLine("1. Run: termux-setup-storage (if not done already)")
            appendLine("2. Run: cat /sdcard/Download/$filename")
        }
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            val resolver = contentResolver
            val contentValues = android.content.ContentValues().apply {
                put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, filename)
                put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "text/plain")
                put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
            }
            
            val uri = resolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            uri?.let {
                resolver.openOutputStream(it)?.use { outputStream ->
                    outputStream.write(logContent.toByteArray())
                }
            }
        } else {
            val downloadsDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS)
            val file = java.io.File(downloadsDir, filename)
            file.writeText(logContent)
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
