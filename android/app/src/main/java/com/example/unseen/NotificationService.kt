package com.example.unseen

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class NotificationService : Service() {

    private var isRunning = false
    private var executorService: ExecutorService? = null
    
    private val channelIdForeground = "UnseenSyncChannel"
    private val channelIdAlerts = "UnseenAlertsChannel"
    private val backendUrl = "https://unseen-s9h8.onrender.com/api"
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            isRunning = true
            
            // Start Foreground Service notification immediately to prevent crashes on Android 8.0+
            val silentNotification = createSilentNotification()
            startForeground(1, silentNotification)
            
            executorService = Executors.newSingleThreadExecutor()
            executorService?.submit {
                runPollingLoop()
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        isRunning = false
        executorService?.shutdownNow()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // 1. Silent channel for the foreground service persistence
            val syncChannel = NotificationChannel(
                channelIdForeground,
                "Background Sync",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps Unseen background notification service running"
                setShowBadge(false)
            }
            manager.createNotificationChannel(syncChannel)
            
            // 2. Loud channel for new notifications (Heads-up alert)
            val alertsChannel = NotificationChannel(
                channelIdAlerts,
                "Unseen Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifies you of new messages, likes, and comments"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }
            manager.createNotificationChannel(alertsChannel)
        }
    }

    private fun createSilentNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        return NotificationCompat.Builder(this, channelIdForeground)
            .setContentTitle("Unseen Active Connection")
            .setContentText("Checking for notifications in the background...")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    private fun runPollingLoop() {
        val sharedPref = getSharedPreferences("UnseenPrefs", Context.MODE_PRIVATE)
        
        while (isRunning) {
            val token = sharedPref.getString("accessToken", null)
            if (token.isNullOrEmpty()) {
                // No token, stop self as we are unauthenticated
                stopSelf()
                break
            }
            
            try {
                pollNotifications(token)
                pollMessages(token)
            } catch (e: Exception) {
                e.printStackTrace()
            }
            
            try {
                // Poll every 25 seconds
                Thread.sleep(25000)
            } catch (e: InterruptedException) {
                break
            }
        }
    }

    private fun pollNotifications(token: String) {
        val url = URL("$backendUrl/notifications")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "GET"
        conn.setRequestProperty("Authorization", "Bearer $token")
        conn.setRequestProperty("Content-Type", "application/json")
        conn.connectTimeout = 10000
        conn.readTimeout = 10000

        val responseCode = conn.responseCode
        if (responseCode == HttpURLConnection.HTTP_OK) {
            val reader = BufferedReader(InputStreamReader(conn.inputStream))
            val sb = java.lang.StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                sb.append(line)
            }
            reader.close()

            val notifs = JSONArray(sb.toString())
            processNotifications(notifs)
        } else if (responseCode == HttpURLConnection.HTTP_UNAUTHORIZED) {
            // Token expired or invalid, clear token and stop service
            val sharedPref = getSharedPreferences("UnseenPrefs", Context.MODE_PRIVATE)
            sharedPref.edit().remove("accessToken").apply()
            stopSelf()
        }
        conn.disconnect()
    }

    private fun processNotifications(notifs: JSONArray) {
        val sharedPref = getSharedPreferences("UnseenPrefs", Context.MODE_PRIVATE)
        val seenIds = sharedPref.getStringSet("seenNotifIds", mutableSetOf()) ?: mutableSetOf()
        val newSeenIds = seenIds.toMutableSet()
        var updated = false

        for (i in 0 until notifs.length()) {
            val notif = notifs.getJSONObject(i)
            val id = notif.optString("_id", "")
            val isRead = notif.optBoolean("isRead", false)

            if (id.isNotEmpty() && !isRead && !seenIds.contains(id)) {
                // It is unread and we haven't displayed it yet
                val type = notif.optString("type", "SYSTEM")
                val reason = notif.optString("reason", "")
                val sender = notif.optJSONObject("sender")
                val senderName = sender?.optString("displayName", "Someone") ?: "Someone"
                
                val title = "Unseen Alert"
                val body = when (type) {
                    "LIKE" -> "$senderName liked your confession"
                    "COMMENT" -> "$senderName commented on your confession"
                    "FOLLOW" -> "$senderName started following you"
                    "REPOST" -> "$senderName reposted your confession"
                    "REPORT" -> "Your content was reported: $reason"
                    else -> "You have a new alert"
                }

                showNotificationAlert(id.hashCode(), title, body)
                newSeenIds.add(id)
                updated = true
            }
        }

        if (updated) {
            // Keep up to 50 items
            if (newSeenIds.size > 50) {
                val list = newSeenIds.toList()
                val trimmed = list.subList(list.size - 50, list.size).toSet()
                sharedPref.edit().putStringSet("seenNotifIds", trimmed).apply()
            } else {
                sharedPref.edit().putStringSet("seenNotifIds", newSeenIds).apply()
            }
        }
    }

    private fun pollMessages(token: String) {
        val url = URL("$backendUrl/messages/conversations")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "GET"
        conn.setRequestProperty("Authorization", "Bearer $token")
        conn.setRequestProperty("Content-Type", "application/json")
        conn.connectTimeout = 10000
        conn.readTimeout = 10000

        val responseCode = conn.responseCode
        if (responseCode == HttpURLConnection.HTTP_OK) {
            val reader = BufferedReader(InputStreamReader(conn.inputStream))
            val sb = java.lang.StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                sb.append(line)
            }
            reader.close()

            val convs = JSONArray(sb.toString())
            processConversations(convs)
        }
        conn.disconnect()
    }

    private fun processConversations(convs: JSONArray) {
        val sharedPref = getSharedPreferences("UnseenPrefs", Context.MODE_PRIVATE)
        val seenMsgIds = sharedPref.getStringSet("seenMsgIds", mutableSetOf()) ?: mutableSetOf()
        val newSeenMsgIds = seenMsgIds.toMutableSet()
        var updated = false

        for (i in 0 until convs.length()) {
            val conv = convs.getJSONObject(i)
            val unreadCount = conv.optInt("unreadCount", 0)
            if (unreadCount > 0) {
                val lastMsg = conv.optJSONObject("lastMessage") ?: continue
                val msgId = lastMsg.optString("_id", "")
                
                // If we haven't notified for this specific message ID
                if (msgId.isNotEmpty() && !seenMsgIds.contains(msgId)) {
                    val participant = conv.optJSONObject("participant")
                    val senderName = participant?.optString("displayName", "Someone") ?: "Someone"
                    val content = lastMsg.optString("content", "Sent a message")
                    
                    showNotificationAlert(msgId.hashCode(), "New message from $senderName", content)
                    newSeenMsgIds.add(msgId)
                    updated = true
                }
            }
        }

        if (updated) {
            // Keep up to 50 items
            if (newSeenMsgIds.size > 50) {
                val list = newSeenMsgIds.toList()
                val trimmed = list.subList(list.size - 50, list.size).toSet()
                sharedPref.edit().putStringSet("seenMsgIds", trimmed).apply()
            } else {
                sharedPref.edit().putStringSet("seenMsgIds", newSeenMsgIds).apply()
            }
        }
    }

    private fun showNotificationAlert(id: Int, title: String, body: String) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, id, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, channelIdAlerts)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(Notification.DEFAULT_ALL)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(id, notification)
    }
}
