import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-405: reminders on iOS. CI builds no iOS app, so this reads the Swift
 * source: the plan handed over is exactly what is pending, each reminder is
 * its prompt and nothing more, a refusal in Settings is reported as one,
 * and a reminder due while the app is open is still shown.
 */
const plugin = readFileSync('ios/App/App/Plugins/MmRemindersPlugin.swift', 'utf8');
const delegate = readFileSync('ios/App/App/AppDelegate.swift', 'utf8');
const kotlin = readFileSync('android/app/src/main/java/com/martianmacros/MmRemindersPlugin.kt', 'utf8');

const replaceAll = plugin.slice(plugin.indexOf('@objc func replaceAll'));

it('offers every method of the Android plugin', () => {
  const methods = [...kotlin.matchAll(/@PluginMethod\s+fun (\w+)\(/g)].map((m) => m[1]);
  expect(methods).toContain('replaceAll');
  for (const method of methods) {
    expect(plugin).toContain(`CAPPluginMethod(name: "${method}", returnType: CAPPluginReturnPromise)`);
    expect(plugin).toMatch(new RegExp(`@objc func ${method}\\(`));
  }
});

it('replaces what is pending rather than adding to it, after reading the whole plan', () => {
  const removed = replaceAll.indexOf('removeAllPendingNotificationRequests()');
  expect(removed).toBeGreaterThan(-1);
  expect(replaceAll.indexOf('A reminder needs a title and a time.')).toBeLessThan(removed);
  expect(replaceAll.indexOf('center.add(')).toBeGreaterThan(removed);
});

it('schedules each reminder at its wall-clock time, and lets a passed one go', () => {
  expect(replaceAll).toContain('UNCalendarNotificationTrigger(dateMatching: components, repeats: false)');
  expect(replaceAll).toMatch(/where reminder\.atMs >= now/);
});

it('shows the prompt as the title, with no body', () => {
  expect(replaceAll).toContain('content.title = reminder.title');
  expect(plugin).not.toMatch(/\.body\s*=/);
  expect(plugin).not.toMatch(/\.subtitle\s*=/);
});

it('asks for alerts and sound, and answers from the settings afterwards', () => {
  expect(plugin).toContain('requestAuthorization(options: [.alert, .sound])');
  expect(plugin).toContain('getNotificationSettings');
  expect(plugin).toContain('settings.authorizationStatus');
});

it('shows a reminder due while the app is open', () => {
  expect(delegate).toContain('UNUserNotificationCenter.current().delegate = self');
  expect(delegate).toContain('extension AppDelegate: UNUserNotificationCenterDelegate');
  expect(delegate).toMatch(/willPresent notification: UNNotification[\s\S]*completionHandler\(\[\.banner, \.sound\]\)/);
});
