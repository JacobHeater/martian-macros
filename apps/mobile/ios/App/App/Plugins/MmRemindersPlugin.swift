import Foundation
import Capacitor
import UserNotifications

/**
 * Reminders scheduled on the device itself (MM-146, MM-405): local
 * notifications, each at its wall-clock time. No push service and no
 * token; nothing leaves the device. iOS keeps what is pending across a
 * restart, so nothing has to be set again. The prompt is the whole
 * notification: no weight, calories, target or streak ever appears on a
 * lock screen.
 */
@objc(MmRemindersPlugin)
public class MmRemindersPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MmRemindersPlugin"
    public let jsName = "MmReminders"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "replaceAll", returnType: CAPPluginReturnPromise),
    ]

    @objc func requestPermission(_ call: CAPPluginCall) {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound]) { _, _ in
            // What the settings say afterwards, so a refusal there is reported as one.
            center.getNotificationSettings { settings in
                let granted = [.authorized, .provisional, .ephemeral].contains(settings.authorizationStatus)
                call.resolve(["granted": granted])
            }
        }
    }

    /// Cancels everything scheduled before and schedules exactly these; a time already passed is let go.
    @objc func replaceAll(_ call: CAPPluginCall) {
        guard let reminders = call.getArray("reminders") else { return call.reject("replaceAll needs reminders.") }
        let center = UNUserNotificationCenter.current()
        center.removeAllPendingNotificationRequests()
        let now = Date().timeIntervalSince1970 * 1000
        let group = DispatchGroup()
        var failure: Error?
        for (index, entry) in reminders.enumerated() {
            guard let reminder = entry as? JSObject, let title = reminder["title"] as? String else {
                return call.reject("A reminder needs a title and a time.")
            }
            let at: Double
            if let whole = reminder["atMs"] as? Int {
                at = Double(whole)
            } else if let real = reminder["atMs"] as? Double {
                at = real
            } else {
                return call.reject("A reminder needs a title and a time.")
            }
            if at < now { continue }
            let content = UNMutableNotificationContent()
            content.title = title
            content.sound = .default
            let date = Date(timeIntervalSince1970: at / 1000)
            let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            group.enter()
            center.add(UNNotificationRequest(identifier: "mm-reminder-\(index)", content: content, trigger: trigger)) { error in
                if let error = error { failure = error }
                group.leave()
            }
        }
        group.notify(queue: .global()) {
            if let failure = failure {
                call.reject(failure.localizedDescription)
            } else {
                call.resolve()
            }
        }
    }
}
