import Capacitor
import Foundation
import HealthKit

/**
 * Apple Health (MM-69), behind the same interface as Health Connect. It
 * reads only the kinds the person was asked about, and nothing read leaves
 * the device. Each reading is handed over in Health Connect's units
 * (kilograms, percent, meters, a count), so the app's one adapter serves
 * both. What this app wrote is never read back as a reading.
 *
 * HealthKit never tells an app that reading a kind was refused, so
 * "permitted" here is the set of kinds asked for, kept in the app's own
 * preferences. An anchored query's anchor is the change token.
 *
 * It writes only what the person turned on in Settings (MM-70, MM-314,
 * MM-489): food, water and finished workouts, each asked for by itself with
 * share authorization alone, never with reading. HealthKit does say whether
 * sharing was allowed, so a kind is written only while it is on (kept in
 * the app's preferences) and allowed. Every object it writes carries the
 * app's id for it, so writing again replaces it and removing it removes
 * only the app's own.
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
        CAPPluginMethod(name: "openPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "dailySteps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "changesToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "changes", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writing", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startWriting", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopWriting", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeNamespace", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "renewWriteNamespace", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeNutrition", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeNutrition", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeWater", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeWater", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readWorkouts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeWorkout", returnType: CAPPluginReturnPromise),
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

    /// Apple Health has no screen of one app's permissions that an app can open (MM-323): the route is said in words instead.
    @objc func openPermissions(_ call: CAPPluginCall) {
        call.resolve(["opened": false])
    }

    private func ms(_ date: Date) -> Int { Int((date.timeIntervalSince1970 * 1000).rounded()) }

    /// A reading as the adapter receives it, its value in Health Connect's unit; nil for one the app does not import.
    private func raw(_ name: String, _ sample: HKSample) -> JSObject? {
        // What this app wrote is never read back as a reading (MM-70).
        if sample.sourceRevision.source == HKSource.default() { return nil }
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

    /// Each local day's steps from `fromMs` up to `toMs` (MM-442), as Apple Health totals them: a statistics query's cumulative sum applies the order of sources the person set, so a walk the phone and a watch both counted is counted once. `startMs` is each day's local midnight. A statistics collection query is there from iOS 8, inside the iOS 15 target.
    @objc func dailySteps(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.reject(Self.notHere) }
        let from = dateArgument(call, "fromMs")
        let to = dateArgument(call, "toMs")
        if from >= to { return call.resolve(["days": []]) }
        let calendar = Calendar.current
        let query = HKStatisticsCollectionQuery(
            quantityType: HKQuantityType(.stepCount),
            quantitySamplePredicate: HKQuery.predicateForSamples(withStart: from, end: to, options: []),
            options: .cumulativeSum,
            anchorDate: calendar.startOfDay(for: from),
            intervalComponents: DateComponents(day: 1)
        )
        query.initialResultsHandler = { _, results, error in
            if let error = error { return call.reject(error.localizedDescription) }
            // One statistics a day; a day with no steps has no sum and is left out.
            let days: JSArray = (results?.statistics() ?? []).compactMap { (statistics: HKStatistics) -> JSObject? in
                guard let sum = statistics.sumQuantity() else { return nil }
                return ["startMs": self.ms(statistics.startDate), "steps": sum.doubleValue(for: .count())]
            }
            call.resolve(["days": days])
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
    // MARK: Writing (MM-70, MM-314, MM-489)

    private static let writingKey = "mm_health_writing"

    /// The app's metadata key for the id of the entry a sample was written for, so every sample of one entry is found again.
    private static let entryKey = "MartianMacrosEntryId"

    /// What each nutrient is written as, with the key the adapter sends it under and its unit.
    private static let nutrients: [(key: String, type: HKQuantityType, unit: HKUnit)] = [
        ("kcal", HKQuantityType(.dietaryEnergyConsumed), .kilocalorie()),
        ("proteinG", HKQuantityType(.dietaryProtein), .gram()),
        ("carbsG", HKQuantityType(.dietaryCarbohydrates), .gram()),
        ("fatG", HKQuantityType(.dietaryFatTotal), .gram()),
        ("fiberG", HKQuantityType(.dietaryFiber), .gram()),
        ("sugarsG", HKQuantityType(.dietarySugar), .gram()),
        ("saturatedFatG", HKQuantityType(.dietaryFatSaturated), .gram()),
        ("sodiumMg", HKQuantityType(.dietarySodium), .gramUnit(with: .milli)),
    ]

    private static let water = HKQuantityType(.dietaryWater)

    /// What each kind asks to share. Food is allowed once its energy is; a nutrient not allowed is left out.
    private static func shared(_ kind: String) -> [HKSampleType] {
        switch kind {
        case "food": return nutrients.map(\.type)
        case "water": return [water]
        case "workouts": return [HKObjectType.workoutType()]
        default: return []
        }
    }

    private var writingOn: Set<String> {
        get { Set(UserDefaults.standard.stringArray(forKey: Self.writingKey) ?? []) }
        set { UserDefaults.standard.set(Array(newValue).sorted(), forKey: Self.writingKey) }
    }

    private func allowed(_ type: HKObjectType) -> Bool { store.authorizationStatus(for: type) == .sharingAuthorized }

    /// Whether `kind` is on and Apple Health lets the app share it.
    private func writes(_ kind: String) -> Bool {
        guard HKHealthStore.isHealthDataAvailable(), writingOn.contains(kind), let first = Self.shared(kind).first else { return false }
        return allowed(first)
    }

    @objc func writing(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.reject(Self.notHere) }
        call.resolve(["kinds": (call.getArray("kinds") ?? []).compactMap { $0 as? String }.filter(writes)])
    }

    @objc func startWriting(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.reject(Self.notHere) }
        guard let kind = call.getString("kind") else { return call.reject("startWriting needs a kind.") }
        let types = Self.shared(kind)
        guard let first = types.first else { return call.reject("Not a kind this app writes: \(kind).") }
        store.requestAuthorization(toShare: Set(types), read: nil) { _, error in
            if let error = error { return call.reject(error.localizedDescription) }
            let on = self.allowed(first)
            if on { self.writingOn = self.writingOn.union([kind]) }
            call.resolve(["on": on])
        }
    }

    @objc func stopWriting(_ call: CAPPluginCall) {
        guard let kind = call.getString("kind") else { return call.reject("stopWriting needs a kind.") }
        writingOn = writingOn.subtracting([kind])
        call.resolve(["on": false])
    }

    /// Where the namespace every id the app writes carries is kept (MM-522).
    private static let namespaceKey = "mm_health_write_namespace"

    private static func newNamespace() -> String {
        String(UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased().prefix(12))
    }

    /// The write namespace (MM-522), made the first time it is asked for.
    @objc func writeNamespace(_ call: CAPPluginCall) {
        if let namespace = UserDefaults.standard.string(forKey: Self.namespaceKey), !namespace.isEmpty {
            return call.resolve(["namespace": namespace])
        }
        let namespace = Self.newNamespace()
        UserDefaults.standard.set(namespace, forKey: Self.namespaceKey)
        call.resolve(["namespace": namespace])
    }

    /// A new write namespace (MM-522), after the app's data is erased or restored.
    @objc func renewWriteNamespace(_ call: CAPPluginCall) {
        let namespace = Self.newNamespace()
        UserDefaults.standard.set(namespace, forKey: Self.namespaceKey)
        call.resolve(["namespace": namespace])
    }

    /// The metadata of what is written for the entry `id`: the app's id, and a sync identifier with a growing version, so HealthKit replaces rather than adds.
    private func owned(_ id: String, _ part: String) -> [String: Any] {
        [
            Self.entryKey: id,
            HKMetadataKeySyncIdentifier: "\(id):\(part)",
            HKMetadataKeySyncVersion: NSNumber(value: Int64(Date().timeIntervalSince1970 * 1000)),
        ]
    }

    /// Removes every sample of `types` this app wrote for the entry `id`, then runs `then`.
    private func removeOwn(_ id: String, _ types: [HKSampleType], then: @escaping (Error?) -> Void) {
        let predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForObjects(from: HKSource.default()),
            HKQuery.predicateForObjects(withMetadataKey: Self.entryKey, allowedValues: [id]),
        ])
        let group = DispatchGroup()
        var failure: Error?
        let lock = NSLock()
        for type in types where allowed(type) {
            group.enter()
            store.deleteObjects(of: type, predicate: predicate) { _, _, error in
                lock.lock()
                if let error = error { failure = error }
                lock.unlock()
                group.leave()
            }
        }
        group.notify(queue: .global()) { then(failure) }
    }

    /// Writes one logged food (MM-70): a sample for each nutrient given and allowed, what was written for it before removed first. A nutrient not given is not written.
    @objc func writeNutrition(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { return call.reject("writeNutrition needs an id.") }
        guard writes("food") else { return call.resolve(["written": false]) }
        let start = dateArgument(call, "startMs")
        let end = dateArgument(call, "endMs")
        var metadataBase: [String: Any] = [:]
        if let name = call.getString("name") { metadataBase[HKMetadataKeyFoodType] = name }
        let samples: [HKObject] = Self.nutrients.compactMap { nutrient in
            guard let value = call.getDouble(nutrient.key), allowed(nutrient.type) else { return nil }
            let metadata = metadataBase.merging(owned(id, nutrient.key)) { _, new in new }
            return HKQuantitySample(type: nutrient.type, quantity: HKQuantity(unit: nutrient.unit, doubleValue: value), start: start, end: end, metadata: metadata)
        }
        removeOwn(id, Self.nutrients.map(\.type)) { error in
            if let error = error { return call.reject(error.localizedDescription) }
            if samples.isEmpty { return call.resolve(["written": false]) }
            self.store.save(samples) { saved, error in
                if let error = error { return call.reject(error.localizedDescription) }
                call.resolve(["written": saved])
            }
        }
    }

    @objc func removeNutrition(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { return call.reject("removeNutrition needs an id.") }
        guard writes("food") else { return call.resolve(["removed": false]) }
        removeOwn(id, Self.nutrients.map(\.type)) { error in
            if let error = error { return call.reject(error.localizedDescription) }
            call.resolve(["removed": true])
        }
    }

    /// Writes one drink of water (MM-314) at the time it was logged, replacing what was written for it before.
    @objc func writeWater(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { return call.reject("writeWater needs an id.") }
        guard writes("water") else { return call.resolve(["written": false]) }
        let at = dateArgument(call, "atMs")
        let ml = call.getDouble("ml") ?? 0
        let sample = HKQuantitySample(type: Self.water, quantity: HKQuantity(unit: .literUnit(with: .milli), doubleValue: ml), start: at, end: at, metadata: owned(id, "water"))
        removeOwn(id, [Self.water]) { error in
            if let error = error { return call.reject(error.localizedDescription) }
            self.store.save(sample) { saved, error in
                if let error = error { return call.reject(error.localizedDescription) }
                call.resolve(["written": saved])
            }
        }
    }

    @objc func removeWater(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { return call.reject("removeWater needs an id.") }
        guard writes("water") else { return call.resolve(["removed": false]) }
        removeOwn(id, [Self.water]) { error in
            if let error = error { return call.reject(error.localizedDescription) }
            call.resolve(["removed": true])
        }
    }

    /// MM-188's strength types: a workout of one of these is imported as strength.
    private static let strengthTypes: Set<HKWorkoutActivityType> = [.traditionalStrengthTraining, .functionalStrengthTraining, .coreTraining]

    /// Workouts (MM-489), this app's own among them: the adapter knows them by their sync identifier. HealthKit has no segments.
    @objc func readWorkouts(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.reject(Self.notHere) }
        let predicate = HKQuery.predicateForSamples(withStart: dateArgument(call, "fromMs"), end: dateArgument(call, "toMs"), options: .strictStartDate)
        let byStart = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let query = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [byStart]) { _, samples, error in
            if let error = error { return call.reject(error.localizedDescription) }
            let workouts: JSArray = (samples ?? []).compactMap { sample in
                guard let workout = sample as? HKWorkout else { return nil }
                let json: JSObject = [
                    "id": workout.uuid.uuidString,
                    "clientId": workout.metadata?[HKMetadataKeySyncIdentifier] as? String ?? "",
                    "strength": Self.strengthTypes.contains(workout.workoutActivityType),
                    "startMs": self.ms(workout.startDate),
                    "endMs": self.ms(workout.endDate),
                    "sourceId": workout.sourceRevision.source.bundleIdentifier,
                    "sourceName": workout.sourceRevision.source.name,
                    "segments": [] as JSArray,
                ]
                return json
            }
            call.resolve(["workouts": workouts])
        }
        store.execute(query)
    }

    /// Writes a finished workout (MM-489) as traditional strength training, the session alone, under the app's id for it: HealthKit replaces a workout with the same sync identifier and a lower version.
    @objc func writeWorkout(_ call: CAPPluginCall) {
        guard let clientId = call.getString("clientId") else { return call.reject("writeWorkout needs a clientId.") }
        guard writes("workouts") else { return call.resolve(["written": false]) }
        let start = dateArgument(call, "startMs")
        let end = dateArgument(call, "endMs")
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .traditionalStrengthTraining
        let builder = HKWorkoutBuilder(healthStore: store, configuration: configuration, device: HKDevice.local())
        let metadata: [String: Any] = [
            HKMetadataKeySyncIdentifier: clientId,
            HKMetadataKeySyncVersion: NSNumber(value: Int64(Date().timeIntervalSince1970 * 1000)),
        ]
        builder.beginCollection(withStart: start) { _, error in
            if let error = error { return call.reject(error.localizedDescription) }
            builder.addMetadata(metadata) { _, error in
                if let error = error { return call.reject(error.localizedDescription) }
                builder.endCollection(withEnd: end) { _, error in
                    if let error = error { return call.reject(error.localizedDescription) }
                    builder.finishWorkout { workout, error in
                        if let error = error { return call.reject(error.localizedDescription) }
                        call.resolve(["written": workout != nil])
                    }
                }
            }
        }
    }
}
