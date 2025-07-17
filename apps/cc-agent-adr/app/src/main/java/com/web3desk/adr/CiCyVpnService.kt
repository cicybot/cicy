package com.web3desk.adr

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.VpnService
import android.util.Log
import androidx.core.app.NotificationCompat
import cn.mapleafgo.mobile.Mobile
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class CiCyVpnService : VpnService() {
    private var serviceJob: Job? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isRunning = false
    private val MTU = 9000

    private fun stopVpn() {
        try {
            serviceScope.launch(NonCancellable) {
                isRunning = false
                serviceJob?.cancel()
                serviceScope.cancel()
                Mobile.operateTun(false, 0, 0)
                sendStateUpdate("disconnected")
                stopSelf()
            }
        } catch (e: Exception) {
            Log.e("CicyVpnService", "Fatal error during VPN shutdown", e)
            stopSelf()
        }
    }


    private val broadcastReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent != null && "signal_stop_cicy" == intent.action) {
                stopVpn()
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        registerReceiver(
            broadcastReceiver,
            IntentFilter("signal_stop_cicy"),
            Context.RECEIVER_NOT_EXPORTED
        )
        // Create notification channel for Android O and above
        val channel = NotificationChannel(
            "cicy_vpn_channel",
            "CiCy VPN Service",
            NotificationManager.IMPORTANCE_LOW
        )
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)

        // Create notification
        val notification = NotificationCompat.Builder(this, "cicy_vpn_channel")
            .setContentTitle("CiCy VPN")
            .setContentText("is running...")
            .setSmallIcon(R.mipmap.ic_stat_logo)
            .build()

        // Start foreground service with notification
        startForeground(1, notification)
    }

    override fun onDestroy() {
        if (isRunning) {
            stopVpn()
        }
        super.onDestroy()
        unregisterReceiver(broadcastReceiver)
    }


    private fun sendStateUpdate(state: String) {
        val intent = Intent("vpn.state_changed")
        intent.putExtra("state", state)
        sendBroadcast(intent)
    }

    fun getAllowList(): Set<String> {
        val sharedPref = getSharedPreferences("vpn_preferences", Context.MODE_PRIVATE)
        return sharedPref.getString("allowList", "")
            ?.takeIf { it.isNotEmpty() }
            ?.split("|")
            ?.toSet()
            ?: emptySet()
    }


    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        sendStateUpdate("connecting")
        serviceJob = serviceScope.launch {
            try {
                val builder = Builder().apply {
                    configureVpn(
                        allowedApps = getAllowList(),  // 白名单模式
                    )
                }
                val tunFd = builder.establish()
                if (tunFd != null) {
                    sendStateUpdate("connected")
                    withContext(Dispatchers.IO) {
                        try {
                            Log.d("TunFD", "TUN fd ${tunFd.fd} ")
                            Mobile.operateTun(true, tunFd.detachFd(), MTU)
                            Mobile.startRust("127.0.0.1:7102")
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                } else {
                    Log.e("CicyVpnService", "VPN interface creation failed")
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        return START_STICKY
    }

    fun VpnService.Builder.configureVpn(
        allowedApps: Set<String> = emptySet(),
    ): VpnService.Builder {
        return this.apply {
            setSession("cicy")
            setMtu(MTU)
            addDnsServer("8.8.8.8")
            addDnsServer("114.114.114.114")
            // 路由配置
            addRoute("0.0.0.0", 0)
            addAddress("10.255.0.1", 24)
            // 应用过滤逻辑
            when {
                allowedApps.isNotEmpty() -> {
                    // 白名单模式：只允许指定应用
                    allowedApps.forEach { packageName ->
                        try {
                            addAllowedApplication(packageName)
                        } catch (e: PackageManager.NameNotFoundException) {
                            Log.w("VPNConfig", "App not found: $packageName")
                        }
                    }
                    // 默认阻止所有其他应用
                    setBlocking(true)
                }
            }
        }
    }

    override fun onRevoke() {
        super.onRevoke()
        sendStateUpdate("disconnected")
        if (isRunning) {
            stopVpn()
        }
    }
}
