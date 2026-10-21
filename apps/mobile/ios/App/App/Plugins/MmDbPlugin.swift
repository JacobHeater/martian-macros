import Foundation
import Capacitor
import SQLite3

/// The largest whole number JavaScript holds exactly.
private let maxExact: Int64 = 9_007_199_254_740_991

/// SQLite's `SQLITE_TRANSIENT`: copy what is bound, since the Swift value does not outlive the call.
private let transient = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

/**
 * SQLite on the phone's own storage (MM-231, MM-404), behind the same
 * contract as the WebAssembly build the browser and the tests use. Each
 * open database is one connection whose calls run in order on one queue,
 * so the TypeScript adapter's transactions hold. The system's SQLite is
 * used: it has FTS5, which the food packs need.
 */
@objc(MmDbPlugin)
public class MmDbPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MmDbPlugin"
    public let jsName = "MmDb"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "select", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "execute", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "executeScript", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise),
    ]

    private final class OpenDb {
        let connection: OpaquePointer
        let queue: DispatchQueue
        init(connection: OpaquePointer, queue: DispatchQueue) {
            self.connection = connection
            self.queue = queue
        }
    }

    private var open: [Int: OpenDb] = [:]
    private var nextHandle = 1
    private let lock = NSLock()

    private func register(_ db: OpenDb) -> Int {
        lock.lock()
        defer { lock.unlock() }
        let handle = nextHandle
        nextHandle += 1
        open[handle] = db
        return handle
    }

    private func lookup(_ handle: Int, remove: Bool = false) -> OpenDb? {
        lock.lock()
        defer { lock.unlock() }
        return remove ? open.removeValue(forKey: handle) : open[handle]
    }

    @objc func open(_ call: CAPPluginCall) {
        let readOnly = call.getBool("readOnly") ?? false
        let path: String
        let ownFile = call.getString("name") != nil
        if let name = call.getString("name") {
            do {
                path = try MmFiles.databasePath(name)
            } catch {
                return call.reject(mmMessage(error))
            }
        } else if let given = call.getString("path") {
            path = given
        } else {
            return call.reject("open needs a name or a path.")
        }
        let queue = DispatchQueue(label: "mm-db-\(path)")
        queue.async {
            var connection: OpaquePointer?
            let flags = (readOnly ? SQLITE_OPEN_READONLY : SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE) | SQLITE_OPEN_FULLMUTEX
            guard sqlite3_open_v2(path, &connection, flags, nil) == SQLITE_OK, let db = connection else {
                let message = connection.map { String(cString: sqlite3_errmsg($0)) } ?? "The database could not be opened."
                if let db = connection { sqlite3_close_v2(db) }
                return call.reject(message)
            }
            do {
                // A file that is not a database is only found out when it is read.
                try Self.run(db, "SELECT count(*) FROM sqlite_schema", params: [])
            } catch {
                sqlite3_close_v2(db)
                return call.reject(mmMessage(error))
            }
            // The app's own database is kept out of iCloud and iTunes backups, file and folder (MM-404).
            if ownFile { try? MmFiles.excludeFromBackup(path) }
            call.resolve(["db": self.register(OpenDb(connection: db, queue: queue))])
        }
    }

    /// Runs `step` on the database's own queue, after every call made before it.
    private func queued(_ call: CAPPluginCall, _ step: @escaping (OpaquePointer) throws -> Void) {
        guard let handle = call.getInt("db"), let db = lookup(handle) else {
            return call.reject("The database is closed.")
        }
        db.queue.async {
            do {
                try step(db.connection)
            } catch {
                call.reject(mmMessage(error))
            }
        }
    }

    @objc func select(_ call: CAPPluginCall) {
        queued(call) { db in
            let statement = try Self.prepared(db, call)
            defer { sqlite3_finalize(statement) }
            var rows: JSArray = []
            let columns = sqlite3_column_count(statement)
            while true {
                let code = sqlite3_step(statement)
                if code == SQLITE_DONE { break }
                guard code == SQLITE_ROW else { throw MmFailure(String(cString: sqlite3_errmsg(db))) }
                var row: JSObject = [:]
                for column in 0..<columns {
                    row[String(cString: sqlite3_column_name(statement, column))] = try Self.valueAt(statement, column)
                }
                rows.append(row)
            }
            call.resolve(["rows": rows])
        }
    }

    @objc func execute(_ call: CAPPluginCall) {
        queued(call) { db in
            let statement = try Self.prepared(db, call)
            defer { sqlite3_finalize(statement) }
            try Self.stepToEnd(db, statement)
            call.resolve()
        }
    }

    @objc func executeScript(_ call: CAPPluginCall) {
        queued(call) { db in
            for sql in Self.statementsOf(call.getString("sql") ?? "") {
                try Self.run(db, sql, params: [])
            }
            call.resolve()
        }
    }

    @objc func close(_ call: CAPPluginCall) {
        guard let handle = call.getInt("db"), let db = lookup(handle, remove: true) else {
            return call.reject("The database is closed.")
        }
        db.queue.async {
            if sqlite3_close_v2(db.connection) == SQLITE_OK {
                call.resolve()
            } else {
                call.reject(String(cString: sqlite3_errmsg(db.connection)))
            }
        }
    }

    // MARK: Statements

    private static func prepare(_ db: OpaquePointer, _ sql: String) throws -> OpaquePointer {
        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK, let prepared = statement else {
            throw MmFailure(String(cString: sqlite3_errmsg(db)))
        }
        return prepared
    }

    private static func prepared(_ db: OpaquePointer, _ call: CAPPluginCall) throws -> OpaquePointer {
        let statement = try prepare(db, call.getString("sql") ?? "")
        do {
            try bind(statement, call.getArray("params") ?? [])
        } catch {
            sqlite3_finalize(statement)
            throw error
        }
        return statement
    }

    /// Steps `statement` to its end; a statement that gives rows is stepped past them.
    private static func stepToEnd(_ db: OpaquePointer, _ statement: OpaquePointer) throws {
        while true {
            let code = sqlite3_step(statement)
            if code == SQLITE_DONE { return }
            guard code == SQLITE_ROW else { throw MmFailure(String(cString: sqlite3_errmsg(db))) }
        }
    }

    private static func run(_ db: OpaquePointer, _ sql: String, params: JSArray) throws {
        let statement = try prepare(db, sql)
        defer { sqlite3_finalize(statement) }
        try bind(statement, params)
        try stepToEnd(db, statement)
    }

    private static func bind(_ statement: OpaquePointer, _ params: JSArray) throws {
        for (index, value) in params.enumerated() {
            let at = Int32(index + 1)
            switch value {
            case is NSNull:
                sqlite3_bind_null(statement, at)
            case let text as String:
                sqlite3_bind_text(statement, at, text, -1, transient)
            case let whole as Int:
                sqlite3_bind_int64(statement, at, Int64(whole))
            case let real as Double:
                sqlite3_bind_double(statement, at, real)
            case let object as JSObject:
                // A blob crosses the bridge as { $blob: base64 }.
                guard let encoded = object["$blob"] as? String, let data = Data(base64Encoded: encoded) else {
                    throw MmFailure("Cannot bind the object given.")
                }
                if data.isEmpty {
                    sqlite3_bind_zeroblob(statement, at, 0)
                } else {
                    data.withUnsafeBytes { bytes in
                        _ = sqlite3_bind_blob(statement, at, bytes.baseAddress, Int32(data.count), transient)
                    }
                }
            default:
                throw MmFailure("Cannot bind a \(type(of: value)).")
            }
        }
    }

    private static func valueAt(_ statement: OpaquePointer, _ column: Int32) throws -> JSValue {
        switch sqlite3_column_type(statement, column) {
        case SQLITE_INTEGER:
            let number = sqlite3_column_int64(statement, column)
            if number > maxExact || number < -maxExact {
                let name = String(cString: sqlite3_column_name(statement, column))
                throw MmFailure("Column \(name) holds a whole number too large to use: \(number)")
            }
            return Int(number)
        case SQLITE_FLOAT:
            return sqlite3_column_double(statement, column)
        case SQLITE_TEXT:
            return String(cString: sqlite3_column_text(statement, column))
        case SQLITE_BLOB:
            let count = Int(sqlite3_column_bytes(statement, column))
            let data = count > 0 ? Data(bytes: sqlite3_column_blob(statement, column), count: count) : Data()
            return ["$blob": data.base64EncodedString()] as JSObject
        default:
            return NSNull()
        }
    }

    /**
     * The statements of a script, split on the semicolons between them:
     * never inside a string, a quoted name or a comment. This is how the
     * WebAssembly build's own `exec` reads a script.
     */
    static func statementsOf(_ script: String) -> [String] {
        var statements: [String] = []
        var current = ""
        var state: Character = " " // " " plain, "'" and "\"" quoted, "-" line comment, "*" block comment
        let chars = Array(script)
        var at = 0
        while at < chars.count {
            let char = chars[at]
            let next: Character = at + 1 < chars.count ? chars[at + 1] : "\0"
            switch state {
            case "'", "\"":
                current.append(char)
                if char == state { state = " " }
            case "-":
                current.append(char)
                if char == "\n" { state = " " }
            case "*":
                current.append(char)
                if char == "*" && next == "/" {
                    current.append(next)
                    at += 1
                    state = " "
                }
            default:
                if char == "'" || char == "\"" {
                    state = char
                    current.append(char)
                } else if char == "-" && next == "-" {
                    state = "-"
                    current.append(char)
                } else if char == "/" && next == "*" {
                    state = "*"
                    current.append(char)
                } else if char == ";" {
                    statements.append(current)
                    current = ""
                } else {
                    current.append(char)
                }
            }
            at += 1
        }
        statements.append(current)
        return statements.filter(holdsSql)
    }

    /// Whether anything is left of `statement` once comments are taken out.
    private static func holdsSql(_ statement: String) -> Bool {
        let bare = statement
            .replacingOccurrences(of: "/\\*.*?\\*/", with: " ", options: .regularExpression)
            .replacingOccurrences(of: "--[^\n]*", with: " ", options: .regularExpression)
        return !bare.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}
