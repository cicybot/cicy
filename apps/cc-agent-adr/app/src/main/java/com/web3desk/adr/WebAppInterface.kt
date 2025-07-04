package com.web3desk.adr

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.util.Log
import android.webkit.JavascriptInterface
import android.widget.Toast
import com.hjq.permissions.XXPermissions

class WebAppInterface(private val context: MainActivity) {

    @JavascriptInterface
    fun getOpencvJs(): String {
        val text = context.readFileFromAssets("opencv.js")
        return text
    }

    @JavascriptInterface
    fun appInfo(): String {
        context.webviewIsReady = true
        val payload = context.appInfo()
        return payload.toString()
    }

    @JavascriptInterface
    fun startAccessibility(): Boolean {
        startAction(context, Settings.ACTION_ACCESSIBILITY_SETTINGS)
        return true
    }

    @JavascriptInterface
    fun stopAccessibility(): Boolean {
        InputService.ctx?.disableSelf()
        context.onStateChanged()
        return true
    }

    @JavascriptInterface
    fun startMediaProjection(): Boolean {
        if (MainService.isReady) {
            return true;
        }
        Intent(context, MainService::class.java).also {
            context.bindService(it, context.serviceConnection, Context.BIND_AUTO_CREATE)
        }

        context.requestMediaProjection()
        return true
    }

    @JavascriptInterface
    fun stopMediaProjection(): Boolean {
        Log.d("JavascriptInterface", "Stop service")
        context.mainService?.let {
            it.destroy()
            context.onStateChanged()
            return true;
        } ?: let {
            return false;
        }
    }

    @JavascriptInterface
    fun checkPermission(permission: String): Boolean {
        val isGranted = XXPermissions.isGranted(context, permission as String)
        Toast.makeText(context, if (isGranted) "true" else "false", Toast.LENGTH_SHORT).show()
        return isGranted
    }


    @JavascriptInterface
    fun requestPermission(permission: String): Boolean {
        requestPermission(context, permission)
        return true
    }

    @JavascriptInterface
    fun startAction(action: String): Boolean {
        startAction(context, action)
        return true
    }

    @JavascriptInterface
    fun showToast(msg: String): Boolean {
        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
        return true
    }
}