package com.web3desk.adr

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream

fun getInstalledApps(context: Context, isAll: Boolean): JSONArray {
    val pm = context.packageManager
    val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
    val result = JSONArray()

    for (app in apps) {
        try {
            if (!isAll && isSystemApp(app)) {
                continue
            }
            val appInfo = JSONObject().apply {
                put("name", pm.getApplicationLabel(app)) // App name
                put("packageName", app.packageName)      // Package name
                put("isSystem", isSystemApp(app))        // Is system app
//                put("icon", getAppIconSafe(pm,app.packageName))     // App icon as base64
            }
            result.put(appInfo)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    return result
}

private fun isSystemApp(appInfo: ApplicationInfo): Boolean {
    return (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            || appInfo.icon === 0 || appInfo.name.isEmpty() ||
            (appInfo.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0
}

private fun getAppIconSafe(pm: PackageManager, packageName: String): String? {
    return try {
        val icon = pm.getApplicationIcon(packageName)
        // 使用缓存或缩小图标避免OOM
        val bitmap = (icon as BitmapDrawable).bitmap
        val resized = Bitmap.createScaledBitmap(bitmap, 64, 64, true)
        bitmapToBase64(resized)
    } catch (e: Exception) {
        null
    }
}

private fun bitmapToBase64(bitmap: Bitmap): String {
    val byteArrayOutputStream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 70, byteArrayOutputStream)
    return Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP)
}