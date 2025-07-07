package com.web3desk.adr

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import com.hjq.permissions.XXPermissions
import java.io.ByteArrayOutputStream
import java.util.Locale

const val LOCAL_SERVER_PORT = 4448
const val VERSION = "1.0.1"

//const val HOME_URL = "http://localhost:4448/?v=1"
const val HOME_URL = "http://192.168.196.244:5173/?v=1"


// Activity requestCode
const val REQ_INVOKE_PERMISSION_ACTIVITY_MEDIA_PROJECTION = 101
const val REQ_REQUEST_MEDIA_PROJECTION = 201

// Activity responseCode
const val RES_FAILED = -100

// intent action, extra
const val ACT_REQUEST_MEDIA_PROJECTION = "REQUEST_MEDIA_PROJECTION"
const val ACT_INIT_MEDIA_PROJECTION_AND_SERVICE = "INIT_MEDIA_PROJECTION_AND_SERVICE"
const val EXT_MEDIA_PROJECTION_RES_INTENT = "MEDIA_PROJECTION_RES_INTENT"


@SuppressLint("ConstantLocale")
val LOCAL_NAME = Locale.getDefault().toString()


val SCREEN_INFO = Info(0, 0, 1, 200)


data class Info(
    var width: Int, var height: Int, var scale: Int, var dpi: Int
)

fun requestPermission(context: Context, type: String) {
    XXPermissions.with(context)
        .permission(type)
        .request { _, all ->
            if (all) {
                Log.d("requestPermission", all.toString())
            }
        }
}

fun startAction(context: Context, action: String) {
    try {
        context.startActivity(Intent(action).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (ACTION_ACCESSIBILITY_SETTINGS != action) {
                data = Uri.parse("package:" + context.packageName)
            }
        })
    } catch (e: Exception) {
        e.printStackTrace()
    }
}


fun getScreenSize(windowManager: WindowManager): Pair<Int, Int> {
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

fun translate(input: String): String {
    Log.d("common", "translate:$LOCAL_NAME")
    return input;
}

fun bitmapToByteArray(
    bitmap: Bitmap,
    format: Bitmap.CompressFormat = Bitmap.CompressFormat.PNG,
    quality: Int = 100
): ByteArray {
    val outputStream = ByteArrayOutputStream()
    bitmap.compress(format, quality, outputStream)
    return outputStream.toByteArray()
}

fun stringToHex(input: String): String {
    return input.toByteArray(Charsets.UTF_8).joinToString("") { "%02x".format(it) }
}

fun padKeyTo8Bytes(key: String): String {
    return if (key.length >= 8) {
        key.substring(0, 8)  // Truncate if the key is longer than 8 characters
    } else {
        key.padEnd(8, '0')  // Pad with '0' if the key is shorter than 8 characters
    }
}
