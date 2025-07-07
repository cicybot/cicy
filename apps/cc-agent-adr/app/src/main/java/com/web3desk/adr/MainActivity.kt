package com.web3desk.adr

import NetworkUtils
import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.ServiceConnection
import android.content.pm.ActivityInfo
import android.content.res.AssetManager
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import org.json.JSONObject
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val logTag = "mMainActivity"
    var webviewIsReady: Boolean = false
    private var server: LocalServer? = null
    var mainService: MainService? = null

    private lateinit var mediaProjectionManager: MediaProjectionManager

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        server = LocalServer(this, LOCAL_SERVER_PORT)
        server?.start()
        mediaProjectionManager =
            getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager

        setContentView(R.layout.activity_main)
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED

        val intent = Intent(this, MainService::class.java)
        startService(intent)
        bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE) // Binds the service


        webView = findViewById<WebView>(R.id.webview)
        webView.settings.javaScriptEnabled = true
        webView.settings.allowFileAccess = true // Allow file access
        webView.settings.allowContentAccess = true // Allow access to content URLs
        webView.settings.allowUniversalAccessFromFileURLs = true // Allow CORS for file URLs
        webView.settings.allowFileAccessFromFileURLs =
            true // Allow access to other file URLs from file
        webView.settings.domStorageEnabled = true
        webView.webViewClient = CustomWebViewClient()
        webView.webChromeClient = WebChromeClient()
        webView.addJavascriptInterface(WebAppInterface(this), "__AndroidAPI")
        LocalBroadcastManager.getInstance(this)
            .registerReceiver(messageReceiver, IntentFilter("WebViewMessage"))
        loadHomePage()
    }
    // Custom WebViewClient to handle errors and redirect to LOCAL URL on failure
    inner class CustomWebViewClient : WebViewClient() {
        override fun onReceivedError(
            view: WebView,
            request: WebResourceRequest?,
            error: WebResourceError?
        ) {
            super.onReceivedError(view, request, error)
            // Log the error for debugging purposes
            Log.e(logTag, "Error loading page: ${error?.description}")

            // If the main URL fails, try loading the local URL
            if (request?.url.toString() == HOME_URL) {
                Log.d(logTag, "Main URL failed, falling back to local URL")
                view.loadUrl(HOME_URL_LOCAL)
            }
        }

        override fun onReceivedHttpError(
            view: WebView,
            request: WebResourceRequest?,
            errorResponse: WebResourceResponse?
        ) {
            super.onReceivedHttpError(view, request, errorResponse)
            // Log the HTTP error for debugging purposes
            Log.e(logTag, "HTTP Error loading page: ${errorResponse?.statusCode}")

            // If the main URL fails, try loading the local URL
            if (request?.url.toString() == HOME_URL) {
                Log.d(logTag, "Main URL HTTP error, falling back to local URL")
                view.loadUrl(HOME_URL_LOCAL)
            }
        }
    }

    // Function to load the home page URL initially
    private fun loadHomePage() {
        Log.d(logTag, "Loading URL: $HOME_URL")
        webView.loadUrl(HOME_URL)
    }

    fun readFileFromAssets(filename: String): String {
        return try {
            val assetManager: AssetManager = assets
            val inputStream = assetManager.open(filename)
            val reader = BufferedReader(InputStreamReader(inputStream))
            val content = reader.readText()
            reader.close()
            content
        } catch (e: IOException) {
            e.printStackTrace()
            ""
        }
    }

    fun appInfo(): JSONObject {
        val windowManager = this.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val (screenWidth, screenHeight) = getScreenSize(windowManager)
        val ipAddress = NetworkUtils.getCurrentIp(this)
        val brand = Build.BRAND  // 手机品牌
        val model = Build.MODEL  // 手机型号
        val device = Build.DEVICE // 设备名称
        val product = Build.PRODUCT // 产品名称
        val version = Build.VERSION.RELEASE  // 安卓系统版本
        val id = Build.ID  // 编译版本ID
        val payload = JSONObject().apply {
            put("ccAgentAccessibility", InputService.isOpen)
            put("ccAgentMediaProjection", MainService.isStart)
            put("displayWidth", screenWidth)
            put("displayHeight", screenHeight)
            put("dpi", resources.displayMetrics.density)
            put("ipAddress", ipAddress)
            put("brand", brand)
            put("model", model)
            put("BuildDevice", device)
            put("BuildProduct", product)
            put("buildVersion", version)
            put("buildId", id)
            put("version", VERSION)
        }
        return payload
    }

    override fun onBackPressed() {

    }

    override fun onResume() {
        super.onResume()
        Log.d(logTag, "onResume")
        onStateChanged()
    }

    override fun onDestroy() {
        Log.e(logTag, "onDestroy")
        mainService?.let {
            unbindService(serviceConnection)
        }
        LocalBroadcastManager.getInstance(this).unregisterReceiver(messageReceiver)
        super.onDestroy()
    }

    override fun onStop() {
        super.onStop()
        Log.d(logTag, "onStop")
    }

    override fun onStart() {
        super.onStart()
        Log.d(logTag, "onStart")
    }

    fun sendMessageToWebView(message: String) {
        if (webviewIsReady) {
            webView.post {
                webView.evaluateJavascript(
                    "javascript:AppCallback(${JSONObject.quote(message)})",
                    null
                )
            }
        }
    }

    private val messageReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val message = intent.getStringExtra("message") ?: ""
            if (message.contains("on_screen_recording")) {
                Toast.makeText(context, "正在录制屏幕...", Toast.LENGTH_SHORT).show()
            }
            if (message.contains("on_screen_stopped_recording")) {
                Toast.makeText(context, "结束录制屏幕", Toast.LENGTH_SHORT).show()
            }
            sendMessageToWebView(message)
        }
    }

    fun onStateChanged() {
        val message = JSONObject().apply {
            put("action", "on_state_changed")
        }.toString()
        sendMessageToWebView(message)
    }


    fun requestMediaProjection() {
        val intent = Intent(this, PermissionRequestTransparentActivity::class.java).apply {
            action = ACT_REQUEST_MEDIA_PROJECTION
        }
        startActivityForResult(intent, REQ_INVOKE_PERMISSION_ACTIVITY_MEDIA_PROJECTION)
    }

    val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            Log.d(logTag, "onServiceConnected")
            val binder = service as MainService.LocalBinder
            mainService = binder.getService()
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            Log.d(logTag, "onServiceDisconnected")
            mainService = null
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_INVOKE_PERMISSION_ACTIVITY_MEDIA_PROJECTION && resultCode == RES_FAILED) {
            sendMessageToWebView(JSONObject().apply {
                put("action", "on_media_projection_canceled")
            }.toString())
        }
        onStateChanged()
    }
}
