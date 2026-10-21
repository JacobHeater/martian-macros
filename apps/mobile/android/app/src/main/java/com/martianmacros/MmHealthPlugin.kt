package com.martianmacros

import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.BodyFatRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeightRecord
import androidx.health.connect.client.records.LeanBodyMassRecord
import androidx.health.connect.client.records.MenstruationFlowRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.changes.DeletionChange
import androidx.health.connect.client.changes.UpsertionChange
import androidx.health.connect.client.request.ChangesTokenRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
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
import kotlin.reflect.KClass

/**
 * Android's Health Connect (MM-68). It only reads, and only what the user
 * grants one by one: nothing read leaves the device, and the app writes
 * nothing to the user's health data. A read the platform refuses is
 * rejected, never answered with nothing.
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

    private fun typeNames(call: PluginCall): List<String> {
        val asked = call.getArray("types") ?: JSArray()
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
            for (record in response.records) records.put(raw(name, record))
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
                        is UpsertionChange -> nameOf(change.record)?.let { upserted.put(raw(it, change.record)) }
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
}
