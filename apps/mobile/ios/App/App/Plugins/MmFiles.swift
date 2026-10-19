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

    /// The app's own database `name`, as Android's `getDatabasePath(name)`.
    static func databasePath(_ name: String) throws -> String {
        try supportDirectory("databases").appendingPathComponent(name).path
    }
}
