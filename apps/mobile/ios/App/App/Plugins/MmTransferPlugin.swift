import Capacitor
import Foundation
import Network

/**
 * Moving to another phone (MM-695): a listener on the phone's Wi-Fi while its code is shown, and connections to the
 * other phone's address, carrying whole frames, each sent with its length first. What crosses is sealed by the app
 * before it reaches this plugin; the plugin only carries bytes, and only on the local network. The first listen or
 * connect is when iOS asks for Local Network access.
 */
@objc(MmTransferPlugin)
public class MmTransferPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MmTransferPlugin"
    public let jsName = "MmTransfer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "listen", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "accept", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopListening", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "send", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "receive", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise),
    ]

    /// A sealed frame of the app's largest chunk, with room to spare: anything longer is not the app's.
    private static let largestFrame = 1024 * 1024 + 1024

    private let queue = DispatchQueue(label: "com.martianmacros.transfer")
    private var listener: NWListener?
    private var listenCall: CAPPluginCall?
    private var pending: [NWConnection] = []
    private var accepting: [CAPPluginCall] = []
    private var connections: [String: NWConnection] = [:]

    @objc func listen(_ call: CAPPluginCall) {
        queue.async {
            guard let host = Self.wifiAddress() else { return call.reject("This phone has no Wi-Fi address.", "noWifi") }
            self.stop()
            let parameters = NWParameters.tcp
            parameters.requiredInterfaceType = .wifi
            guard let listener = try? NWListener(using: parameters, on: .any) else {
                return call.reject("Could not listen on the Wi-Fi.", "noWifi")
            }
            self.listener = listener
            self.listenCall = call
            listener.newConnectionHandler = { [weak self] connection in self?.arrived(connection) }
            listener.stateUpdateHandler = { [weak self, weak listener] state in
                guard let self = self, let call = self.listenCall else { return }
                switch state {
                case .ready:
                    self.listenCall = nil
                    call.resolve(["host": host, "port": Int(listener?.port?.rawValue ?? 0)])
                case .failed, .cancelled:
                    self.listenCall = nil
                    call.reject("Could not listen on the Wi-Fi.", "noWifi")
                default:
                    break
                }
            }
            listener.start(queue: self.queue)
        }
    }

    @objc func accept(_ call: CAPPluginCall) {
        queue.async {
            if !self.pending.isEmpty {
                return call.resolve(["connection": self.register(self.pending.removeFirst())])
            }
            guard self.listener != nil else { return call.reject("Not listening.", "stopped") }
            self.accepting.append(call)
        }
    }

    @objc func stopListening(_ call: CAPPluginCall) {
        queue.async {
            self.stop()
            call.resolve()
        }
    }

    @objc func connect(_ call: CAPPluginCall) {
        guard let host = call.getString("host"), let rawPort = call.getInt("port"),
              let port = NWEndpoint.Port(rawValue: UInt16(clamping: rawPort))
        else { return call.reject("A host and a port are needed.", "unreachable") }
        queue.async {
            let connection = NWConnection(host: NWEndpoint.Host(host), port: port, using: .tcp)
            var answered = false
            let answer: (Bool) -> Void = { reached in
                guard !answered else { return }
                answered = true
                if reached {
                    call.resolve(["connection": self.register(connection)])
                } else {
                    connection.cancel()
                    call.reject("Could not reach the other phone.", "unreachable")
                }
            }
            connection.stateUpdateHandler = { state in
                switch state {
                case .ready: answer(true)
                case .failed, .waiting, .cancelled: answer(false)
                default: break
                }
            }
            connection.start(queue: self.queue)
            self.queue.asyncAfter(deadline: .now() + 5) { answer(false) }
        }
    }

    @objc func send(_ call: CAPPluginCall) {
        guard let base64 = call.getString("data"), let data = Data(base64Encoded: base64) else {
            return call.reject("Nothing to send.", "broken")
        }
        queue.async {
            guard let connection = self.connections[call.getString("connection") ?? ""] else {
                return call.reject("No such connection.", "broken")
            }
            var length = UInt32(data.count).bigEndian
            var frame = Data(bytes: &length, count: 4)
            frame.append(data)
            connection.send(content: frame, completion: .contentProcessed { error in
                if error == nil { call.resolve() } else { call.reject("The connection dropped.", "broken") }
            })
        }
    }

    @objc func receive(_ call: CAPPluginCall) {
        queue.async {
            guard let connection = self.connections[call.getString("connection") ?? ""] else {
                return call.resolve(["closed": true])
            }
            Self.read(connection, count: 4) { header in
                guard let header = header else { return call.resolve(["closed": true]) }
                let length = header.reduce(0) { ($0 << 8) | Int($1) }
                guard length <= Self.largestFrame else {
                    connection.cancel()
                    return call.resolve(["closed": true])
                }
                if length == 0 { return call.resolve(["closed": false, "data": ""]) }
                Self.read(connection, count: length) { body in
                    guard let body = body else { return call.resolve(["closed": true]) }
                    call.resolve(["closed": false, "data": body.base64EncodedString()])
                }
            }
        }
    }

    @objc func close(_ call: CAPPluginCall) {
        queue.async {
            self.connections.removeValue(forKey: call.getString("connection") ?? "")?.cancel()
            call.resolve()
        }
    }

    /// On the queue: a connection that arrived, handed to a waiting accept or kept for the next.
    private func arrived(_ connection: NWConnection) {
        connection.start(queue: queue)
        if accepting.isEmpty {
            pending.append(connection)
        } else {
            accepting.removeFirst().resolve(["connection": register(connection)])
        }
    }

    /// On the queue: stops listening, and every accept still waiting hears so.
    private func stop() {
        listener?.cancel()
        listener = nil
        listenCall = nil
        for call in accepting { call.reject("Stopped listening.", "stopped") }
        accepting.removeAll()
        for connection in pending { connection.cancel() }
        pending.removeAll()
    }

    private func register(_ connection: NWConnection) -> String {
        let id = UUID().uuidString
        connections[id] = connection
        return id
    }

    /// Exactly `count` bytes, or nil once the other side hung up or the connection failed.
    private static func read(_ connection: NWConnection, count: Int, _ done: @escaping (Data?) -> Void) {
        connection.receive(minimumIncompleteLength: count, maximumLength: count) { data, _, isComplete, error in
            if let data = data, data.count == count { return done(data) }
            if error != nil || isComplete { return done(nil) }
            done(nil)
        }
    }

    /// The phone's IPv4 address on its Wi-Fi (en0), or nil when it has none.
    private static func wifiAddress() -> String? {
        var first: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&first) == 0, let start = first else { return nil }
        defer { freeifaddrs(first) }
        for pointer in sequence(first: start, next: { $0.pointee.ifa_next }) {
            let entry = pointer.pointee
            guard let address = entry.ifa_addr, address.pointee.sa_family == UInt8(AF_INET),
                  String(cString: entry.ifa_name) == "en0"
            else { continue }
            var host = [CChar](repeating: 0, count: Int(NI_MAXHOST))
            if getnameinfo(address, socklen_t(address.pointee.sa_len), &host, socklen_t(host.count), nil, 0, NI_NUMERICHOST) == 0 {
                return String(cString: host)
            }
        }
        return nil
    }
}
