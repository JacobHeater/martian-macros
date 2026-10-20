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
    }
}
