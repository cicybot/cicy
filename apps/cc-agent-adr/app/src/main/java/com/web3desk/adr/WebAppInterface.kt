package com.web3desk.adr

import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

class WebAppInterface(private val context: MainActivity) {
    @JavascriptInterface
    fun jsonRpc(data: String): String {
        return try {
            val jsonRequest = JSONObject(data)
            val method = jsonRequest.getString("method")
            val params = jsonRequest.optJSONArray("params") ?: JSONArray()
            val result = MessageHandler(context).process(method, params)
            // 构建JSON-RPC响应
            JSONObject().apply {
                put("jsonrpc", "2.0")
                put("result", result)
                put("id", jsonRequest.opt("id")) // 保持与请求相同的ID
            }.toString()

        } catch (e: Exception) {
            // 返回错误响应
            JSONObject().apply {
                put("jsonrpc", "2.0")
                put("err", JSONObject().apply {
                    put("code", -32603)
                    put("message", e.message ?: "Internal error")
                })
                put("id", null)
            }.toString()
        }
    }
}