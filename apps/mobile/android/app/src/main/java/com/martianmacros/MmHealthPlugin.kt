package com.martianmacros

import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.BodyFatRecord
import androidx.health.connect.client.records.ExerciseSegment
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeightRecord
import androidx.health.connect.client.records.HydrationRecord
import androidx.health.connect.client.records.LeanBodyMassRecord
import androidx.health.connect.client.records.MealType
import androidx.health.connect.client.records.MenstruationFlowRecord
import androidx.health.connect.client.records.NutritionRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.changes.DeletionChange
import androidx.health.connect.client.changes.UpsertionChange
import androidx.health.connect.client.request.ChangesTokenRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.health.connect.client.units.Energy
import androidx.health.connect.client.units.Mass
import androidx.health.connect.client.units.Volume
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import kotlin.reflect.KClass

/**
 * Android's Health Connect (MM-68). It reads only what the user grants one
 * by one, and nothing read leaves the device. A read the platform refuses
 * is rejected, never answered with nothing.
 *
 * It writes only what the user turned on in Settings (MM-70, MM-314,
 * MM-489): food, water and finished workouts, each with its own write
 * permission, never asked for with reading. Which kinds are on is kept in
 * this plugin's preferences. Every record it writes carries the app's own
 * id as its client record id, so writing again replaces it and removing it
 * removes only the app's own record. What the app wrote is never read back
 * as a reading.
 */
@CapacitorPlugin(name = "MmHealth")
class MmHealthPlugin : Plugin() {

    /** What the app calls each kind of reading, and what Health Connect calls it. */
    private val types: Map<String, KClass<out Record>> = mapOf(
        "weight" to WeightRecord::class,
        "bodyFat" to BodyFatRecord::class,
        "leanMass" to LeanBodyMassRecord::class,
        "height" to HeightRecord::class,
        "workout" to ExerciseSessionRecord::class,
        "menstruation" to MenstruationFlowRecord::class,
        "steps" to StepsRecord::class,
        "sleep" to SleepSessionRecord::class,
    )

    /** The stages of a sleep session that are sleep: not awake, not in bed, not out of bed (MM-250). */
    private val asleepStages = setOf(
        SleepSessionRecord.STAGE_TYPE_SLEEPING,
        SleepSessionRecord.STAGE_TYPE_LIGHT,
        SleepSessionRecord.STAGE_TYPE_DEEP,
        SleepSessionRecord.STAGE_TYPE_REM,
    )

    /**
     * Minutes asleep in a session (MM-250): the asleep stages summed when the
     * platform recorded stages, else the whole span, since an app that writes
     * no stages writes the session as the time asleep.
     */
    private fun minutesAsleep(record: SleepSessionRecord): Double {
        val asleep = record.stages.filter { it.stage in asleepStages }
        val millis = if (asleep.isEmpty()) {
            Duration.between(record.startTime, record.endTime).toMillis()
        } else {
            asleep.sumOf { Duration.between(it.startTime, it.endTime).toMillis() }
        }
        return millis / 60000.0
    }

    /**
     * Reading further back than the thirty days before the first grant
     * (MM-73). Named as text so this builds whichever client version
     * spells the constant.
     */
    private val historyPermission = "android.permission.health.READ_HEALTH_DATA_HISTORY"

    /** Where the plugin keeps that it asked for the history once (MM-73). */
    private val historyAskedKey = "history_asked"

    private fun preferences() = context.getSharedPreferences("MmHealth", Context.MODE_PRIVATE)

    /** What the app writes, by the name the app calls it, and the record Health Connect keeps it as (MM-70, MM-314, MM-489). */
    private val writeTypes: Map<String, KClass<out Record>> = mapOf(
        "food" to NutritionRecord::class,
        "water" to HydrationRecord::class,
        "workouts" to ExerciseSessionRecord::class,
    )

    /** MM-188's strength types: a workout of one of these is imported as strength. */
    private val strengthTypes = setOf(
        ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING,
        ExerciseSessionRecord.EXERCISE_TYPE_WEIGHTLIFTING,
        ExerciseSessionRecord.EXERCISE_TYPE_CALISTHENICS,
    )

    /** Where the plugin keeps that writing `kind` is on (MM-70). */
    private fun writingKey(kind: String) = "writing_$kind"

    private val scope = CoroutineScope(Dispatchers.IO)

    private fun client() = HealthConnectClient.getOrCreate(context)

    private fun asked(call: PluginCall, step: suspend () -> Unit) {
        scope.launch {
            try {
                step()
            } catch (error: Throwable) {
                call.reject(error.message ?: error.toString())
            }
        }
    }

    private fun readPermissions(names: List<String>): Map<String, String> =
        names.mapNotNull { name -> types[name]?.let { name to HealthPermission.getReadPermission(it) } }.toMap()

    private fun typeNames(call: PluginCall, key: String = "types"): List<String> {
        val asked = call.getArray(key) ?: JSArray()
        return (0 until asked.length()).map { asked.getString(it) }
    }

    @PluginMethod
    fun status(call: PluginCall) {
        val status = when (HealthConnectClient.getSdkStatus(context)) {
            HealthConnectClient.SDK_AVAILABLE -> "available"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "updateRequired"
            else -> "unavailable"
        }
        call.resolve(JSObject().put("status", status))
    }

    @PluginMethod
    fun permitted(call: PluginCall) = asked(call) {
        val wanted = readPermissions(typeNames(call))
        val granted = client().permissionController.getGrantedPermissions()
        val have = JSArray()
        for ((name, permission) in wanted) if (granted.contains(permission)) have.put(name)
        call.resolve(JSObject().put("types", have))
    }

    @PluginMethod
    fun requestPermission(call: PluginCall) {
        val wanted = readPermissions(typeNames(call))
        if (wanted.isEmpty()) return call.resolve(JSObject().put("types", JSArray()))
        val contract = PermissionController.createRequestPermissionResultContract()
        val intent = contract.createIntent(context, wanted.values.toSet())
        startActivityForResult(call, intent, "permissionAnswered")
    }

    @ActivityCallback
    fun permissionAnswered(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        asked(call) {
            val granted = client().permissionController.getGrantedPermissions()
            val have = JSArray()
            for ((name, permission) in readPermissions(types.keys.toList())) {
                if (granted.contains(permission)) have.put(name)
            }
            call.resolve(JSObject().put("types", have))
        }
    }

    /** Whether readings older than the thirty days before the first grant can be read (MM-73). */
    @PluginMethod
    fun historyPermitted(call: PluginCall) = asked(call) {
        val granted = client().permissionController.getGrantedPermissions()
        call.resolve(JSObject().put("granted", granted.contains(historyPermission)))
    }

    /**
     * Asks for the history permission the first time only (MM-73). Refused,
     * the app reads the thirty days it is allowed and never asks again; the
     * user can still allow it in Health Connect.
     */
    @PluginMethod
    fun requestHistory(call: PluginCall) {
        val prefs = preferences()
        if (prefs.getBoolean(historyAskedKey, false)) return historyPermitted(call)
        prefs.edit().putBoolean(historyAskedKey, true).apply()
        val contract = PermissionController.createRequestPermissionResultContract()
        startActivityForResult(call, contract.createIntent(context, setOf(historyPermission)), "historyAnswered")
    }

    @ActivityCallback
    fun historyAnswered(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        historyPermitted(call)
    }

    /**
     * The name a person knows the app that wrote a record by ("Google Fit"),
     * or "" when the package is not an app on the phone, as with what the
     * phone records itself; the adapter then never shows the package (MM-395).
     * Health apps are visible to this one through the manifest's query for
     * the permissions-rationale intent they declare.
     */
    private fun appName(packageName: String): String = try {
        val packages = context.packageManager
        packages.getApplicationLabel(packages.getApplicationInfo(packageName, 0)).toString()
    } catch (_: PackageManager.NameNotFoundException) {
        ""
    }

    /** A record as the adapter receives it, its value still in the platform's unit. */
    private fun raw(name: String, record: Record): JSObject {
        val json = JSObject()
            .put("id", record.metadata.id)
            .put("type", name)
            .put("sourceId", record.metadata.dataOrigin.packageName)
            .put("sourceName", appName(record.metadata.dataOrigin.packageName))
        when (record) {
            is WeightRecord -> json.put("value", record.weight.inKilograms).at(record.time)
            is BodyFatRecord -> json.put("value", record.percentage.value).at(record.time)
            is LeanBodyMassRecord -> json.put("value", record.mass.inKilograms).at(record.time)
            is HeightRecord -> json.put("value", record.height.inMeters).at(record.time)
            is ExerciseSessionRecord -> json.span(record.startTime, record.endTime)
            is MenstruationFlowRecord -> json.put("value", record.flow.toDouble()).at(record.time)
            is StepsRecord -> json.put("value", record.count.toDouble()).span(record.startTime, record.endTime)
            is SleepSessionRecord -> json.put("value", minutesAsleep(record)).span(record.startTime, record.endTime)
        }
        return json
    }

    private fun JSObject.at(time: Instant): JSObject = put("startMs", time.toEpochMilli()).put("endMs", time.toEpochMilli())

    private fun JSObject.span(start: Instant, end: Instant): JSObject =
        put("startMs", start.toEpochMilli()).put("endMs", end.toEpochMilli())

    /** Whether this app wrote `record` (MM-70): what the app wrote is never read back as a reading. */
    private fun ours(record: Record): Boolean = record.metadata.dataOrigin.packageName == context.packageName

    private fun nameOf(record: Record): String? =
        types.entries.firstOrNull { it.value.isInstance(record) }?.key

    @PluginMethod
    fun read(call: PluginCall) = asked(call) {
        val name = call.getString("type") ?: return@asked call.reject("read needs a type.")
        val type = types[name] ?: return@asked call.reject("Not a type this app reads: $name.")
        val from = Instant.ofEpochMilli(call.getLong("fromMs") ?: 0L)
        val to = Instant.ofEpochMilli(call.getLong("toMs") ?: 0L)
        val records = JSArray()
        var pageToken: String? = null
        do {
            val response = client().readRecords(
                ReadRecordsRequest(
                    recordType = type,
                    timeRangeFilter = TimeRangeFilter.between(from, to),
                    pageToken = pageToken,
                ),
            )
            for (record in response.records) if (!ours(record)) records.put(raw(name, record))
            pageToken = response.pageToken
        } while (pageToken != null)
        call.resolve(JSObject().put("records", records))
    }

    @PluginMethod
    fun changesToken(call: PluginCall) = asked(call) {
        val name = call.getString("type") ?: return@asked call.reject("changesToken needs a type.")
        val type = types[name] ?: return@asked call.reject("Not a type this app reads: $name.")
        val token = client().getChangesToken(ChangesTokenRequest(recordTypes = setOf(type)))
        call.resolve(JSObject().put("token", token))
    }

    @PluginMethod
    fun changes(call: PluginCall) {
        val token = call.getString("token") ?: return call.reject("changes needs a token.")
        scope.launch {
            try {
                val response = client().getChanges(token)
                val upserted = JSArray()
                val deleted = JSArray()
                for (change in response.changes) {
                    when (change) {
                        is UpsertionChange -> if (!ours(change.record)) {
                            nameOf(change.record)?.let { upserted.put(raw(it, change.record)) }
                        }
                        is DeletionChange -> deleted.put(change.recordId)
                    }
                }
                call.resolve(
                    JSObject()
                        .put("expired", response.changesTokenExpired)
                        .put("nextToken", response.nextChangesToken)
                        .put("hasMore", response.hasMore)
                        .put("upserted", upserted)
                        .put("deletedIds", deleted),
                )
            } catch (error: IllegalArgumentException) {
                // The platform no longer honors the token: everything is to
                // be read again, which is not an error.
                call.resolve(
                    JSObject()
                        .put("expired", true)
                        .put("nextToken", "")
                        .put("hasMore", false)
                        .put("upserted", JSArray())
                        .put("deletedIds", JSArray()),
                )
            } catch (error: Throwable) {
                call.reject(error.message ?: error.toString())
            }
        }
    }

    /** Whether `kind` is on and its write permission is granted, so it may be written now (MM-70). */
    private suspend fun writes(kind: String): Boolean {
        val type = writeTypes[kind] ?: return false
        if (!preferences().getBoolean(writingKey(kind), false)) return false
        return client().permissionController.getGrantedPermissions().contains(HealthPermission.getWritePermission(type))
    }

    /** Of the kinds asked about, those on and permitted now (MM-70). */
    @PluginMethod
    fun writing(call: PluginCall) = asked(call) {
        val granted = client().permissionController.getGrantedPermissions()
        val prefs = preferences()
        val on = JSArray()
        for (kind in typeNames(call, "kinds")) {
            val type = writeTypes[kind] ?: continue
            if (prefs.getBoolean(writingKey(kind), false) && granted.contains(HealthPermission.getWritePermission(type))) on.put(kind)
        }
        call.resolve(JSObject().put("kinds", on))
    }

    /**
     * Turns writing `kind` on (MM-70): its write permission alone is asked
     * for, never with reading. Refused, it stays off.
     */
    @PluginMethod
    fun startWriting(call: PluginCall) {
        val kind = call.getString("kind") ?: return call.reject("startWriting needs a kind.")
        val type = writeTypes[kind] ?: return call.reject("Not a kind this app writes: $kind.")
        val contract = PermissionController.createRequestPermissionResultContract()
        startActivityForResult(call, contract.createIntent(context, setOf(HealthPermission.getWritePermission(type))), "writeAnswered")
    }

    @ActivityCallback
    fun writeAnswered(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val kind = call.getString("kind") ?: return call.reject("startWriting needs a kind.")
        val type = writeTypes[kind] ?: return call.reject("Not a kind this app writes: $kind.")
        asked(call) {
            val granted = client().permissionController.getGrantedPermissions().contains(HealthPermission.getWritePermission(type))
            if (granted) preferences().edit().putBoolean(writingKey(kind), true).apply()
            call.resolve(JSObject().put("on", granted))
        }
    }

    /** Turns writing `kind` off (MM-70): nothing more is written, and nothing written is changed. */
    @PluginMethod
    fun stopWriting(call: PluginCall) {
        val kind = call.getString("kind") ?: return call.reject("stopWriting needs a kind.")
        preferences().edit().putBoolean(writingKey(kind), false).apply()
        call.resolve(JSObject().put("on", false))
    }

    /** Where the plugin keeps the namespace every id the app writes carries (MM-522). */
    private val namespaceKey = "write_namespace"

    private fun newNamespace(): String = java.util.UUID.randomUUID().toString().replace("-", "").take(12)

    /** The write namespace (MM-522), made the first time it is asked for. */
    @PluginMethod
    fun writeNamespace(call: PluginCall) {
        val prefs = preferences()
        val namespace = prefs.getString(namespaceKey, null) ?: newNamespace().also { prefs.edit().putString(namespaceKey, it).commit() }
        call.resolve(JSObject().put("namespace", namespace))
    }

    /** A new write namespace (MM-522), kept before it answers, after the app's data is erased or restored. */
    @PluginMethod
    fun renewWriteNamespace(call: PluginCall) {
        val namespace = newNamespace()
        preferences().edit().putString(namespaceKey, namespace).commit()
        call.resolve(JSObject().put("namespace", namespace))
    }

    private fun offsetAt(time: Instant): ZoneOffset = ZoneId.systemDefault().rules.getOffset(time)

    /** The app's id for a record, with a version that grows, so writing it again replaces what was there. */
    private fun ownedBy(clientId: String): Metadata = Metadata.manualEntry(clientId, System.currentTimeMillis())

    private fun grams(call: PluginCall, key: String): Mass? = call.getDouble(key)?.let { Mass.grams(it) }

    private val mealTypes = mapOf(
        "breakfast" to MealType.MEAL_TYPE_BREAKFAST,
        "lunch" to MealType.MEAL_TYPE_LUNCH,
        "dinner" to MealType.MEAL_TYPE_DINNER,
        "snack" to MealType.MEAL_TYPE_SNACK,
    )

    /** Writes one logged food (MM-70), replacing what was written under its id. A nutrient not given is not written. */
    @PluginMethod
    fun writeNutrition(call: PluginCall) = asked(call) {
        val id = call.getString("id") ?: return@asked call.reject("writeNutrition needs an id.")
        if (!writes("food")) return@asked call.resolve(JSObject().put("written", false))
        val start = Instant.ofEpochMilli(call.getLong("startMs") ?: 0L)
        val end = Instant.ofEpochMilli(call.getLong("endMs") ?: 0L)
        val record = NutritionRecord(
            startTime = start,
            startZoneOffset = offsetAt(start),
            endTime = end,
            endZoneOffset = offsetAt(end),
            metadata = ownedBy(id),
            energy = call.getDouble("kcal")?.let { Energy.kilocalories(it) },
            protein = grams(call, "proteinG"),
            totalCarbohydrate = grams(call, "carbsG"),
            totalFat = grams(call, "fatG"),
            dietaryFiber = grams(call, "fiberG"),
            sugar = grams(call, "sugarsG"),
            saturatedFat = grams(call, "saturatedFatG"),
            sodium = call.getDouble("sodiumMg")?.let { Mass.milligrams(it) },
            name = call.getString("name"),
            mealType = call.getString("meal")?.let { mealTypes[it] } ?: MealType.MEAL_TYPE_UNKNOWN,
        )
        client().insertRecords(listOf(record))
        call.resolve(JSObject().put("written", true))
    }

    /** Removes the app's own record of a food (MM-70); another app's records cannot be reached. */
    @PluginMethod
    fun removeNutrition(call: PluginCall) = removeOwn(call, "food", NutritionRecord::class)

    /** Writes one drink of water (MM-314) as a minute's hydration at the time it was logged. */
    @PluginMethod
    fun writeWater(call: PluginCall) = asked(call) {
        val id = call.getString("id") ?: return@asked call.reject("writeWater needs an id.")
        if (!writes("water")) return@asked call.resolve(JSObject().put("written", false))
        val at = Instant.ofEpochMilli(call.getLong("atMs") ?: 0L)
        // Health Connect keeps hydration over a span, so a drink takes the minute it was logged in.
        val end = at.plusSeconds(60)
        val record = HydrationRecord(
            startTime = at,
            startZoneOffset = offsetAt(at),
            endTime = end,
            endZoneOffset = offsetAt(end),
            volume = Volume.milliliters(call.getDouble("ml") ?: 0.0),
            metadata = ownedBy(id),
        )
        client().insertRecords(listOf(record))
        call.resolve(JSObject().put("written", true))
    }

    @PluginMethod
    fun removeWater(call: PluginCall) = removeOwn(call, "water", HydrationRecord::class)

    private fun removeOwn(call: PluginCall, kind: String, type: KClass<out Record>) = asked(call) {
        val id = call.getString("id") ?: return@asked call.reject("A removal needs an id.")
        if (!writes(kind)) return@asked call.resolve(JSObject().put("removed", false))
        client().deleteRecords(type, emptyList(), listOf(id))
        call.resolve(JSObject().put("removed", true))
    }

    /** A workout as the adapter receives it (MM-489): its type said as strength or not, its segments with their repetitions. */
    private fun rawWorkout(record: ExerciseSessionRecord): JSObject {
        val segments = JSArray()
        for (segment in record.segments) {
            val json = JSObject()
                .put("segmentId", segment.segmentType)
                .put("startMs", segment.startTime.toEpochMilli())
                .put("endMs", segment.endTime.toEpochMilli())
            // Health Connect gives 0 for a segment with no repetitions.
            if (segment.repetitions > 0) json.put("repetitions", segment.repetitions)
            segments.put(json)
        }
        return JSObject()
            .put("id", record.metadata.id)
            .put("clientId", record.metadata.clientRecordId ?: "")
            .put("strength", record.exerciseType in strengthTypes)
            .put("startMs", record.startTime.toEpochMilli())
            .put("endMs", record.endTime.toEpochMilli())
            .put("sourceId", record.metadata.dataOrigin.packageName)
            .put("sourceName", appName(record.metadata.dataOrigin.packageName))
            .put("segments", segments)
    }

    /** Workouts with their segments (MM-489), this app's own among them: the adapter knows them by their client id. */
    @PluginMethod
    fun readWorkouts(call: PluginCall) = asked(call) {
        val from = Instant.ofEpochMilli(call.getLong("fromMs") ?: 0L)
        val to = Instant.ofEpochMilli(call.getLong("toMs") ?: 0L)
        val workouts = JSArray()
        var pageToken: String? = null
        do {
            val response = client().readRecords(
                ReadRecordsRequest(
                    recordType = ExerciseSessionRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(from, to),
                    pageToken = pageToken,
                ),
            )
            for (record in response.records) workouts.put(rawWorkout(record))
            pageToken = response.pageToken
        } while (pageToken != null)
        call.resolve(JSObject().put("workouts", workouts))
    }

    /**
     * Writes a finished workout (MM-489) as strength training under the
     * app's id for it, so writing again replaces it, with its timed sets as
     * segments. Weight is never written (MM-188).
     */
    @PluginMethod
    fun writeWorkout(call: PluginCall) = asked(call) {
        val clientId = call.getString("clientId") ?: return@asked call.reject("writeWorkout needs a clientId.")
        if (!writes("workouts")) return@asked call.resolve(JSObject().put("written", false))
        val start = Instant.ofEpochMilli(call.getLong("startMs") ?: 0L)
        val end = Instant.ofEpochMilli(call.getLong("endMs") ?: 0L)
        val given = call.getArray("segments") ?: JSArray()
        val segments = (0 until given.length()).map { index ->
            val segment = given.getJSONObject(index)
            ExerciseSegment(
                startTime = Instant.ofEpochMilli(segment.getLong("startMs")),
                endTime = Instant.ofEpochMilli(segment.getLong("endMs")),
                segmentType = segment.getInt("segmentId"),
                repetitions = segment.optInt("repetitions", 0),
            )
        }
        val record = ExerciseSessionRecord(
            startTime = start,
            startZoneOffset = offsetAt(start),
            endTime = end,
            endZoneOffset = offsetAt(end),
            metadata = ownedBy(clientId),
            exerciseType = ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING,
            title = null,
            notes = null,
            segments = segments,
        )
        client().insertRecords(listOf(record))
        call.resolve(JSObject().put("written", true))
    }
}
