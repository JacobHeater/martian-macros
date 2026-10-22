import UIKit
import Capacitor

/// The app's own plugins (MM-403): the phone's storage and network, reminders,
/// the camera and Apple Health, registered as `MainActivity` registers the
/// Kotlin ones.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(MmDbPlugin())
        bridge?.registerPluginInstance(MmPacksPlugin())
        bridge?.registerPluginInstance(MmRemindersPlugin())
        bridge?.registerPluginInstance(MmScannerPlugin())
        bridge?.registerPluginInstance(MmHealthPlugin())
        bridge?.registerPluginInstance(MmBackupPlugin())
        // `mm screenshot --phone` (MM-536): every identity while the owner is the only user; the real app is blocked
        // again before any release (MM-552).
        if MmScreenshotPlugin.isAllowed {
            bridge?.registerPluginInstance(MmScreenshotPlugin())
        }
    }
}
