package org.leap.vpn

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.VpnService
import android.os.Build
import android.system.Os
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import com.web3desk.adr.R
import java.io.File
import java.io.FileOutputStream
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class LeafVpnService : VpnService() {
    private var serviceJob: Job? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isRunning = false
    private var configFile: File? = null

    init {
        System.loadLibrary("leaf")
    }

    private external fun runLeaf(configPath: String)
    private external fun stopLeaf()

    private fun getDefaultConfig(): String {
        return try {
            resources.openRawResource(R.raw.config).bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            Log.e("LeafVpnService", "Error reading default config", e)
            "" // Return empty config as fallback
        }
    }
    private suspend fun getPreferences(): Pair<String, String> = withContext(Dispatchers.IO) {
        val sharedPref = getSharedPreferences("vpn_preferences", Context.MODE_PRIVATE)
        val configDefault = getDefaultConfig()
        val config = sharedPref.getString("config", null) ?: configDefault
        val allowList = sharedPref.getString("allowList", "") ?: ""
        Pair(config, allowList)
    }
    private fun stopVpn() {
        try {
            serviceScope.launch(NonCancellable) {
                isRunning = false
                
                // 清理协程资源
                serviceJob?.cancel()
                serviceScope.cancel()
                
                // 清理VPN相关资源
                withContext(Dispatchers.IO) {
                    try {
                        stopLeaf()

                        // 清理配置文件
                        configFile?.let {
                            if (it.exists()) {
                                it.delete()
                            }
                        }
                        
                        // 清理其他临时文件
                        cleanupTempFiles()
                    } catch (e: Exception) {
                        Log.e("LeafVpnService", "Error during cleanup", e)
                    }
                }
                
                stopSelf()
            }
        } catch (e: Exception) {
            Log.e("LeafVpnService", "Fatal error during VPN shutdown", e)
            stopSelf()
        }
    }

    private fun cleanupTempFiles() {
        try {
            filesDir.listFiles()?.forEach { file ->
                if (file.name.endsWith(".conf") || file.name.endsWith(".tmp")) {
                    file.delete()
                }
            }
        } catch (e: Exception) {
            Log.e("LeafVpnService", "Error cleaning temp files", e)
        }
    }

    private val broadcastReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent != null && "signal_stop_leap" == intent.action) {
                stopVpn()
            }
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate() {
        super.onCreate()
        registerReceiver(broadcastReceiver, IntentFilter("signal_stop_leap"), Context.RECEIVER_NOT_EXPORTED)

        // Create notification channel for Android O and above
        val channel = NotificationChannel(
            "leap_vpn_channel",
            "CiCy VPN Service",
            NotificationManager.IMPORTANCE_LOW
        )
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)

        // Create notification
        val notification = NotificationCompat.Builder(this, "leap_vpn_channel")
            .setContentTitle("CiCy VPN")
            .setContentText("is running...")
            .setSmallIcon(R.mipmap.ic_stat_logo)
            .build()

        // Start foreground service with notification
        startForeground(1, notification)
    }

    override fun onDestroy() {
        serviceJob?.cancel()
        serviceScope.cancel()
        super.onDestroy()
        unregisterReceiver(broadcastReceiver)
    }


    private fun sendStateUpdate(state: String) {
        val intent = Intent("leap_vpn.state_changed")
        intent.putExtra("state", state)
        sendBroadcast(intent)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        sendStateUpdate("connecting")

        serviceJob = serviceScope.launch {
            val builder = Builder()
            try {
                builder.setSession("leaf")
                    .setMtu(9000)
                    .addAddress("10.255.0.1", 24)
                    .addDnsServer("8.8.8.8")
                    .addRoute("0.0.0.0", 0)
                    .addDisallowedApplication(packageName)

                val (_, allowList) = getPreferences()
                Log.d("LeafVpnService", "AllowList: $allowList")
                if (allowList.isNotBlank()) {
                    try {
                        // Split by comma or pipe (supporting both separators)
                        val packages = allowList.split(",", "|")
                            .map { it.trim() }
                            .filter { it.isNotBlank() }

                        packages.forEach { packageName ->
                            try {
                                builder.addAllowedApplication(packageName)
                                Log.d("LeafVpnService", "Allowed package: $packageName")
                            } catch (e: PackageManager.NameNotFoundException) {
                                Log.e("LeafVpnService", "Package not found: $packageName", e)
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("LeafVpnService", "Error processing allowList", e)
                    }
                }


            } catch (e: PackageManager.NameNotFoundException) {
                throw RuntimeException(e)
            }

            val tunFd = builder.establish()
            if (tunFd != null) {
                sendStateUpdate("connected")
                withContext(Dispatchers.IO) {
                    try {
                        val (config, _) = getPreferences()

                        // Use the values
                        Log.d("LeafVpnService", "Config: $config")

                        val configFile = File(filesDir, "config.conf")
                        var configContent = config
                        val fdName = tunFd.detachFd().toString()
                        configContent = configContent.replace("[General]", "[General]\ntun-fd = $fdName")

                        FileOutputStream(configFile).use { fos ->
                            fos.write(configContent.toByteArray())
                        }

                        if (configFile.exists() && configFile.length() > 0) {
                            Log.d("LeafVpnService", "Config file written successfully")
                        } else {
                            Log.d("LeafVpnService", "Config file writing failed")
                        }

                        Os.setenv("LOG_NO_COLOR", "true", true)
                        Log.d("LeafVpnService", configFile.absolutePath)
                        runLeaf(configFile.absolutePath)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            } else {
                Log.e("LeafVpnService", "VPN interface creation failed")
            }
        }

        return START_STICKY
    }

    override fun onRevoke() {
        super.onRevoke()
        // Send disconnected state
        sendStateUpdate("disconnected")
        // When the system VPN connection is interrupted, clean up all resources
        stopVpn()
    }
}
