package com.web3desk.adr

import android.util.Log
import fi.iki.elonen.NanoHTTPD
import okhttp3.WebSocket
import org.json.JSONArray
import org.json.JSONObject
import java.io.InputStream

class LocalServer(private val context: MainActivity, port: Int) : NanoHTTPD("0.0.0.0", port) {
    private var wsClient: CCWebSocketClient? = null

    override fun start() {
        initWsClient()
        super.start()
    }

    override fun stop() {
        wsClient?.disconnect()
        wsClient = null
        super.stop()
    }

    private fun initWsClient() {
        val appInfo = context.appInfo()
        val clientId = appInfo.getString("clientId")

        wsClient = CCWebSocketClient("$clientId-APP", object : WsOptions {
            override fun onOpen(webSocket: WebSocket) {
                Log.d("WebSocket", "Connected!")
            }

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
                            "jsonrpc" -> MessageHandler(context).process(method, params)
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

    override fun serve(session: IHTTPSession?): Response {
        if (session == null) return newFixedLengthResponse("Session is null")
        val uri = session.uri ?: "/index.html"
        if (session.method == Method.OPTIONS && uri.equals("/screen")) {
            return addCorsHeaders(newFixedLengthResponse(Response.Status.OK, "text/plain", ""))
        }
        val response = when (val path = uri.removePrefix("/")) { // 去掉 URI 前缀 "/"
            "appInfo" -> handleAppInfoRequest()
            "screen" -> handleScreeRequest().apply { addCorsHeaders(this) }
            "jsonrpc" -> handleJSONRpcRequest(session)
            else -> handleFileRequest(path)
        }
        return response
    }

    private fun handleFileRequest(path: String): Response {
        return try {
            val actualPath = path.ifEmpty { "index.html" }
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

            val result = MessageHandler(context).process(method, params)
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


    private fun handleScreeRequest(): Response {
        val payload = JSONObject()
        var imgData = ""
        if (MainService.isStart) {
            imgData = MainService.screenImgData
        }

        var xml = ""
        if (InputService.isOpen) {
            xml = InputService.ctx?.getDumpAsUiAutomatorXml().toString()
        }

        if (imgData.isNotEmpty() && MainService.isStart) {
            payload.put("imgData", "data:image/jpeg;base64,$imgData")
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
        private fun String.isJson(): Boolean {
            return try {
                toJsonObject()
                true
            } catch (e: Exception) {
                false
            }
        }

        private fun String.toJsonObject(): JSONObject {
            return JSONObject(this)
        }
    }
}