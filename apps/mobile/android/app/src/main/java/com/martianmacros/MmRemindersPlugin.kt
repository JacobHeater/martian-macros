package com.martianmacros

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.result.ActivityResult
import androidx.core.app.NotificationManagerCompat
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.ZoneId

/**
 * Reminders scheduled on the device itself (MM-146). Exact alarms when the
 * person allowed them (MM-248), asked once from the reminder settings with
 * a reason; inexact ones otherwise, up to an hour late, with the same plan.
 * No push service and no token; nothing leaves the device. What is
 * scheduled is kept in the app's own preferences so a restart can set it
 * again (the boot receiver), because Android forgets alarms when the phone
 * turns off.
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
    fun exactAlarms(call: PluginCall) = answerTiming(call)

    /** The phone's own page for the permission (Android 12 and later); asked, whatever the answer (MM-248). */
    @PluginMethod
    fun openExactAlarmSetting(call: PluginCall) {
        Reminders.markAsked(context)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || Reminders.exact(context)) return answerTiming(call)
        val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + context.packageName))
        startActivityForResult(call, intent, "exactAlarmSettingClosed")
    }

    @ActivityCallback
    fun exactAlarmSettingClosed(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        // Allowed there: what is scheduled is set again, now on the minute.
        Reminders.schedule(context, Reminders.scheduled(context))
        answerTiming(call)
    }

    @PluginMethod
    fun skipExactAlarms(call: PluginCall) {
        Reminders.markAsked(context)
        answerTiming(call)
    }

    private fun answerTiming(call: PluginCall) = call.resolve(JSObject().put("timing", Reminders.timing(context)))

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
    private const val ZONE = "zone"
    private const val ASKED = "exactAlarmsAsked"

    /**
     * A reminder is shown as it arrives, over whatever is open, as iOS shows it (MM-727). Android keeps a
     * channel's importance as first made, so the channel with the lower one is deleted and this one made.
     */
    const val CHANNEL = "reminders-shown"
    private const val QUIET_CHANNEL = "reminders"

    /** One planned reminder, read whole before anything scheduled is touched (MM-727). */
    class Planned(val atMs: Long, val title: String)

    private fun planned(reminders: JSONArray): List<Planned> =
        (0 until reminders.length()).map { index ->
            val reminder = reminders.optJSONObject(index)
            val title = reminder?.optString("title", "") ?: ""
            if (reminder == null || title.isEmpty() || !reminder.has("atMs")) {
                throw IllegalArgumentException("A reminder needs a title and a time.")
            }
            Planned(reminder.getLong("atMs"), title)
        }

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

    /** Whether an alarm can be exact: always before Android 12, by the person's consent after (MM-248). */
    fun exact(context: Context): Boolean = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms(context).canScheduleExactAlarms()

    fun markAsked(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(ASKED, true).apply()
    }

    /** What the app's settings show: "onTheMinute", "notAsked" or "withinAnHour". */
    fun timing(context: Context): String = when {
        exact(context) -> "onTheMinute"
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(ASKED, false) -> "withinAnHour"
        else -> "notAsked"
    }

    /**
     * Cancels everything scheduled before and schedules exactly `reminders`: the whole plan is read first, so a
     * plan with a fault in it changes nothing (MM-727). The phone's time zone is kept with it, for `rezoned`.
     */
    fun replaceAll(context: Context, reminders: JSONArray) {
        val plan = planned(reminders)
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val before = JSONArray(prefs.getString(KEY, "[]") ?: "[]")
        for (index in 0 until before.length()) alarms(context).cancel(pending(context, index, null))
        prefs.edit().putString(KEY, reminders.toString()).putString(ZONE, ZoneId.systemDefault().id).apply()
        schedule(context, plan)
    }

    /**
     * After the phone's time zone changed (MM-727): each reminder keeps its wall-clock time, as an iOS calendar
     * trigger does, so a weigh-in at 7:00 is at 7:00 where the phone now is, not where it was.
     */
    fun rezoned(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val was = prefs.getString(ZONE, null)?.let { runCatching { ZoneId.of(it) }.getOrNull() } ?: return
        val now = ZoneId.systemDefault()
        if (was == now) return
        val before = JSONArray(prefs.getString(KEY, "[]") ?: "[]")
        val moved = JSONArray()
        for (index in 0 until before.length()) {
            val reminder = before.getJSONObject(index)
            val local = Instant.ofEpochMilli(reminder.getLong("atMs")).atZone(was).toLocalDateTime()
            moved.put(JSONObject(reminder.toString()).put("atMs", local.atZone(now).toInstant().toEpochMilli()))
        }
        prefs.edit().putString(KEY, moved.toString()).putString(ZONE, now.id).apply()
    }

    /** Schedules what was last planned again (the boot receiver, and exact alarms newly allowed). */
    fun schedule(context: Context, reminders: JSONArray) = schedule(context, planned(reminders))

    /**
     * Schedules `plan`'s reminders whose times have not already passed: exact when
     * allowed, inexact otherwise (MM-248). Setting one again replaces it.
     */
    private fun schedule(context: Context, plan: List<Planned>) {
        ensureChannel(context)
        val now = System.currentTimeMillis()
        val onTheMinute = exact(context)
        for ((index, reminder) in plan.withIndex()) {
            val at = reminder.atMs
            if (at < now) continue
            val intent = pending(context, index, reminder.title)
            try {
                if (onTheMinute) {
                    alarms(context).setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, intent)
                } else {
                    alarms(context).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, intent)
                }
            } catch (revoked: SecurityException) {
                // Withdrawn since the check: the inexact one, as if never allowed.
                alarms(context).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, intent)
            }
        }
    }

    /** What was last scheduled, for the boot receiver to set again. */
    fun scheduled(context: Context): JSONArray =
        JSONArray(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "[]") ?: "[]")

    fun ensureChannel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.deleteNotificationChannel(QUIET_CHANNEL)
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL, "Reminders", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "The reminders you turn on in Settings."
            },
        )
    }
}
