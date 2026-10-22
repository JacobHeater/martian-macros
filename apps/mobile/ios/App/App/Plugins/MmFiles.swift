import Foundation

/// A failure a plugin reports to the app, by its message alone.
struct MmFailure: Error, CustomStringConvertible {
    let message: String
    init(_ message: String) { self.message = message }
    var description: String { message }
}

/// What a plugin says when something it was handed threw.
func mmMessage(_ error: Error) -> String {
    if let failure = error as? MmFailure { return failure.message }
    return error.localizedDescription
}

/// Where the app's own files live on the phone (MM-404): under
/// `Library/Application Support`, never `Documents`, and kept out of iCloud
/// and iTunes backups, as the Android shell keeps health data on the device.
enum MmFiles {
    static func supportDirectory(_ folder: String) throws -> URL {
        let base = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        var directory = base.appendingPathComponent(folder, isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try directory.setResourceValues(values)
        return directory
    }

    /// Marks the file at `path` as kept out of backups too, beside the folder it is in.
    static func excludeFromBackup(_ path: String) throws {
        var url = URL(fileURLWithPath: path)
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try url.setResourceValues(values)
    }

    /// Apple's SQLite flag that opens a database, and makes its journals, with
    /// `FileProtectionType.completeUnlessOpen` (`SQLITE_OPEN_FILEPROTECTION_COMPLETEUNLESSOPEN`).
    static let sqliteProtectionUnlessOpen: Int32 = 0x0020_0000

    /// Whether `path` is the progress photo database (MM-157), `<user database>-photos`.
    static func isPhotoDatabase(_ path: String) -> Bool {
        URL(fileURLWithPath: path).lastPathComponent.hasSuffix("-photos")
    }

    /// Gives the database at `path`, and any journal beside it, `.completeUnlessOpen`
    /// protection (MM-157): unreadable while the phone is locked unless the app already
    /// has it open. A file that is not there yet is left; SQLite's flag covers it when made.
    static func protectUnlessOpen(_ path: String) {
        let protection: [FileAttributeKey: Any] = [.protectionKey: FileProtectionType.completeUnlessOpen]
        for file in [path, path + "-journal", path + "-wal", path + "-shm"] where FileManager.default.fileExists(atPath: file) {
            try? FileManager.default.setAttributes(protection, ofItemAtPath: file)
        }
    }

    /// The app's own database `name`, as Android's `getDatabasePath(name)`.
    static func databasePath(_ name: String) throws -> String {
        try supportDirectory("databases").appendingPathComponent(name).path
    }
}
