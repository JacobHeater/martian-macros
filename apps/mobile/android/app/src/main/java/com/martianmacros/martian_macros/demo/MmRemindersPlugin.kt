package com.martianmacros.martian_macros.demo

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import org.json.JSONArray
import org.json.JSONObject

/**
 * Reminders scheduled on the device itself (MM-146): inexact alarms, so a
 * reminder a few minutes late needs no special permission. No push service
 * and no token; nothing leaves the device. What is scheduled is kept in
 * the app's own preferences so a restart can set it again (the boot
 * receiver), because Android forgets alarms when the phone turns off.
 */
@CapacitorPlugin(
    name = "MmReminders",
    permissions = [Permission(strings = [Manifest.permission.POST_NOTIFICATIONS], alias = "notifications")],
)
class MmRemindersPlugin : Plugin() {

    @PluginMethod
    fun requestPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) {
            answerPermission(call)
        } else {
            requestPermissionForAlias("notifications", call, "permissionAnswered")
        }
    }

    @PermissionCallback
    fun permissionAnswered(call: PluginCall) = answerPermission(call)

    private fun answerPermission(call: PluginCall) {
        val granted = NotificationManagerCompat.from(context).areNotificationsEnabled()
        call.resolve(JSObject().put("granted", granted))
    }

    @PluginMethod
    fun replaceAll(call: PluginCall) {
        val reminders = call.getArray("reminders") ?: return call.reject("replaceAll needs reminders.")
        try {
            Reminders.replaceAll(context, JSONArray(reminders.toString()))
            call.resolve()
        } catch (error: Throwable) {
            call.reject(error.message ?: error.toString())
        }
    }
}

/** The scheduling itself, shared with the boot receiver. */
object Reminders {
    private const val PREFS = "mm_reminders"
    private const val KEY = "scheduled"
    const val CHANNEL = "reminders"

    private fun alarms(context: Context) = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    private fun pending(context: Context, index: Int, title: String?): PendingIntent {
        val intent = Intent(context, ReminderReceiver::class.java)
        if (title != null) intent.putExtra("title", title).putExtra("id", index)
        return PendingIntent.getBroadcast(
            context,
            index,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    }

    /** Cancels everything scheduled before and schedules exactly `reminders`. */
    fun replaceAll(context: Context, reminders: JSONArray) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val before = JSONArray(prefs.getString(KEY, "[]") ?: "[]")
        for (index in 0 until before.length()) alarms(context).cancel(pending(context, index, null))
        prefs.edit().putString(KEY, reminders.toString()).apply()
        schedule(context, reminders)
    }

    /** Schedules `reminders` whose times have not already passed. */
    fun schedule(context: Context, reminders: JSONArray) {
        ensureChannel(context)
        val now = System.currentTimeMillis()
        for (index in 0 until reminders.length()) {
            val reminder = reminders.getJSONObject(index)
            val at = reminder.getLong("atMs")
            if (at < now) continue
            alarms(context).setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                at,
                pending(context, index, reminder.getString("title")),
            )
        }
    }

    /** What was last scheduled, for the boot receiver to set again. */
    fun scheduled(context: Context): JSONArray =
        JSONArray(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "[]") ?: "[]")

    fun ensureChannel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL, "Reminders", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "The reminders you turn on in Settings."
            },
        )
    }
}
