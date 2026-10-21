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
        // `mm screenshot --phone` (MM-536): the dev and demo apps only, never the real one.
        if MmScreenshotPlugin.isAllowed {
            bridge?.registerPluginInstance(MmScreenshotPlugin())
        }
    }
}
