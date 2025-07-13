package com.web3desk.adr

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.content.ContextCompat
import fi.iki.elonen.NanoHTTPD
import okhttp3.WebSocket
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.InputStream

class LocalServer(private val context: MainActivity, port: Int) : NanoHTTPD("0.0.0.0", port) {
    private var wsClient: CCWebSocketClient? = null

    override fun start() {
        initWsClient()
        super.start();
    }

    override fun stop() {
        wsClient?.disconnect()
        wsClient = null
        super.stop()
    }

    fun initWsClient() {
        val appInfo = context.appInfo()
        val clientId = appInfo.getString("clientId")

        wsClient = CCWebSocketClient(clientId + "-APP", object : WsOptions {
            override fun onOpen(webSocket: WebSocket) {
                Log.d("WebSocket", "Connected!")
            }

            @RequiresApi(Build.VERSION_CODES.O)
            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d("WebSocket", "Received: $text")
                if (text.isJson()) {
                    val json = text.toJsonObject()
                    val fromClientId = json.optString("from")
                    val action = json.getString("action")
                    val id = json.optString("id")
                    if (id.isNotEmpty() && fromClientId.isNotEmpty()) {
                        val payload =
                            json.optJSONObject("payload") ?: JSONObject() // Handle null payload
                        val method = payload.optString("method", "") // Safe method extraction
                        val params =
                            payload.optJSONArray("params") ?: JSONArray() // Handle null params
                        val result = when (action) {
                            "jsonrpc" -> handleMethod(method, params)
                            else -> JSONObject().apply {
                                put("err", "error action")
                            }
                        }

                        val callbackResponse = JSONObject().apply {
                            put("to", fromClientId)
                            put("action", "callback")
                            put("id", id)
                            put("payload", result) // Empty payload as in your example
                        }
                        webSocket.send(callbackResponse.toString())
                    }
                }
            }

            override fun onClose(webSocket: WebSocket, code: Int) {
                Log.d("WebSocket", "Closed with code: $code")
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable) {
                Log.e("WebSocket", "Error", t)
            }
        })


        wsClient!!.connect()
    }

    private fun addCorsHeaders(response: Response): Response {
        response.addHeader("Access-Control-Allow-Origin", "*")
        response.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        response.addHeader("Access-Control-Allow-Headers", "origin, content-type, accept")
        response.addHeader("Access-Control-Max-Age", "3600")
        return response
    }

    @RequiresApi(Build.VERSION_CODES.O)
    override fun serve(session: IHTTPSession?): Response {
        if (session == null) return newFixedLengthResponse("Session is null")
        if (session.method == Method.OPTIONS) {
            return addCorsHeaders(newFixedLengthResponse(Response.Status.OK, "text/plain", ""))
        }
        val uri = session?.uri ?: "/index.html"
        val path = uri.removePrefix("/") // 去掉 URI 前缀 "/"
        val response = when (path) {
            "appInfo" -> handleAppInfoRequest()
            "screen" -> handleScreeRequest()
            "jsonrpc" -> handleJSONRpcRequest(session)
            else -> handleFileRequest(path)
        }
        return addCorsHeaders(response)

    }

    private fun handleFileRequest(path: String): Response {
        return try {
            val actualPath = if (path.isEmpty()) "index.html" else path
            val inputStream: InputStream = context.assets.open(actualPath)
            val bytes = inputStream.readBytes()
            inputStream.close()

            val mimeType = when {
                actualPath.endsWith(".html") -> "text/html"
                actualPath.endsWith(".js") -> "application/javascript"
                actualPath.endsWith(".css") -> "text/css"
                actualPath.endsWith(".png") -> "image/png"
                actualPath.endsWith(".jpg") -> "image/jpeg"
                actualPath.endsWith(".gif") -> "image/gif"
                else -> "application/octet-stream"
            }
            newFixedLengthResponse(
                Response.Status.OK,
                mimeType,
                bytes.inputStream(),
                bytes.size.toLong()
            )
        } catch (e: Exception) {
            newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "404 Not Found")
        }
    }


    @RequiresApi(Build.VERSION_CODES.O)
    private fun handleJSONRpcRequest(session: IHTTPSession): Response {
        return try {
            val body = HashMap<String, String>()
            session.parseBody(body)
            val jsonStr = body["postData"] ?: return newFixedLengthResponse(
                Response.Status.BAD_REQUEST,
                "application/json",
                """{"err": "Missing body"}"""
            )

            val requestJson = JSONObject(jsonStr)
            val method = requestJson.optString("method", "")
            val id = requestJson.opt("id") ?: 1
            val params = requestJson.optJSONArray("params") ?: JSONArray()
            val result = handleMethod(method, params)
            val responseJson = JSONObject().apply {
                put("jsonrpc", "2.0")
                put("id", id)
                put("result", result)
            }

            newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                responseJson.toString()
            )
        } catch (e: Exception) {
            newFixedLengthResponse(
                Response.Status.INTERNAL_ERROR,
                "application/json",
                """{"err": "${e.message}"}"""
            )
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun handleMethod(method: String, params: JSONArray): JSONObject {
        return when (method) {
            "deviceInfo" -> {
                val httpClient = HttpClient()
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
                    val clientId = context.appInfo().get("clientId");
                    JSONObject().apply {
                        put("serverUrl", configContent)
                        put("clientId", clientId)
                    }
                } else {
                    try {
                        // Parse the response string into JSONObject
                        val jsonResponse = JSONObject(getResponse)
                        jsonResponse.getJSONObject("result")
                    } catch (e: Exception) {
                        // Handle JSON parsing error
                        JSONObject().apply {
                            put("err", "Failed to parse response: ${e.message}")
                        }
                    }
                }
            }

            "shell" -> {
                shellExec(params.get(0).toString())
            }

            "startMediaProjection" -> {
                if (!MainService.isReady) {
                    Intent(context, MainService::class.java).also {
                        context.bindService(it, context.serviceConnection, Context.BIND_AUTO_CREATE)
                    }
                    context.requestMediaProjection()
                }
                JSONObject().apply {
                    put("ok", true)
                }
            }

            "startVpn" -> {
                try {
                    val sharedPref = context.getSharedPreferences("vpn_preferences", Context.MODE_PRIVATE)

                    val editor = sharedPref.edit().apply {
                        putString("config", params.optString(0, ""))
                        putString("allowList", params.optString(1, ""))
                    }
                    val success = editor.commit()

                    if (success) {
                        Log.d("Prefs", "Save successful")
                    } else {
                        Log.e("Prefs", "Save failed")
                    }
                    context.startVpn()
                    JSONObject().apply {
                        put("ok", true)
                    }
                } catch (e: Exception) {
                    JSONObject().apply {
                        put("ok", false)
                        put("error", e.message)
                    }
                }
            }

            "stopVpn" -> {
                context.stopVpn()
                JSONObject().apply {
                    put("ok", true)
                }
            }

            "isVpnRunning" -> {
                JSONObject().apply {
                    put("isVpnRunning", context.isVpnRunning())
                }
            }

            "stopMediaProjection" -> {
                context.mainService?.let {
                    it.destroy()
                    context.onStateChanged()

                }
                JSONObject().apply {
                    put("ok", true)
                }
            }

            "startAccessibility" -> {
                startAction(context, Settings.ACTION_ACCESSIBILITY_SETTINGS)
                JSONObject().apply {
                    put("ok", true)
                }
            }

            "stopAccessibility" -> {
                InputService.ctx?.disableSelf()
                JSONObject().apply {
                    put("ok", true)
                }
            }

            "appInfo" -> {
                context.appInfo();
            }

            "click" -> {
                if (!InputService.isOpen) {
                    JSONObject().apply {
                        put("err", "InputService is not open")
                        put("ok", false)
                    }
                } else {
                    context.mainService?.handlePostEvent(JSONObject().apply {
                        put("eventType", "click")
                        put("x", params[0])
                        put("y", params[1])
                    })
                    JSONObject().put("ok", true)
                }

            }

            "inputText" -> {
                if (!InputService.isOpen) {
                    JSONObject().apply {
                        put("err", "InputService is not open")
                        put("ok", false)
                    }
                } else {
                    val text = params[0].toString()
                    InputService.ctx?.inputText(text)
                    JSONObject().put("ok", true)
                }
            }

            "pressKey" -> {
                if (!InputService.isOpen) {
                    JSONObject().apply {
                        put("err", "InputService is not open")
                        put("ok", false)
                    }
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
                    context.mainService?.handlePostEvent(JSONObject().apply {
                        put("eventType", "action")
                        put("value", code)
                    })
                    JSONObject().put("ok", true)
                }
            }

            "takeScreenshot" -> {
                var data = ""
                if (MainService.isStart) {
                    data = MainService.screenImgData
                }

                JSONObject().apply {
                    put("imgData", "data:image/jpeg;base64," + data)
                    put("imgLen", data.length)
                }
            }

            "dumpWindowHierarchy" -> {
                var xml = ""
                if (InputService.isOpen) {
                    xml = InputService.ctx?.getDumpAsUiAutomatorXml().toString();
                }
                JSONObject().apply {
                    put("xml", xml)
                }
            }

            "screenWithXml" -> {
                var imgData = ""
                if (MainService.isStart) {
                    imgData = MainService.screenImgData
                }

                var xml = ""
                if (InputService.isOpen) {
                    xml = InputService.ctx?.getDumpAsUiAutomatorXml().toString();
                }
                JSONObject().apply {
                    put("xml", xml)
                    put("imgData", "data:image/jpeg;base64," + imgData)
                    put("imgLen", imgData.length)
                }
            }

            else -> {
                JSONObject().put("err", "Unknown method: $method")
            }
        }
    }

    private fun handleScreeRequest(): Response {
        val payload = JSONObject();
        var imgData = ""
        if (MainService.isStart) {
            imgData = MainService.screenImgData
        }

        var xml = ""
        if (InputService.isOpen) {
            xml = InputService.ctx?.getDumpAsUiAutomatorXml().toString();
        }

        if (imgData.isNotEmpty() && MainService.isStart) {
            payload.put("imgData", "data:image/jpeg;base64," + imgData)
            payload.put("imgLen", imgData.length)
        }

        payload.put("xml", xml)
        val jsonResponse = JSONObject().apply {
            put("jsonrpc", "2.0")
            put("result", payload)
            put("id", 1)
        }.toString()

        return newFixedLengthResponse(
            Response.Status.OK,
            "application/json",
            jsonResponse
        )
    }

    private fun handleAppInfoRequest(): Response {
        val payload = context.appInfo()
        val jsonResponse = JSONObject().apply {
            put("jsonrpc", "2.0")
            put("result", payload)
            put("id", 1)
        }.toString()

        return newFixedLengthResponse(
            Response.Status.OK,
            "application/json",
            jsonResponse
        )
    }

    companion object {
        // Extension function to check if string is JSON
        private fun String.isJson(): Boolean {
            return try {
                toJsonObject()
                true
            } catch (e: Exception) {
                false
            }
        }

        // Extension function to parse JSON
        private fun String.toJsonObject(): org.json.JSONObject {
            return org.json.JSONObject(this)
        }
    }
}