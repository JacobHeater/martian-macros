import Capacitor
import Foundation
import HealthKit

/**
 * Apple Health (MM-69), behind the same interface as Health Connect. It
 * only reads, and only the kinds the person was asked about: nothing read
 * leaves the device, and the app writes nothing to the person's health
 * data. Each reading is handed over in Health Connect's units (kilograms,
 * percent, meters, a count), so the app's one adapter serves both.
 *
 * HealthKit never tells an app that reading a kind was refused, so
 * "permitted" here is the set of kinds asked for, kept in the app's own
 * preferences. An anchored query's anchor is the change token.
 */
@objc(MmHealthPlugin)
public class MmHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MmHealthPlugin"
    public let jsName = "MmHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "permitted", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "historyPermitted", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestHistory", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "changesToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "changes", returnType: CAPPluginReturnPromise),
    ]

    private static let askedKey = "mm_health_asked"
    private static let notHere = "Apple Health is not on this device."

    /// What the app calls each kind of reading, and what HealthKit calls it.
    private static let types: [(name: String, type: HKSampleType)] = [
        ("weight", HKQuantityType(.bodyMass)),
        ("bodyFat", HKQuantityType(.bodyFatPercentage)),
        ("leanMass", HKQuantityType(.leanBodyMass)),
        ("height", HKQuantityType(.height)),
        ("workout", HKObjectType.workoutType()),
        ("menstruation", HKCategoryType(.menstrualFlow)),
        ("steps", HKQuantityType(.stepCount)),
        ("sleep", HKCategoryType(.sleepAnalysis)),
    ]

    /// The sleep analysis values that are sleep (MM-250): not in bed, not awake. The staged values exist from iOS 16; before it every asleep segment is unspecified.
    private static var asleepValues: Set<Int> {
        if #available(iOS 16.0, *) {
            return [
                HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
                HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
                HKCategoryValueSleepAnalysis.asleepREM.rawValue,
            ]
        }
        // iOS 16 renamed .asleep to .asleepUnspecified; the raw value is the same.
        return [HKCategoryValueSleepAnalysis.asleep.rawValue]
    }

    private static func type(named name: String) -> HKSampleType? { types.first { $0.name == name }?.type }

    private let store = HKHealthStore()

    private var asked: Set<String> {
        get { Set(UserDefaults.standard.stringArray(forKey: Self.askedKey) ?? []) }
        set { UserDefaults.standard.set(Array(newValue).sorted(), forKey: Self.askedKey) }
    }

    private func typeNames(_ call: CAPPluginCall) -> [String] {
        (call.getArray("types") ?? []).compactMap { $0 as? String }
    }

    @objc func status(_ call: CAPPluginCall) {
        call.resolve(["status": HKHealthStore.isHealthDataAvailable() ? "available" : "unavailable"])
    }

    @objc func permitted(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.reject(Self.notHere) }
        let have = asked
        call.resolve(["types": typeNames(call).filter { have.contains($0) && Self.type(named: $0) != nil }])
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.reject(Self.notHere) }
        let names = typeNames(call).filter { Self.type(named: $0) != nil }
        let wanted = Set(names.compactMap(Self.type(named:)))
        if wanted.isEmpty { return call.resolve(["types": []]) }
        store.requestAuthorization(toShare: nil, read: wanted) { _, error in
            if let error = error { return call.reject(error.localizedDescription) }
            // The sheet was shown; what the person chose on it is not told to the app.
            self.asked = self.asked.union(names)
            let have = self.asked
            call.resolve(["types": Self.types.map(\.name).filter { have.contains($0) }])
        }
    }

    /// Whether readings from before a default window can be read (MM-73). HealthKit has no such window: a kind that may be read may be read as far back as it goes, so there is nothing to ask.
    @objc func historyPermitted(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.reject(Self.notHere) }
        call.resolve(["granted": true])
    }

    /// Nothing to ask on Apple Health (MM-73): it says how it stands, which is granted.
    @objc func requestHistory(_ call: CAPPluginCall) {
        historyPermitted(call)
    }

    private func ms(_ date: Date) -> Int { Int((date.timeIntervalSince1970 * 1000).rounded()) }

    /// A reading as the adapter receives it, its value in Health Connect's unit; nil for one the app does not import.
    private func raw(_ name: String, _ sample: HKSample) -> JSObject? {
        var json: JSObject = [
            "id": sample.uuid.uuidString,
            "type": name,
            "sourceId": sample.sourceRevision.source.bundleIdentifier,
            "sourceName": sample.sourceRevision.source.name,
            "startMs": ms(sample.startDate),
            "endMs": ms(sample.endDate),
        ]
        if let quantity = sample as? HKQuantitySample {
            switch name {
            case "weight", "leanMass": json["value"] = quantity.quantity.doubleValue(for: .gramUnit(with: .kilo))
            // HealthKit's percent is a fraction of one; Health Connect's is of a hundred.
            case "bodyFat": json["value"] = quantity.quantity.doubleValue(for: .percent()) * 100
            case "height": json["value"] = quantity.quantity.doubleValue(for: .meter())
            case "steps": json["value"] = quantity.quantity.doubleValue(for: .count())
            default: return nil
            }
        } else if let category = sample as? HKCategorySample, name == "menstruation" {
            // A day marked as no flow is not a day of flow.
            if category.value == HKCategoryValueMenstrualFlow.none.rawValue { return nil }
            json["value"] = Double(category.value)
        } else if let category = sample as? HKCategorySample, name == "sleep" {
            // Each asleep segment is one reading of its minutes; the app sums a night's (MM-250). In bed and awake are not sleep.
            if !Self.asleepValues.contains(category.value) { return nil }
            json["value"] = sample.endDate.timeIntervalSince(sample.startDate) / 60
        } else if !(sample is HKWorkout) || name != "workout" {
            return nil
        }
        return json
    }

    private func dateArgument(_ call: CAPPluginCall, _ key: String) -> Date {
        let ms = call.getDouble(key) ?? Double(call.getInt(key) ?? 0)
        return Date(timeIntervalSince1970: ms / 1000)
    }

    @objc func read(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.reject(Self.notHere) }
        guard let name = call.getString("type") else { return call.reject("read needs a type.") }
        guard let type = Self.type(named: name) else { return call.reject("Not a type this app reads: \(name).") }
        let predicate = HKQuery.predicateForSamples(withStart: dateArgument(call, "fromMs"), end: dateArgument(call, "toMs"), options: .strictStartDate)
        let byStart = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [byStart]) { _, samples, error in
            if let error = error { return call.reject(error.localizedDescription) }
            let records: JSArray = (samples ?? []).compactMap { self.raw(name, $0) }
            call.resolve(["records": records])
        }
        store.execute(query)
    }

    private static func token(of anchor: HKQueryAnchor?) -> String {
        guard let anchor = anchor,
              let data = try? NSKeyedArchiver.archivedData(withRootObject: anchor, requiringSecureCoding: true)
        else { return "" }
        return data.base64EncodedString()
    }

    private static func anchor(of token: String) -> HKQueryAnchor? {
        guard let data = Data(base64Encoded: token) else { return nil }
        return try? NSKeyedUnarchiver.unarchivedObject(ofClass: HKQueryAnchor.self, from: data)
    }

    /// A token for what is there now: the anchor after everything of `type`, so the next `changes` starts from here.
    @objc func changesToken(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.reject(Self.notHere) }
        guard let name = call.getString("type") else { return call.reject("changesToken needs a type.") }
        guard let type = Self.type(named: name) else { return call.reject("Not a type this app reads: \(name).") }
        let query = HKAnchoredObjectQuery(type: type, predicate: nil, anchor: nil, limit: HKObjectQueryNoLimit) { _, _, _, anchor, error in
            if let error = error { return call.reject(error.localizedDescription) }
            call.resolve(["token": Self.token(of: anchor)])
        }
        store.execute(query)
    }

    @objc func changes(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.reject(Self.notHere) }
        guard let token = call.getString("token") else { return call.reject("changes needs a token.") }
        let expired: JSObject = ["expired": true, "nextToken": "", "hasMore": false, "upserted": [] as JSArray, "deletedIds": [] as JSArray]
        guard let anchor = Self.anchor(of: token) else {
            // A token this plugin did not write: everything is to be read again, which is not an error.
            return call.resolve(expired)
        }
        // The anchor carries its type with it, so every kind is asked and sorted by name here.
        let group = DispatchGroup()
        var upserted: JSArray = []
        var deleted: JSArray = []
        var failure: Error?
        var next = anchor
        let lock = NSLock()
        for (name, type) in Self.types {
            group.enter()
            let query = HKAnchoredObjectQuery(type: type, predicate: nil, anchor: anchor, limit: HKObjectQueryNoLimit) { _, added, removed, newAnchor, error in
                lock.lock()
                if let error = error {
                    failure = error
                } else {
                    upserted.append(contentsOf: (added ?? []).compactMap { self.raw(name, $0) })
                    deleted.append(contentsOf: (removed ?? []).map { $0.uuid.uuidString })
                    if let newAnchor = newAnchor { next = newAnchor }
                }
                lock.unlock()
                group.leave()
            }
            store.execute(query)
        }
        group.notify(queue: .global()) {
            if let failure = failure { return call.reject(failure.localizedDescription) }
            call.resolve([
                "expired": false,
                "nextToken": Self.token(of: next),
                "hasMore": false,
                "upserted": upserted,
                "deletedIds": deleted,
            ])
        }
    }
}
