package com.martianmacros

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Android forgets scheduled alarms when the phone turns off, so after a
 * restart the reminders the user turned on (MM-146) are set again from
 * what the app last scheduled. Ones whose times have passed are let go.
 * The same when exact alarms are allowed in the phone's settings (MM-248),
 * so what is scheduled comes on the minute from then.
 */
class ReminderBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Reminders.schedule(context, Reminders.scheduled(context))
    }
}
