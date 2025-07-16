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
import android.net.VpnService
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
import cn.mapleafgo.mobile.Mobile
import com.hjq.permissions.XXPermissions
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStreamReader

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val logTag = "mMainActivity"
    var webviewIsReady: Boolean = false
    private var server: LocalServer? = null
    private lateinit var mediaProjectionManager: MediaProjectionManager
    private var isVpnConnected: Boolean = false
    private var isVpnConnecting: Boolean = false

    var mainService: MainService? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        initVpn()
        server = LocalServer(this, LOCAL_SERVER_PORT)
        server?.start()
        mediaProjectionManager =
            getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager

        setContentView(R.layout.activity_main)
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED

        val intent = Intent(this, MainService::class.java)
        startService(intent)
        bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE) // Binds the service

        webView = findViewById(R.id.webview)
        webView.settings.javaScriptEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        webView.settings.domStorageEnabled = true
        webView.webViewClient = CustomWebViewClient()
        webView.webChromeClient = WebChromeClient()
        webView.addJavascriptInterface(WebAppInterface(this), "__AndroidAPI")
        LocalBroadcastManager.getInstance(this)
            .registerReceiver(messageReceiver, IntentFilter("mainMessage"))
        registerReceiver(
            messageReceiver,
            IntentFilter("vpn.state_changed"),
            Context.RECEIVER_NOT_EXPORTED
        )
        loadHomePage()
        startVpn()
    }

    fun isVpnRunning(): Boolean {
        return isVpnConnected
    }

    fun stopVpn() {
        isVpnConnected = false
        sendBroadcast(Intent("signal_stop_cicy"))
    }

    fun startVpn() {
        val intent = VpnService.prepare(this)
        if (intent != null) {
            startActivityForResult(intent, VPN_REQUEST_CODE)
        } else {
            onActivityResult(VPN_REQUEST_CODE, RESULT_OK, null)
        }
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
        val serverUrl = readServerUrlFromFile()
        val notificationsIsGranted =
            XXPermissions.isGranted(this, android.Manifest.permission.POST_NOTIFICATIONS)
        val payload = JSONObject().apply {
            put("clientId", "ADR-${brand}-${model}")
            put("serverUrl", serverUrl)
            put("model", model)
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
            put("isVpnConnected", isVpnConnected)
            put("isVpnConnecting", isVpnConnecting)
            put("vpnInfo", getVpnConfig())
            put("notificationsIsGranted", notificationsIsGranted)
        }
        return payload
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {

    }

    override fun onResume() {
        super.onResume()
        Log.d(logTag, "onResume")
        // 检查用户是否从设置页面返回
        onStateChanged()
    }

    override fun onDestroy() {
        Log.e(logTag, "onDestroy")
        mainService?.let {
            unbindService(serviceConnection)
        }
        unregisterReceiver(messageReceiver)
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
            when (intent.action) {
                "vpn.state_changed" -> {
                    val state = intent.getStringExtra("state")
                    runOnUiThread {
                        when (state) {
                            "disconnected" -> {
                                Toast.makeText(context, "Vpn已断开", Toast.LENGTH_SHORT).show()
                                isVpnConnected = false
                                isVpnConnecting = false
                                onStateChanged()
                            }

                            "connected" -> {
                                Toast.makeText(context, "Vpn已连接", Toast.LENGTH_SHORT).show()
                                isVpnConnected = true
                                isVpnConnecting = false
                                onStateChanged()
                            }

                            "connecting" -> {
                                isVpnConnecting = true
                                onStateChanged()
                            }
                        }
                    }
                }
            }

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
        override fun onServiceConnected(name: ComponentName?, serviceBinder: IBinder?) {
            Log.d(logTag, "onServiceConnected")
            val binder = serviceBinder as MainService.LocalBinder
            mainService = binder.getService()
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            Log.d(logTag, "onServiceDisconnected")
            mainService = null
        }
    }


    private fun getDefaultConfig(): String {
        return try {
            resources.openRawResource(R.raw.config).bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            Log.e("LeafVpnService", "Error reading default config", e)
            "" // Return empty config as fallback
        }
    }

    fun editVpnConfig(params: JSONArray) {
        val sharedPref = getSharedPreferences("vpn_preferences", Context.MODE_PRIVATE)
        val editor = sharedPref.edit().apply {
            putString("proxyPoolHost", params.optString(0, ""))
            putString("proxyPoolPort", params.optString(1, "4455"))
            putString("accountIndex", params.optString(2, ""))
            putString("allowList", params.optString(3, ""))
        }
        val success = editor.commit()

        if (success) {
            initVpn()
            Log.d("Prefs", "Save successful")
        } else {
            Log.e("Prefs", "Save failed")
        }
    }

    private fun getVpnConfig(): JSONObject {
        val sharedPref = this.getSharedPreferences("vpn_preferences", Context.MODE_PRIVATE)
        val proxyPoolHost = sharedPref.getString("proxyPoolHost", "") ?: ""
        val proxyPoolPort = sharedPref.getString("proxyPoolPort", "") ?: "4445"
        val accountIndex = sharedPref.getString("accountIndex", "") ?: "10000"
        val allowList = sharedPref.getString("allowList", "") ?: ""
        var configYaml = getDefaultConfig()
        if (proxyPoolHost.isNotEmpty() && !proxyPoolHost.equals("127.0.0.1")) {
            configYaml = configYaml.replace(
                "# - proxy",
                "- { name: HTTP, type: http, server: ${proxyPoolHost}, port: ${proxyPoolPort}, username: Account_${accountIndex}, password: pwd  }"
            )
        } else {
            configYaml = configYaml.replace(
                "# - proxy",
                "- { name: HTTP, type: http, server: 127.0.0.1, port: 4445 }"
            )
            configYaml = configYaml.replace("MATCH,HTTP", "MATCH,DIRECT")
        }
        if (allowList.isNotEmpty()) {
            val allowList1 = allowList.split("|")
        }

        return JSONObject().apply {
            put("proxyPoolHost", proxyPoolHost)
            put("proxyPoolPort", proxyPoolPort)
            put("accountIndex", accountIndex)
            put("allowList", allowList)
            put("configYaml", configYaml)
        }
    }

    private fun initVpn() {
        val vpnConfig = getVpnConfig()
        val configYaml = vpnConfig.getString("configYaml")
        val configFile = File(filesDir, "config.yaml")
        FileOutputStream(configFile).use { fos ->
            fos.write(configYaml.toByteArray())
        }

        val mmdbFile = File(filesDir, "Country.mmdb")
        if (!mmdbFile.exists()) {
            val assetManager: AssetManager = assets
            val inputStream = assetManager.open("Country.mmdb")
            val outputStream = FileOutputStream(mmdbFile)
            inputStream.use { input ->
                outputStream.use { output ->
                    input.copyTo(output)
                }
            }
        }
        Log.d(logTag, "[+] config.path ${configFile.absolutePath}")
        Log.d(logTag, "[+] config.exists ${configFile.exists()}")

        Log.d(logTag, "[+] mmdbFile.path ${mmdbFile.absolutePath}")
        Log.d(logTag, "[+] mmdbFile.exists ${mmdbFile.exists()}")

        Log.d(logTag, "[+] Home dir ${filesDir.absolutePath}")

        Mobile.setConfig(configFile.absolutePath)
        Mobile.setHomeDir(filesDir.absolutePath)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_INVOKE_PERMISSION_ACTIVITY_MEDIA_PROJECTION && resultCode == RES_FAILED) {
            sendMessageToWebView(JSONObject().apply {
                put("action", "on_media_projection_canceled")
            }.toString())
        }

        if (requestCode == VPN_REQUEST_CODE) {
            val intent = Intent(this, CiCyVpnService::class.java)
            startForegroundService(intent)
            Mobile.startService()
            isVpnConnected = true
        }
        onStateChanged()
    }
}
