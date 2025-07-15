package com.web3desk.adr

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.widget.Toast
import cn.mapleafgo.mobile.Mobile
import com.hjq.permissions.XXPermissions
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class MessageHandler(private val context: MainActivity) {
    fun process(method: String, params: JSONArray): JSONObject {
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
                    val clientId = context.appInfo().get("clientId")
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

            "editVpnConfig" -> {
                try {
                    if (params.length() > 0) {
                        context.editVpnConfig(params)
                    }

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

            "startVpn" -> {
                try {
                    if (params.length() > 0) {
                        context.editVpnConfig(params)
                    }
                    if (context.isVpnRunning()) {
                        Mobile.operateTun(false, 0, 0)
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
                context.appInfo()
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
                    put("imgData", "data:image/jpeg;base64,$data")
                    put("imgLen", data.length)
                }
            }

            "dumpWindowHierarchy" -> {
                var xml = ""
                if (InputService.isOpen) {
                    xml = InputService.ctx?.getDumpAsUiAutomatorXml().toString()
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
                    xml = InputService.ctx?.getDumpAsUiAutomatorXml().toString()
                }
                JSONObject().apply {
                    put("xml", xml)
                    put("imgData", "data:image/jpeg;base64,$imgData")
                    put("imgLen", imgData.length)
                }
            }


            "getOpencvJs" -> {
                val text = context.readFileFromAssets("opencv.js")
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

            "startAction" -> {
                startAction(context, params.get(0) as String)
                JSONObject().apply {
                    put("ok", true)
                }
            }

            "showToast" -> {
                Toast.makeText(context, params.get(0) as String, Toast.LENGTH_SHORT).show()
                JSONObject().apply {
                    put("ok", true)
                }
            }

            "requestNotificationPermission" -> {
                requestPermission(context, android.Manifest.permission.POST_NOTIFICATIONS)
                JSONObject().apply {
                    put("ok", true)
                }
            }

            "webviewIsReady" -> {
                context.webviewIsReady = true
                JSONObject().apply {
                    put("ok", true)
                }
            }

            "getInstalledApps" -> {
                val isAll = params.optString(0).equals("all")
                val apps = getInstalledApps(context, isAll)
                JSONObject().apply {
                    put("apps", apps)
                }
            }

            else -> {
                JSONObject().put("err", "Unknown method: $method")
            }
        }
    }
}