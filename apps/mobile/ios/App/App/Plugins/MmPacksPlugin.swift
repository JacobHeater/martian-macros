import Foundation
import Capacitor
import Compression
import CryptoKit

/**
 * Food-pack files on the phone's own storage (MM-56, MM-404), kept apart
 * from the user's database, and the one HTTP fetch this app ever makes: a
 * pack, or the list of packs on offer. The fetch sends no cookies, no
 * identifiers and no body; the host learns an IP address and which file
 * was asked for.
 *
 * The files and their names mirror the Android shell's store: `id.pack`
 * and `id.json` installed, `id.version.part` while downloading, `id.new`
 * while being checked, `id.pack.old` while being replaced.
 */
@objc(MmPacksPlugin)
public class MmPacksPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MmPacksPlugin"
    public let jsName = "MmPacks"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "installed", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "partialBytes", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writePartial", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "write", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "closeWriter", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "partialSha256", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "discardPartial", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "discardStaged", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "commit", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "httpGet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "httpAbort", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "httpGetToFile", returnType: CAPPluginReturnPromise),
    ]

    private let lock = NSLock()
    private var writers: [Int: FileHandle] = [:]
    private var requests: [Int: PackFetch] = [:]
    private var fileRequests: [Int: PackFileTransfer] = [:]
    private var nextId = 1

    private func allocate() -> Int {
        lock.lock()
        defer { lock.unlock() }
        let id = nextId
        nextId += 1
        return id
    }

    private func root() throws -> URL { try MmFiles.supportDirectory("food_packs") }
    private func installedFile(_ id: String) throws -> URL { try root().appendingPathComponent("\(id).pack") }
    private func metaFile(_ id: String) throws -> URL { try root().appendingPathComponent("\(id).json") }
    private func partialFile(_ id: String, _ version: String) throws -> URL { try root().appendingPathComponent("\(id).\(version).part") }
    private func stagingFile(_ id: String) throws -> URL { try root().appendingPathComponent("\(id).new") }

    /// An id or version as a piece of a file name: nothing that walks the tree.
    private func fileId(_ call: CAPPluginCall, _ key: String) -> String? {
        let value = call.getString(key) ?? ""
        let usable = !value.isEmpty && !value.contains("..") &&
            value.allSatisfy { $0.isLetter || $0.isNumber || $0 == "-" || $0 == "_" || $0 == "." }
        if !usable {
            call.reject("Not a usable \(key).")
            return nil
        }
        return value
    }

    private func answered(_ call: CAPPluginCall, _ step: () throws -> Void) {
        do {
            try step()
        } catch {
            call.reject(mmMessage(error))
        }
    }

    private func exists(_ url: URL) -> Bool { FileManager.default.fileExists(atPath: url.path) }

    private func size(_ url: URL) -> Int {
        ((try? FileManager.default.attributesOfItem(atPath: url.path))?[.size] as? NSNumber)?.intValue ?? 0
    }

    @objc func installed(_ call: CAPPluginCall) {
        answered(call) {
            var packs: JSArray = []
            let names = ((try? FileManager.default.contentsOfDirectory(atPath: try root().path)) ?? []).sorted()
            for name in names where name.hasSuffix(".pack") {
                let id = String(name.dropLast(".pack".count))
                let meta = try metaFile(id)
                guard exists(meta),
                      let data = try? Data(contentsOf: meta),
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let version = json["version"] as? String
                else { continue } // A pack whose record cannot be read is not offered.
                let file = try installedFile(id)
                var pack: JSObject = ["id": id, "version": version, "bytes": size(file), "path": file.path]
                if let title = json["title"] as? String { pack["title"] = title }
                packs.append(pack)
            }
            call.resolve(["packs": packs])
        }
    }

    @objc func partialBytes(_ call: CAPPluginCall) {
        guard let id = fileId(call, "id"), let version = fileId(call, "version") else { return }
        answered(call) {
            let file = try partialFile(id, version)
            call.resolve(["bytes": exists(file) ? size(file) : 0])
        }
    }

    @objc func writePartial(_ call: CAPPluginCall) {
        guard let id = fileId(call, "id"), let version = fileId(call, "version") else { return }
        let append = call.getBool("append") ?? false
        answered(call) {
            let file = try partialFile(id, version)
            if !append || !exists(file) {
                FileManager.default.createFile(atPath: file.path, contents: nil)
            }
            let handle = try FileHandle(forWritingTo: file)
            if append { try handle.seekToEnd() }
            let writer = allocate()
            lock.lock()
            writers[writer] = handle
            lock.unlock()
            call.resolve(["writer": writer])
        }
    }

    private func writer(_ call: CAPPluginCall, remove: Bool = false) -> FileHandle? {
        lock.lock()
        defer { lock.unlock() }
        let id = call.getInt("writer") ?? -1
        return remove ? writers.removeValue(forKey: id) : writers[id]
    }

    @objc func write(_ call: CAPPluginCall) {
        guard let handle = writer(call) else { return call.reject("The writer is closed.") }
        answered(call) {
            guard let data = Data(base64Encoded: call.getString("data") ?? "") else { throw MmFailure("Not base64.") }
            try handle.write(contentsOf: data)
            call.resolve()
        }
    }

    @objc func closeWriter(_ call: CAPPluginCall) {
        guard let handle = writer(call, remove: true) else { return call.resolve() }
        answered(call) {
            try handle.close()
            call.resolve()
        }
    }

    @objc func partialSha256(_ call: CAPPluginCall) {
        guard let id = fileId(call, "id"), let version = fileId(call, "version") else { return }
        answered(call) {
            var hasher = SHA256()
            let file = try partialFile(id, version)
            if exists(file) {
                let handle = try FileHandle(forReadingFrom: file)
                defer { try? handle.close() }
                while true {
                    let chunk = handle.readData(ofLength: 256 * 1024)
                    if chunk.isEmpty { break }
                    hasher.update(data: chunk)
                }
            }
            let hex = hasher.finalize().map { String(format: "%02x", $0) }.joined()
            call.resolve(["sha256": hex])
        }
    }

    @objc func discardPartial(_ call: CAPPluginCall) {
        guard let id = fileId(call, "id"), let version = fileId(call, "version") else { return }
        answered(call) {
            try? FileManager.default.removeItem(at: try partialFile(id, version))
            call.resolve()
        }
    }

    @objc func stage(_ call: CAPPluginCall) {
        guard let id = fileId(call, "id"), let version = fileId(call, "version") else { return }
        let gzip = call.getBool("gzip") ?? false
        answered(call) {
            let partial = try partialFile(id, version)
            let staged = try stagingFile(id)
            if exists(staged) { try FileManager.default.removeItem(at: staged) }
            if gzip {
                try Gunzip.unpack(from: partial, to: staged)
            } else {
                try FileManager.default.copyItem(at: partial, to: staged)
            }
            call.resolve(["path": staged.path])
        }
    }

    @objc func discardStaged(_ call: CAPPluginCall) {
        guard let id = fileId(call, "id") else { return }
        answered(call) {
            try? FileManager.default.removeItem(at: try stagingFile(id))
            call.resolve()
        }
    }

    @objc func commit(_ call: CAPPluginCall) {
        guard let id = fileId(call, "id"), let version = fileId(call, "version") else { return }
        let title = call.getString("title")
        answered(call) {
            let files = FileManager.default
            let staged = try stagingFile(id)
            let target = try installedFile(id)
            let backup = URL(fileURLWithPath: target.path + ".old")
            if exists(backup) { try files.removeItem(at: backup) }
            if exists(target) { try files.moveItem(at: target, to: backup) }
            do {
                try files.moveItem(at: staged, to: target)
                var meta: [String: Any] = ["version": version]
                if let title = title { meta["title"] = title }
                try JSONSerialization.data(withJSONObject: meta).write(to: try metaFile(id))
            } catch {
                // The earlier pack is kept working when the swap fails.
                if exists(backup) {
                    if exists(target) { try? files.removeItem(at: target) }
                    try? files.moveItem(at: backup, to: target)
                }
                throw error
            }
            if exists(backup) { try files.removeItem(at: backup) }
            call.resolve()
        }
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let id = fileId(call, "id") else { return }
        answered(call) {
            let directory = try root()
            for name in (try? FileManager.default.contentsOfDirectory(atPath: directory.path)) ?? [] {
                if name == "\(id).pack" || name == "\(id).json" || name == "\(id).new" || name == "\(id).pack.old" ||
                    (name.hasPrefix("\(id).") && name.hasSuffix(".part")) {
                    try? FileManager.default.removeItem(at: directory.appendingPathComponent(name))
                }
            }
            call.resolve()
        }
    }

    @objc func httpGet(_ call: CAPPluginCall) {
        guard let given = call.getString("url"), let url = URL(string: given) else { return call.reject("httpGet needs a url.") }
        let request = allocate()
        let fetch = PackFetch(request: request, call: call, plugin: self, url: url, rangeStart: call.getInt("rangeStart"))
        lock.lock()
        requests[request] = fetch
        lock.unlock()
        fetch.start()
    }

    @objc func httpAbort(_ call: CAPPluginCall) {
        let request = call.getInt("request") ?? -1
        lock.lock()
        let fetch = requests.removeValue(forKey: request)
        let transfer = fileRequests.removeValue(forKey: request)
        lock.unlock()
        fetch?.abort()
        transfer?.abort()
        call.resolve()
    }

    /// A pack file fetched straight into its partial (MM-387): no byte crosses into the WebView, only `packFileProgress` counts.
    @objc func httpGetToFile(_ call: CAPPluginCall) {
        guard let given = call.getString("url"), let url = URL(string: given) else { return call.reject("httpGetToFile needs a url.") }
        guard let id = fileId(call, "id"), let version = fileId(call, "version") else { return }
        answered(call) {
            let file = try partialFile(id, version)
            let request = allocate()
            let transfer = PackFileTransfer(request: request, call: call, plugin: self, url: url,
                                            rangeStart: call.getInt("rangeStart"), file: file)
            lock.lock()
            fileRequests[request] = transfer
            lock.unlock()
            transfer.start()
        }
    }

    /// How much of a pack file is in its partial, or its end, or its failure, as an event.
    fileprivate func fileProgress(_ data: JSObject) {
        notifyListeners("packFileProgress", data: data)
    }

    fileprivate func finishedFile(_ request: Int) {
        lock.lock()
        fileRequests.removeValue(forKey: request)
        lock.unlock()
    }

    /// A response's bytes, or its end, or its failure, as an event.
    fileprivate func chunk(_ data: JSObject) {
        notifyListeners("packHttpChunk", data: data)
    }

    fileprivate func finished(_ request: Int) {
        lock.lock()
        requests.removeValue(forKey: request)
        lock.unlock()
    }
}

/// One fetch, streamed to the app as it arrives: no cookies, no cache, no identifiers.
private final class PackFetch: NSObject, URLSessionDataDelegate {
    private let request: Int
    private let call: CAPPluginCall
    private weak var plugin: MmPacksPlugin?
    private var session: URLSession!
    private var task: URLSessionDataTask!
    private var resolved = false

    init(request: Int, call: CAPPluginCall, plugin: MmPacksPlugin, url: URL, rangeStart: Int?) {
        self.request = request
        self.call = call
        self.plugin = plugin
        super.init()
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = false
        configuration.httpCookieAcceptPolicy = .never
        configuration.urlCache = nil
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 24 * 60 * 60
        session = URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
        var urlRequest = URLRequest(url: url, timeoutInterval: 20)
        if let start = rangeStart { urlRequest.setValue("bytes=\(start)-", forHTTPHeaderField: "Range") }
        task = session.dataTask(with: urlRequest)
    }

    func start() { task.resume() }

    func abort() { task.cancel() }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse,
                    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        resolved = true
        call.resolve(["request": request, "status": (response as? HTTPURLResponse)?.statusCode ?? 0])
        completionHandler(.allow)
    }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        plugin?.chunk(["request": request, "data": data.base64EncodedString()])
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            if resolved {
                plugin?.chunk(["request": request, "error": error.localizedDescription])
            } else {
                call.reject(error.localizedDescription)
            }
        } else {
            plugin?.chunk(["request": request, "done": true])
        }
        plugin?.finished(request)
        session.finishTasksAndInvalidate()
    }
}

/// One pack file fetched into its partial as it arrives (MM-387): no cookies, no cache, no identifiers, and no byte
/// handed to the WebView. Nothing is written for a status other than 200 or 206; on 206 the partial is cut to
/// `rangeStart` and carried on from there, on 200 begun again. The session's delegate queue is serial, so the file
/// is only touched from it.
private final class PackFileTransfer: NSObject, URLSessionDataDelegate {
    private let request: Int
    private let call: CAPPluginCall
    private weak var plugin: MmPacksPlugin?
    private let file: URL
    private let rangeStart: Int?
    private var session: URLSession!
    private var task: URLSessionDataTask!
    private var resolved = false
    /// The status was neither 200 nor 206, and its end has been told.
    private var refused = false
    private var handle: FileHandle?
    private var written = 0
    private var told = 0
    /// Why the partial could not be written, when it could not.
    private var fileFailure: String?
    private let abortLock = NSLock()
    private var aborted = false

    init(request: Int, call: CAPPluginCall, plugin: MmPacksPlugin, url: URL, rangeStart: Int?, file: URL) {
        self.request = request
        self.call = call
        self.plugin = plugin
        self.file = file
        self.rangeStart = rangeStart
        super.init()
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = false
        configuration.httpCookieAcceptPolicy = .never
        configuration.urlCache = nil
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 24 * 60 * 60
        session = URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
        var urlRequest = URLRequest(url: url, timeoutInterval: 20)
        if let start = rangeStart { urlRequest.setValue("bytes=\(start)-", forHTTPHeaderField: "Range") }
        task = session.dataTask(with: urlRequest)
    }

    func start() { task.resume() }

    func abort() {
        abortLock.lock()
        aborted = true
        abortLock.unlock()
        task.cancel()
    }

    private var isAborted: Bool {
        abortLock.lock()
        defer { abortLock.unlock() }
        return aborted
    }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse,
                    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        resolved = true
        call.resolve(["request": request, "status": status])
        guard status == 200 || status == 206 else {
            refused = true
            plugin?.fileProgress(["request": request, "bytes": 0, "done": true])
            completionHandler(.cancel)
            return
        }
        let from = status == 206 ? max(rangeStart ?? 0, 0) : 0
        do {
            if !FileManager.default.fileExists(atPath: file.path) {
                FileManager.default.createFile(atPath: file.path, contents: nil)
            }
            let opened = try FileHandle(forWritingTo: file)
            let length = try opened.seekToEnd()
            if length < UInt64(from) {
                try? opened.close()
                throw MmFailure("The partial is shorter than the range asked for.")
            }
            try opened.truncate(atOffset: UInt64(from))
            try opened.seek(toOffset: UInt64(from))
            handle = opened
            completionHandler(.allow)
        } catch {
            fileFailure = mmMessage(error)
            completionHandler(.cancel)
        }
    }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        guard !isAborted, fileFailure == nil, let handle = handle else { return }
        do {
            try handle.write(contentsOf: data)
        } catch {
            fileFailure = mmMessage(error)
            dataTask.cancel()
            return
        }
        written += data.count
        // A count every 256 KiB is plenty for a progress bar, and keeps the events few.
        if written - told >= 256 * 1024 {
            told = written
            plugin?.fileProgress(["request": request, "bytes": written])
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let writing = handle {
            handle = nil
            do {
                try writing.synchronize()
                try writing.close()
            } catch {
                if fileFailure == nil { fileFailure = mmMessage(error) }
            }
        }
        if refused {
            // Its end was told when the status came.
        } else if let failure = fileFailure {
            if resolved {
                plugin?.fileProgress(["request": request, "error": failure, "writeFailed": true])
            } else {
                call.reject(failure)
            }
        } else if let error = error {
            if resolved {
                plugin?.fileProgress(["request": request, "error": error.localizedDescription])
            } else {
                call.reject(error.localizedDescription)
            }
        } else {
            plugin?.fileProgress(["request": request, "bytes": written, "done": true])
        }
        plugin?.finishedFile(request)
        session.finishTasksAndInvalidate()
    }
}

/// A gzip file unpacked as a stream with the system's zlib, so a pack of any size is never held in memory.
enum Gunzip {
    static func unpack(from source: URL, to target: URL) throws {
        let input = try FileHandle(forReadingFrom: source)
        defer { try? input.close() }
        try skipHeader(input)
        FileManager.default.createFile(atPath: target.path, contents: nil)
        let output = try FileHandle(forWritingTo: target)
        defer { try? output.close() }

        let bufferSize = 256 * 1024
        let sourceBuffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
        let destination = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
        defer {
            sourceBuffer.deallocate()
            destination.deallocate()
        }
        var stream = compression_stream(dst_ptr: destination, dst_size: bufferSize, src_ptr: sourceBuffer, src_size: 0, state: nil)
        guard compression_stream_init(&stream, COMPRESSION_STREAM_DECODE, COMPRESSION_ZLIB) == COMPRESSION_STATUS_OK else {
            throw MmFailure("The pack could not be unpacked.")
        }
        defer { compression_stream_destroy(&stream) }

        var ended = false
        while true {
            if stream.src_size == 0 && !ended {
                let chunk = input.readData(ofLength: bufferSize)
                ended = chunk.isEmpty
                chunk.copyBytes(to: sourceBuffer, count: chunk.count)
                stream.src_ptr = UnsafePointer(sourceBuffer)
                stream.src_size = chunk.count
            }
            stream.dst_ptr = destination
            stream.dst_size = bufferSize
            let status = compression_stream_process(&stream, ended ? Int32(COMPRESSION_STREAM_FINALIZE.rawValue) : 0)
            let produced = bufferSize - stream.dst_size
            if produced > 0 { try output.write(contentsOf: Data(bytes: destination, count: produced)) }
            switch status {
            case COMPRESSION_STATUS_END:
                return
            case COMPRESSION_STATUS_OK:
                if ended && produced == 0 && stream.src_size == 0 { throw MmFailure("The pack ended before its data did.") }
            default:
                throw MmFailure("The pack could not be unpacked.")
            }
        }
    }

    /// Past the gzip header (RFC 1952): the fixed ten bytes and whatever optional fields the flags say are there.
    private static func skipHeader(_ input: FileHandle) throws {
        let fixed = input.readData(ofLength: 10)
        guard fixed.count == 10, fixed[0] == 0x1f, fixed[1] == 0x8b, fixed[2] == 8 else { throw MmFailure("Not a gzip file.") }
        let flags = fixed[3]
        if flags & 0x04 != 0 {
            let length = input.readData(ofLength: 2)
            guard length.count == 2 else { throw MmFailure("Not a gzip file.") }
            _ = input.readData(ofLength: Int(length[0]) | (Int(length[1]) << 8))
        }
        if flags & 0x08 != 0 { try skipZeroTerminated(input) }
        if flags & 0x10 != 0 { try skipZeroTerminated(input) }
        if flags & 0x02 != 0 { _ = input.readData(ofLength: 2) }
    }

    private static func skipZeroTerminated(_ input: FileHandle) throws {
        while true {
            let byte = input.readData(ofLength: 1)
            guard byte.count == 1 else { throw MmFailure("Not a gzip file.") }
            if byte[0] == 0 { return }
        }
    }
}
