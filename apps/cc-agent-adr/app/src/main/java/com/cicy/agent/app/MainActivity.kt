package com.cicy.agent.app
import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.ServiceConnection
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts.RequestPermission
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import cn.mapleafgo.mobile.Mobile
import com.cicy.agent.adr.ACT_REQUEST_MEDIA_PROJECTION
import com.cicy.agent.adr.LocalServer
import com.cicy.agent.adr.MessageActivityHandler
import com.cicy.agent.adr.MessageHandler
import com.cicy.agent.adr.PermissionRequestTransparentActivity
import com.cicy.agent.adr.RecordingService
import com.cicy.agent.adr.isX86_64
import com.web3desk.adr.R
import org.json.JSONObject
import java.net.URLEncoder
import androidx.core.net.toUri
import com.cicy.agent.adr.REQ_INVOKE_PERMISSION_ACTIVITY_MEDIA_PROJECTION
import com.cicy.agent.adr.RES_FAILED

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val logTag = "mMainActivity"
    private var webviewIsReady: Boolean = false

    var clashRunning = false;

    var recordingService: RecordingService? = null

    lateinit var localBroadcastManager: LocalBroadcastManager
    private lateinit var messageHandler: MessageActivityHandler


    @RequiresApi(Build.VERSION_CODES.O)
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val requestPermissionLauncher =
                registerForActivityResult(
                    RequestPermission()
                ) { _: Boolean ->
                }
            if (ContextCompat.checkSelfPermission(
                    this,
                    android.Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
            }
        }


        setContentView(R.layout.activity_main)

        ContextCompat.startForegroundService(this, Intent(this, LocalServer::class.java))
        localBroadcastManager = LocalBroadcastManager.getInstance(this)
        localBroadcastManager.registerReceiver(
            serviceRequestReceiver,
            IntentFilter(MessageHandler.ACTION_REQUEST)
        )
        messageHandler = MessageActivityHandler(this)

        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED

        webView = findViewById(R.id.webview)
        webView.settings.javaScriptEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        webView.settings.domStorageEnabled = true
        webView.webViewClient = CustomWebViewClient()
        webView.webChromeClient = WebChromeClient()
        webView.addJavascriptInterface(WebAppInterface(this), "__AndroidAPI")

        loadHomePage()
    }

    inner class CustomWebViewClient : WebViewClient() {
        override fun onReceivedError(
            view: WebView,
            request: WebResourceRequest?,
            error: WebResourceError?
        ) {
            super.onReceivedError(view, request, error)
            Log.e(logTag, "Error loading page: ${error?.description}")
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
            Log.e(logTag, "HTTP Error loading page: ${errorResponse?.statusCode}")
            if (request?.url.toString() == HOME_URL) {
                Log.d(logTag, "Main URL HTTP error, falling back to local URL")
                view.loadUrl(HOME_URL_LOCAL)
            }
        }
    }

    private fun loadHomePage() {
        if (UseLocal) {
            webView.loadUrl(HOME_URL_LOCAL)
        } else {
            webView.loadUrl(HOME_URL)
        }
    }


    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {

    }

    override fun onResume() {
        super.onResume()
        Log.d(logTag, "onResume")
        onStateChanged()
    }

    override fun onDestroy() {
        Log.e(logTag, "onDestroy")


        recordingService?.let {
            unbindService(serviceConnection)
        }

        localBroadcastManager.unregisterReceiver(serviceRequestReceiver)

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

    fun onStateChanged() {
        val message = JSONObject().apply {
            put("action", "on_state_changed")
        }.toString()
        sendMessageToWebView(message)
    }



    @RequiresApi(Build.VERSION_CODES.O)
    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_INVOKE_PERMISSION_ACTIVITY_MEDIA_PROJECTION && resultCode == RES_FAILED) {
            sendMessageToWebView(JSONObject().apply {
                put("action", "on_media_projection_canceled")
            }.toString())
        }
        onStateChanged()
    }

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, serviceBinder: IBinder?) {
            val binder = serviceBinder as RecordingService.LocalBinder
            recordingService = binder.getService()
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            recordingService = null
        }
    }
    fun startRecording(){
        if (!RecordingService.isReady) {
            Intent(this, RecordingService::class.java).also {
                bindService(it, serviceConnection, Context.BIND_AUTO_CREATE)
            }
            requestMediaProjection()
        }
    }

    fun stopRecording(){
        recordingService?.destroy()
    }

    fun isClashRunning(): Boolean {
        return clashRunning
    }

    fun startVpn(): String {
        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("clashmeta://install-config?action=start")
                flags = Intent.FLAG_ACTIVITY_CLEAR_TASK
            }

            if (intent.resolveActivity(packageManager) != null) {
                startActivity(intent)
                Log.d("VPNControl", "VPN start intent launched")
            } else {
                Log.e("VPNControl", "No activity found to handle the intent")
            }
        } catch (e: Exception) {
            Log.e("VPNControl", "Failed to start VPN", e)
        }

        return "clash trigger start"
    }

    fun stopVpn():String {
        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("clashmeta://install-config?action=stop")
                flags = Intent.FLAG_ACTIVITY_CLEAR_TASK
            }

            if (intent.resolveActivity(packageManager) != null) {
                startActivity(intent)
                Log.d("VPNControl", "VPN stop intent launched")
            } else {
                Log.e("VPNControl", "No activity found to handle the intent")
            }
        } catch (e: Exception) {
            Log.e("VPNControl", "Failed to stop VPN", e)
        }
        return "clash trigger stop"
    }

    fun importVpn(){
        val configUrl = "http://127.0.0.1:${LocalServer.PORT}/vpnConfig.yaml"
        val encodedUrl = URLEncoder.encode(configUrl, "UTF-8")

        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = "clashmeta://install-config?action=import&url=$encodedUrl".toUri()
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            if (intent.resolveActivity(packageManager) != null) {
                startActivity(intent)
            } else {
                intent.data = "clash://install-config?url=$encodedUrl".toUri()
                if (intent.resolveActivity(packageManager) != null) {
                    startActivity(intent)
                } else {
                    Toast.makeText(this, "Clash app not found", Toast.LENGTH_SHORT).show()
                }
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to import config: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }


    private fun requestMediaProjection() {
        val intent = Intent(this, PermissionRequestTransparentActivity::class.java).apply {
            action = ACT_REQUEST_MEDIA_PROJECTION
        }
        startActivityForResult(intent,
            REQ_INVOKE_PERMISSION_ACTIVITY_MEDIA_PROJECTION
        )
    }

    private val serviceRequestReceiver = object : BroadcastReceiver() {
        @RequiresApi(Build.VERSION_CODES.O)
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action != MessageHandler.ACTION_REQUEST) return
            val messageAsync = intent.getStringExtra(MessageHandler.EXTRA_MESSAGE_ASYNC)
            if(messageAsync !== null){
                messageHandler.processAsync(messageAsync)
            }
            val message = intent.getStringExtra(MessageHandler.EXTRA_MESSAGE)
            if(message !== null){
                val callbackId = intent.getStringExtra(MessageHandler.EXTRA_CALLBACK_ID)
                messageHandler.process(message,callbackId)
            }
        }
    }
}
