import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-727: Android's reminders behave as iOS's. A reminder due while the app
 * is open is shown over it (a channel of high importance; Android keeps a
 * channel's importance as first made, so the quiet one is deleted); a plan
 * is read whole before anything scheduled is touched; and after the phone's
 * time zone changes each reminder keeps its wall-clock time. Read from the
 * source: CI compiles the Kotlin and runs none of it.
 */
const plugin = readFileSync('android/app/src/main/java/com/martianmacros/MmRemindersPlugin.kt', 'utf8');
const receiver = readFileSync('android/app/src/main/java/com/martianmacros/ReminderBootReceiver.kt', 'utf8');
const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');

it('a reminder is shown as it arrives, over whatever is open, as on iOS', () => {
  expect(plugin).toContain('NotificationManager.IMPORTANCE_HIGH');
  expect(plugin).not.toContain('IMPORTANCE_DEFAULT');
  expect(plugin).toContain('const val CHANNEL = "reminders-shown"');
  expect(plugin).toContain('manager.deleteNotificationChannel(QUIET_CHANNEL)');
  const ios = readFileSync('ios/App/App/AppDelegate.swift', 'utf8');
  expect(ios).toContain('.banner');
});

it('a plan is read whole before anything scheduled is cancelled', () => {
  const start = plugin.indexOf('fun replaceAll(context: Context, reminders: JSONArray)');
  const body = plugin.slice(start, plugin.indexOf('fun rezoned(', start));
  expect(body.indexOf('val plan = planned(reminders)')).toBeGreaterThan(-1);
  expect(body.indexOf('val plan = planned(reminders)')).toBeLessThan(body.indexOf('.cancel('));
  expect(plugin).toContain('throw IllegalArgumentException("A reminder needs a title and a time.")');
});

it('after the phone’s time zone changes, each reminder keeps its wall-clock time', () => {
  expect(manifest).toContain('<action android:name="android.intent.action.TIMEZONE_CHANGED" />');
  expect(receiver).toContain('if (intent.action == Intent.ACTION_TIMEZONE_CHANGED) Reminders.rezoned(context)');
  expect(plugin).toContain('.atZone(was).toLocalDateTime()');
  expect(plugin).toContain('local.atZone(now).toInstant().toEpochMilli()');
  expect(plugin).toContain('putString(ZONE, ZoneId.systemDefault().id)');
});
