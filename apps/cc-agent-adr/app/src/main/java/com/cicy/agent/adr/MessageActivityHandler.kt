package com.cicy.agent.adr
import android.content.Context
import android.content.Intent
import android.content.res.AssetManager
import android.os.Build
import android.provider.Settings
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import android.widget.Toast
import androidx.annotation.RequiresApi
import cn.mapleafgo.mobile.Mobile
import com.cicy.agent.app.MainActivity
import com.hjq.permissions.XXPermissions
import com.web3desk.adr.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.MainScope
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStreamReader

class MessageActivityHandler(
    private val context: MainActivity,
) : CoroutineScope by MainScope() {
    private val logTag = "MessageActivityHandler"
    private fun getContext(): MainActivity {
        return context
    }

    fun readFileFromAssets(filename: String): String {
        return try {
            val assetManager: AssetManager = context.assets
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

    private fun getVpnDefaultConfig(): String {
        return try {
            getContext().resources?.openRawResource(R.raw.config)?.bufferedReader().use { it?.readText()
                ?: "" }
        } catch (e: Exception) {
            Log.e("LeafVpnService", "Error reading default config", e)
            ""
        }
    }

    private fun getVpnConfig(): JSONObject {
        val sharedPref = getContext().getSharedPreferences("vpn_preferences", Context.MODE_PRIVATE)
        val proxyPoolHost = sharedPref?.getString("proxyPoolHost", "") ?: ""
        val proxyPoolPort = sharedPref?.getString("proxyPoolPort", "") ?: "4445"
        val accountIndex = sharedPref?.getString("accountIndex", "") ?: "10000"
        val allowList = sharedPref?.getString("allowList", "") ?: ""
        var configYaml = getVpnDefaultConfig()
        var nodeName = "HTTP_NODE"
        if (proxyPoolHost.isNotEmpty() && !proxyPoolHost.equals("127.0.0.1")) {
            configYaml = configYaml.replace(
                "# - proxy",
                "- { name: ${nodeName}, type: http, server: ${proxyPoolHost}, port: ${proxyPoolPort}, username: Account_${accountIndex}, password: pwd  }"
            )
        } else {
            configYaml = configYaml.replace(
                "# - proxy",
                "- { name:  ${nodeName}, type: http, server: 127.0.0.1, port: 4445 }"
            )
            configYaml = configYaml.replace("MATCH,HTTP", "MATCH,DIRECT")
        }

        return JSONObject().apply {
            put("proxyPoolHost", proxyPoolHost)
            put("proxyPoolPort", proxyPoolPort)
            put("accountIndex", accountIndex)
            put("allowList", allowList)
            put("configYaml", configYaml)
        }
    }

    fun editVpnConfig(params: JSONArray):String {
        val sharedPref = context.getSharedPreferences("vpn_preferences", Context.MODE_PRIVATE)
        val editor = sharedPref.edit().apply {
            putString("proxyPoolHost", params.optString(0, ""))
            putString("proxyPoolPort", params.optString(1, "4455"))
            putString("accountIndex", params.optString(2, ""))
            putString("allowList", params.optString(3, ""))
        }
        val success = editor.commit()
        if (success) {
            initVpn()
            return "Save successful"
        } else {
            return "Save failed"
        }
    }
    fun initVpn() {
        val vpnConfig = getVpnConfig()
        val configYaml = vpnConfig.getString("configYaml")
        val configFile = File(context.filesDir, "config.yaml")
        FileOutputStream(configFile).use { fos ->
            fos.write(configYaml.toByteArray())
        }

        val mmdbFile = File(context.filesDir, "Country.mmdb")
        if (!mmdbFile.exists()) {
            val assetManager: AssetManager = context.assets
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

        Log.d(logTag, "[+] Home dir ${context.filesDir.absolutePath}")

        Mobile.setConfig(configFile.absolutePath)
        Mobile.setHomeDir(context.filesDir.absolutePath)
    }
    private fun getDeviceInfo(): JSONObject {
        val httpClient = HttpClient()
        try {
            val (getStatus, getResponse) = httpClient.get(
                "http://127.0.0.1:4447/deviceInfo",
                mapOf("Accept" to "application/json")
            )
            if (getStatus != 200) {
                var configContent = ""
                val configFile = File("/data/local/tmp/config_server.txt")
                if (configFile.exists()) {
                    configContent = configFile.readText().trim()
                }
                val clientId = getClientId()
                return JSONObject().apply {
                    put("serverUrl", configContent)
                    put("clientId", clientId)
                }
            } else {
                val jsonResponse = JSONObject(getResponse)
                return jsonResponse.getJSONObject("result")
            }
        } catch (e: Exception) {
            return JSONObject().apply {
                put("err", "Failed to parse response: ${e}")
            }
        }
    }

    private fun getScreenSize(windowManager: WindowManager): Pair<Int, Int> {
        var w = 0
        var h = 0
        @Suppress("DEPRECATION")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val m = windowManager.maximumWindowMetrics
            w = m.bounds.width()
            h = m.bounds.height()
        } else {
            val dm = DisplayMetrics()
            windowManager.defaultDisplay.getRealMetrics(dm)
            w = dm.widthPixels
            h = dm.heightPixels
        }
        return Pair(w, h)
    }

    private fun getAgentAppInfo(): JSONObject {
        val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val (screenWidth, screenHeight) = getScreenSize(windowManager)
        val ipAddress = NetworkUtils.getCurrentIp(context)
        val brand = Build.BRAND  // 手机品牌
        val model = Build.MODEL  // 手机型号
        val device = Build.DEVICE // 设备名称
        val product = Build.PRODUCT // 产品名称
        val version = Build.VERSION.RELEASE  // 安卓系统版本
        val id = Build.ID  // 编译版本ID
        val serverUrl = readServerUrlFromFile()
        val abi = getAbi()
        val payload = JSONObject().apply {
            put("abi", abi)
            put("clientId", getClientId())
            put("serverUrl", serverUrl)
            put("model", model)
            put("ccAgentAccessibility", InputService.isOpen)
            put("ccAgentMediaProjection", RecordingService.isStart)
            put("displayWidth", screenWidth)
            put("displayHeight", screenHeight)
            put("dpi", context.resources.displayMetrics.density)
            put("ipAddress", ipAddress)
            put("brand", brand)
            put("model", model)
            put("BuildDevice", device)
            put("BuildProduct", product)
            put("buildVersion", version)
            put("buildId", id)
            put("version", "1.0.1")
            put("isClashRunning", getContext().isClashRunning())
            put("vpnInfo", getVpnConfig())
//            put("notificationsIsGranted", false)
//            put("queryAllPackagesListIsGranted", false)
        }
        return payload
    }

    fun processAsync(messageAsync:String) {
        when (messageAsync) {
            "vpn.state_changed.connected" ->{
                getContext().clashRunning = true;
            }
            "vpn.state_changed.disconnected" ->{
                getContext().clashRunning = false;
            }
            "onStartRecording" -> getContext().startRecording()
            "on_screen_recording" -> Toast.makeText(
                context,
                "正在录制屏幕...",
                Toast.LENGTH_SHORT
            ).show()

            "on_screen_stopped_recording" -> Toast.makeText(
                context,
                "结束录制屏幕",
                Toast.LENGTH_SHORT
            ).show()

            else -> {}
        }
    }
    @RequiresApi(Build.VERSION_CODES.O)
    fun process(message: String, callbackId:String?): JSONObject {
        var response = JSONObject().apply {
            put("err", "")
        }
        try {
            val json = JSONObject(message)
            val method = json.getString("method")
            val params = json.getJSONArray("params")

            when (method) {
                "deviceInfo" -> response = getDeviceInfo()
                "agentAppInfo" -> {
                    response = getAgentAppInfo()
                }
                "onStartRecording" -> getContext().startRecording()
                "onStopRecording" -> getContext().stopRecording()
                "onStartInput" -> {
                    if(!InputService.isOpen){
                        startAction(context, Settings.ACTION_ACCESSIBILITY_SETTINGS)
                    }
                }
                "onStopInput" -> {
                    if(InputService.isOpen){
                        InputService.ctx?.disableSelf()
                    }
                }

                "click" -> {
                    if (!InputService.isOpen) {
                        response.put("err", "InputService is not open")
                    } else {
                        getContext().recordingService?.handlePostEvent(JSONObject().apply {
                            put("eventType", "click")
                            put("x", params[0])
                            put("y", params[1])
                        })
                    }

                }

                "inputText" -> {
                    if (!InputService.isOpen) {
                        response.put("err", "InputService is not open")
                    } else {
                        val text = params[0].toString()
                        InputService.ctx?.inputText(text)
                    }
                }

                "pressKey" -> {
                    if (!InputService.isOpen) {
                        response.put("err", "InputService is not open")
                    } else {
                        // Extract the key name from the params array
                        val keyName = params[0].toString()
                        // Map the key name to the corresponding action code
                        val code = when (keyName) {
                            "back" -> 1
                            "home" -> 2
                            "recent" -> 3
                            else -> 0
                        }
                        // Send the action event if the mainService is available
                        getContext().recordingService?.handlePostEvent(JSONObject().apply {
                            put("eventType", "action")
                            put("value", code)
                        })
                    }
                }

                "takeScreenshot" -> {
                    var data = ""
                    if (RecordingService.isStart) {
                        data = RecordingService.screenImgData
                    }

                    response = JSONObject().apply {
                        put("imgData", "data:image/jpeg;base64,$data")
                        put("imgLen", data.length)
                    }
                }

                "dumpWindowHierarchy" -> {
                    var xml = ""
                    if (InputService.isOpen) {
                        xml = InputService.ctx?.getDumpAsUiAutomatorXml().toString()
                    }
                    response = JSONObject().apply {
                        put("xml", xml)
                    }
                }

                "screenWithXml" -> {
                    var imgData = ""
                    if (RecordingService.isStart) {
                        imgData = RecordingService.screenImgData
                    }

                    var xml = ""
                    if (InputService.isOpen) {
                        xml = InputService.ctx?.getDumpAsUiAutomatorXml().toString()
                    }
                    response = JSONObject().apply {
                        put("xml", xml)
                        put("imgData", "data:image/jpeg;base64,$imgData")
                        put("imgLen", imgData.length)
                    }
                }


                "startAction" -> {
                    startAction(context, params.get(0) as String)
                }

                "showToast" -> {
                    Toast.makeText(context, params.get(0) as String, Toast.LENGTH_SHORT).show()
                }

                "getInstalledApps" -> {
                    val isAll = params.optString(0).equals("all")
                    val apps = PackagesList(context).getInstalledApps(isAll)
                    response = JSONObject().apply {
                        put("apps", apps)
                    }
                }

                "importVpn" -> {
                    getContext().importVpn()
                }
                "getVpnConfig"->{
                    response = getVpnConfig()
                }
                "editVpnConfig"->{
                    val res = editVpnConfig(params)
                    response = JSONObject().apply {
                        put("res", res)
                    }
                }
                "startVpn" -> {
                    val res = getContext().startVpn()
                    response = JSONObject().apply {
                        put("res", res)
                    }
                }

                "getOpencvJs" -> {
                    val text = readFileFromAssets("opencv.js")
                    JSONObject().apply {
                        put("text", text)
                    }
                }

                "checkPermission" -> {
                    val isGranted = XXPermissions.isGranted(context, params.get(0) as String)
                    JSONObject().apply {
                        put("isGranted", isGranted)
                    }
                }

                "requestPermission" -> {
                    requestPermission(context, params.get(0) as String)
                    JSONObject().apply {
                        put("ok", true)
                    }
                }
                "stopVpn" -> {
                    val res = getContext().stopVpn()
                    response = JSONObject().apply {
                        put("res", res)
                    }
                }

                "requestNotificationPermission" -> {
                    requestPermission(context, android.Manifest.permission.POST_NOTIFICATIONS)
                    JSONObject().apply {
                        put("ok", true)
                    }
                }

                else -> {
                    response.put("err", "Unknown method: $method")
                }
            }

        } catch (e: Exception) {
            response.put("err", "Invalid message format: ${e.message}")
        }
        if(callbackId !== null){
            val responseIntent = Intent(MessageHandler.ACTION_RESPONSE).apply {
                putExtra(MessageHandler.EXTRA_CALLBACK_ID, callbackId)
                putExtra(MessageHandler.EXTRA_RESULT, response.toString())
            }
            getContext().localBroadcastManager.sendBroadcast(responseIntent)
        }
        return response;
    }
}