import Capacitor
import Foundation
import UIKit
import WebKit

/// `mm screenshot --phone` (MM-536), in the dev and demo apps only, never
/// the real one (`com.martianmacros`, MM-8): a picture of the app's own web
/// view, so no status bar or system interface. The Mac asks through
/// `xcrun devicectl` alone: it copies `mm-screenshot-<stamp>.request` into
/// this app's `Library/Caches`, opens the app, and posts the Darwin
/// notification `<bundle id>.mm-screenshot`. The app looks when this plugin
/// loads, when it becomes active and on that notification, writes
/// `mm-screenshot-<stamp>.png` beside the request, and deletes every other
/// request and picture of its own; the Mac copies the picture out. The
/// notification alone does nothing. No method is open to the web app.
@objc(MmScreenshotPlugin)
public class MmScreenshotPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MmScreenshotPlugin"
    public let jsName = "MmScreenshot"
    public let pluginMethods: [CAPPluginMethod] = []

    /// The real app's id; it and anything not one of its twins take no screenshots.
    static let prodBundleId = "com.martianmacros"
    static let prefix = "mm-screenshot-"
    static let requestSuffix = ".request"

    /// Whether this build may take screenshots: a twin (`com.martianmacros.dev`, `.demo`), never the real app.
    static var isAllowed: Bool {
        guard let id = Bundle.main.bundleIdentifier else { return false }
        return id != prodBundleId && id.hasPrefix(prodBundleId + ".")
    }

    static var notificationName: String { (Bundle.main.bundleIdentifier ?? prodBundleId) + ".mm-screenshot" }

    /// Where the requests and the picture are: `Library/Caches`, which the Mac reaches as the app's data container.
    static var folder: URL? { FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first }

    /// A stamp the Mac wrote: letters, digits and hyphens, so a name cannot leave the folder.
    static func isStamp(_ stamp: String) -> Bool {
        !stamp.isEmpty && stamp.count <= 64 && stamp.allSatisfy { $0.isASCII && ($0.isLetter || $0.isNumber || $0 == "-") }
    }

    private var busy = false
    private var observing = false
    /// Not before the first page has had a moment to draw: a cold start's first look would picture a blank view.
    private var readyAt = Date.distantFuture

    override public func load() {
        guard MmScreenshotPlugin.isAllowed else { return }
        observing = true
        readyAt = Date().addingTimeInterval(2)
        let observer = UnsafeRawPointer(Unmanaged.passUnretained(self).toOpaque())
        CFNotificationCenterAddObserver(
            CFNotificationCenterGetDarwinNotifyCenter(),
            observer,
            { _, observer, _, _, _ in
                guard let observer = observer else { return }
                let plugin = Unmanaged<MmScreenshotPlugin>.fromOpaque(observer).takeUnretainedValue()
                DispatchQueue.main.async { plugin.serveRequest() }
            },
            MmScreenshotPlugin.notificationName as CFString,
            nil,
            .deliverImmediately
        )
        NotificationCenter.default.addObserver(
            self, selector: #selector(becameActive), name: UIApplication.didBecomeActiveNotification, object: nil
        )
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { self.serveRequest() }
    }

    deinit {
        guard observing else { return }
        CFNotificationCenterRemoveEveryObserver(
            CFNotificationCenterGetDarwinNotifyCenter(), UnsafeRawPointer(Unmanaged.passUnretained(self).toOpaque())
        )
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func becameActive() {
        serveRequest()
    }

    /// Answers the newest request with a picture of the web view, once the page has loaded; the Mac asks again until it has one.
    private func serveRequest() {
        guard MmScreenshotPlugin.isAllowed, !busy, Date() >= readyAt,
              let webView = bridge?.webView, webView.url != nil, !webView.isLoading,
              let folder = MmScreenshotPlugin.folder,
              let names = try? FileManager.default.contentsOfDirectory(atPath: folder.path) else { return }
        let ours = names.filter { $0.hasPrefix(MmScreenshotPlugin.prefix) }
        guard let request = ours.filter({ $0.hasSuffix(MmScreenshotPlugin.requestSuffix) }).sorted().last else { return }
        let stamp = String(request.dropFirst(MmScreenshotPlugin.prefix.count).dropLast(MmScreenshotPlugin.requestSuffix.count))
        let picture = "\(MmScreenshotPlugin.prefix)\(stamp).png"
        guard MmScreenshotPlugin.isStamp(stamp) else {
            try? FileManager.default.removeItem(at: folder.appendingPathComponent(request))
            return
        }
        busy = true
        webView.takeSnapshot(with: WKSnapshotConfiguration()) { image, _ in
            guard let data = image?.pngData() else {
                // The request stays, so the Mac's next notification tries again.
                self.busy = false
                return
            }
            DispatchQueue.global(qos: .userInitiated).async {
                if (try? data.write(to: folder.appendingPathComponent(picture), options: .atomic)) != nil {
                    for name in ours where name != picture {
                        try? FileManager.default.removeItem(at: folder.appendingPathComponent(name))
                    }
                }
                DispatchQueue.main.async { self.busy = false }
            }
        }
    }
}
