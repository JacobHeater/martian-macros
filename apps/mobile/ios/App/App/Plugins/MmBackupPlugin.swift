import Capacitor
import Foundation
import LocalAuthentication
import SQLite3
import UIKit
import UniformTypeIdentifiers

/// The phone's part of a backup (MM-63): a consistent copy of the database
/// (`VACUUM INTO`), a temporary file for a copy brought back, the share sheet
/// to save or send a file, and the document picker to choose one. The bytes
/// cross the bridge as base64; the app encrypts before it shares. It also
/// hands an https address to the phone's browser (MM-454): the browser
/// fetches the page, the app nothing. It keeps the progress photos private
/// (MM-157): the phone's own lock is asked before they show, and while they
/// do the app switcher shows a blank screen in their place. It reads and
/// writes the clipboard (MM-590); iOS asks the person before a paste.
@objc(MmBackupPlugin)
public class MmBackupPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MmBackupPlugin"
    public let jsName = "MmBackup"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "snapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeTemp", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeTemp", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "share", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pick", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openInBrowser", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unlock", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "protectScreen", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readClipboard", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeClipboard", returnType: CAPPluginReturnPromise),
    ]

    private var picker: PickDelegate?
    private var cover: UIView?
    private var observers: [NSObjectProtocol] = []

    private func tempUrl(_ name: String) -> URL {
        FileManager.default.temporaryDirectory.appendingPathComponent("mm-backup-\(UUID().uuidString)-\(name)")
    }

    @objc func snapshot(_ call: CAPPluginCall) {
        guard let name = call.getString("name") else { return call.reject("snapshot needs the database's name.") }
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let path = try MmFiles.databasePath(name)
                var connection: OpaquePointer?
                guard sqlite3_open_v2(path, &connection, SQLITE_OPEN_READONLY | SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK, let db = connection else {
                    throw MmFailure("The database could not be opened.")
                }
                defer { sqlite3_close_v2(db) }
                let copy = self.tempUrl("snapshot.sqlite")
                defer { try? FileManager.default.removeItem(at: copy) }
                let escaped = copy.path.replacingOccurrences(of: "'", with: "''")
                if sqlite3_exec(db, "VACUUM INTO '\(escaped)'", nil, nil, nil) != SQLITE_OK {
                    throw MmFailure(String(cString: sqlite3_errmsg(db)))
                }
                let data = try Data(contentsOf: copy)
                call.resolve(["data": data.base64EncodedString()])
            } catch {
                call.reject(mmMessage(error))
            }
        }
    }

    @objc func writeTemp(_ call: CAPPluginCall) {
        guard let data = Data(base64Encoded: call.getString("data") ?? "") else { return call.reject("Not base64.") }
        let url = tempUrl(call.getString("name") ?? "file")
        do {
            try data.write(to: url, options: .atomic)
            call.resolve(["path": url.path])
        } catch {
            call.reject(mmMessage(error))
        }
    }

    @objc func removeTemp(_ call: CAPPluginCall) {
        if let path = call.getString("path"), path.hasPrefix(FileManager.default.temporaryDirectory.path) {
            try? FileManager.default.removeItem(atPath: path)
        }
        call.resolve()
    }

    @objc func share(_ call: CAPPluginCall) {
        guard let name = call.getString("name"), let data = Data(base64Encoded: call.getString("data") ?? "") else {
            return call.reject("share needs a name and base64 data.")
        }
        DispatchQueue.main.async {
            guard let presenter = self.bridge?.viewController else { return call.reject("Nothing to present on.") }
            let url = self.tempUrl(name)
            do {
                try data.write(to: url, options: .atomic)
            } catch {
                return call.reject(mmMessage(error))
            }
            let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            sheet.completionWithItemsHandler = { _, completed, _, _ in
                try? FileManager.default.removeItem(at: url)
                call.resolve(["outcome": completed ? "saved" : "cancelled"])
            }
            if let popover = sheet.popoverPresentationController {
                popover.sourceView = presenter.view
                popover.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 1, height: 1)
            }
            presenter.present(sheet, animated: true)
        }
    }

    @objc func openInBrowser(_ call: CAPPluginCall) {
        guard let address = call.getString("url"), let url = URL(string: address), url.scheme == "https", url.host != nil else {
            return call.reject("Only an https address is opened.")
        }
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { opened in
                if opened {
                    call.resolve()
                } else {
                    call.reject("The browser could not be opened.")
                }
            }
        }
    }

    @objc func readClipboard(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let text = UIPasteboard.general.string {
                call.resolve(["text": text])
            } else {
                call.resolve([:])
            }
        }
    }

    @objc func writeClipboard(_ call: CAPPluginCall) {
        guard let text = call.getString("text") else { return call.reject("writeClipboard needs the text.") }
        DispatchQueue.main.async {
            UIPasteboard.general.string = text
            call.resolve()
        }
    }

    @objc func pick(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let presenter = self.bridge?.viewController else { return call.reject("Nothing to present on.") }
            let picker = UIDocumentPickerViewController(forOpeningContentTypes: [UTType.data, UTType.item], asCopy: true)
            picker.allowsMultipleSelection = false
            let delegate = PickDelegate { url in
                self.picker = nil
                guard let url else { return call.resolve(["cancelled": true]) }
                do {
                    let data = try Data(contentsOf: url)
                    try? FileManager.default.removeItem(at: url)
                    call.resolve(["cancelled": false, "data": data.base64EncodedString()])
                } catch {
                    call.reject(mmMessage(error))
                }
            }
            self.picker = delegate
            picker.delegate = delegate
            presenter.present(picker, animated: true)
        }
    }

    @objc func unlock(_ call: CAPPluginCall) {
        let context = LAContext()
        var problem: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &problem) else {
            // Only a phone with no passcode set has nothing to ask (MM-157). Any other reason the lock
            // cannot be asked (biometry locked out, the system busy) keeps the photos shut.
            return call.resolve(["outcome": MmBackupPlugin.noPasscode(problem) ? "noLock" : "refused"])
        }
        let asked = call.getString("reason") ?? ""
        let reason = asked.isEmpty ? "Unlock to see your progress photos." : asked
        // Face ID, Touch ID or the passcode, whichever the phone is locked with.
        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { passed, error in
            if passed { return call.resolve(["outcome": "unlocked"]) }
            call.resolve(["outcome": MmBackupPlugin.noPasscode(error) ? "noLock" : "refused"])
        }
    }

    /// Whether `error` says the phone has no passcode set: the one case in which there is no lock to ask.
    private static func noPasscode(_ error: Error?) -> Bool {
        guard let error = error as NSError? else { return false }
        return error.domain == LAErrorDomain && error.code == LAError.Code.passcodeNotSet.rawValue
    }

    @objc func protectScreen(_ call: CAPPluginCall) {
        let on = call.getBool("on") ?? false
        DispatchQueue.main.async {
            for observer in self.observers {
                NotificationCenter.default.removeObserver(observer)
            }
            self.observers = []
            self.uncover()
            if on {
                let center = NotificationCenter.default
                self.observers = [
                    center.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: .main) { [weak self] _ in
                        self?.coverScreen()
                    },
                    center.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in
                        self?.uncover()
                    },
                ]
            }
            call.resolve()
        }
    }

    /// A plain screen over the app while it is in the switcher, so a photo is never in its snapshot.
    private func coverScreen() {
        guard cover == nil, let window = bridge?.viewController?.view.window else { return }
        let blank = UIView(frame: window.bounds)
        blank.backgroundColor = .systemBackground
        blank.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        window.addSubview(blank)
        cover = blank
    }

    private func uncover() {
        cover?.removeFromSuperview()
        cover = nil
    }

    private final class PickDelegate: NSObject, UIDocumentPickerDelegate {
        private let done: (URL?) -> Void

        init(done: @escaping (URL?) -> Void) {
            self.done = done
        }

        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            done(urls.first)
        }

        func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
            done(nil)
        }
    }
}
