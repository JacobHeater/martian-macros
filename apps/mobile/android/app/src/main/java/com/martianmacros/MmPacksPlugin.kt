package com.martianmacros

import android.util.Base64
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger
import java.util.zip.GZIPInputStream
import kotlin.concurrent.thread

/**
 * Food-pack files on the phone's own storage (MM-56), kept apart from the
 * user's database, and the one HTTP fetch this app ever makes: a pack, or
 * the list of packs on offer. The fetch sends no cookies, no identifiers
 * and no body; the host learns an IP address and which file was asked for.
 *
 * The files and their names mirror the Flutter app's store: `id.pack` and
 * `id.json` installed, `id.version.part` while downloading, `id.new` while
 * being checked, `id.pack.old` while being replaced.
 */
@CapacitorPlugin(name = "MmPacks")
class MmPacksPlugin : Plugin() {

    private val writers = ConcurrentHashMap<Int, FileOutputStream>()
    private val requests = ConcurrentHashMap<Int, HttpURLConnection>()
    private val nextId = AtomicInteger(1)

    private val root get() = File(context.filesDir, "food_packs")

    private fun installedFile(id: String) = File(root, "$id.pack")
    private fun metaFile(id: String) = File(root, "$id.json")
    private fun partialFile(id: String, version: String) = File(root, "$id.$version.part")
    private fun stagingFile(id: String) = File(root, "$id.new")

    /** An id or version as a piece of a file name: nothing that walks the tree. */
    private fun fileId(call: PluginCall, key: String): String? {
        val value = call.getString(key)
        val usable = value != null && value.isNotEmpty() && !value.contains("..") &&
            value.all { it.isLetterOrDigit() || it == '-' || it == '_' || it == '.' }
        if (!usable) {
            call.reject("Not a usable $key.")
            return null
        }
        return value
    }

    private fun answered(call: PluginCall, step: () -> Unit) {
        try {
            step()
        } catch (error: Throwable) {
            call.reject(error.message ?: error.toString())
        }
    }

    @PluginMethod
    fun installed(call: PluginCall) = answered(call) {
        val packs = JSArray()
        for (file in (root.listFiles() ?: arrayOf()).sortedBy { it.name }) {
            if (!file.name.endsWith(".pack")) continue
            val id = file.name.removeSuffix(".pack")
            val meta = metaFile(id)
            if (!meta.exists()) continue
            try {
                val json = JSONObject(meta.readText())
                val pack = JSObject()
                    .put("id", id)
                    .put("version", json.getString("version"))
                    .put("bytes", file.length())
                    .put("path", file.path)
                if (json.has("title")) pack.put("title", json.getString("title"))
                packs.put(pack)
            } catch (_: Throwable) {
                // A pack whose record cannot be read is not offered.
            }
        }
        call.resolve(JSObject().put("packs", packs))
    }

    @PluginMethod
    fun partialBytes(call: PluginCall) {
        val id = fileId(call, "id") ?: return
        val version = fileId(call, "version") ?: return
        val file = partialFile(id, version)
        call.resolve(JSObject().put("bytes", if (file.exists()) file.length() else 0L))
    }

    @PluginMethod
    fun writePartial(call: PluginCall) {
        val id = fileId(call, "id") ?: return
        val version = fileId(call, "version") ?: return
        val append = call.getBoolean("append") ?: false
        answered(call) {
            root.mkdirs()
            val writer = nextId.getAndIncrement()
            writers[writer] = FileOutputStream(partialFile(id, version), append)
            call.resolve(JSObject().put("writer", writer))
        }
    }

    @PluginMethod
    fun write(call: PluginCall) {
        val writer = writers[call.getInt("writer") ?: -1] ?: return call.reject("The writer is closed.")
        answered(call) {
            writer.write(Base64.decode(call.getString("data") ?: "", Base64.DEFAULT))
            call.resolve()
        }
    }

    @PluginMethod
    fun closeWriter(call: PluginCall) {
        val handle = call.getInt("writer") ?: -1
        val writer = writers.remove(handle) ?: return call.resolve()
        answered(call) {
            writer.close()
            call.resolve()
        }
    }

    @PluginMethod
    fun partialSha256(call: PluginCall) {
        val id = fileId(call, "id") ?: return
        val version = fileId(call, "version") ?: return
        answered(call) {
            val digest = MessageDigest.getInstance("SHA-256")
            val file = partialFile(id, version)
            if (file.exists()) {
                file.inputStream().use { stream ->
                    val buffer = ByteArray(256 * 1024)
                    while (true) {
                        val read = stream.read(buffer)
                        if (read < 0) break
                        digest.update(buffer, 0, read)
                    }
                }
            }
            val hex = digest.digest().joinToString("") { "%02x".format(it) }
            call.resolve(JSObject().put("sha256", hex))
        }
    }

    @PluginMethod
    fun discardPartial(call: PluginCall) {
        val id = fileId(call, "id") ?: return
        val version = fileId(call, "version") ?: return
        answered(call) {
            partialFile(id, version).delete()
            call.resolve()
        }
    }

    @PluginMethod
    fun stage(call: PluginCall) {
        val id = fileId(call, "id") ?: return
        val version = fileId(call, "version") ?: return
        val gzip = call.getBoolean("gzip") ?: false
        answered(call) {
            val partial = partialFile(id, version)
            val staged = stagingFile(id)
            if (staged.exists()) staged.delete()
            val input: InputStream = if (gzip) GZIPInputStream(partial.inputStream()) else partial.inputStream()
            input.use { from -> staged.outputStream().use { into -> from.copyTo(into) } }
            call.resolve(JSObject().put("path", staged.path))
        }
    }

    @PluginMethod
    fun discardStaged(call: PluginCall) {
        val id = fileId(call, "id") ?: return
        answered(call) {
            stagingFile(id).delete()
            call.resolve()
        }
    }

    @PluginMethod
    fun commit(call: PluginCall) {
        val id = fileId(call, "id") ?: return
        val version = fileId(call, "version") ?: return
        val title = call.getString("title")
        answered(call) {
            root.mkdirs()
            val staged = stagingFile(id)
            val target = installedFile(id)
            val backup = File(target.path + ".old")
            if (backup.exists()) backup.delete()
            if (target.exists() && !target.renameTo(backup)) {
                throw IllegalStateException("Could not set the installed pack aside.")
            }
            try {
                if (!staged.renameTo(target)) throw IllegalStateException("Could not put the new pack in place.")
                val meta = JSONObject().put("version", version)
                if (title != null) meta.put("title", title)
                metaFile(id).writeText(meta.toString())
            } catch (error: Throwable) {
                // The earlier pack is kept working when the swap fails.
                if (backup.exists()) {
                    if (target.exists()) target.delete()
                    backup.renameTo(target)
                }
                throw error
            }
            if (backup.exists()) backup.delete()
            call.resolve()
        }
    }

    @PluginMethod
    fun remove(call: PluginCall) {
        val id = fileId(call, "id") ?: return
        answered(call) {
            for (file in root.listFiles() ?: arrayOf()) {
                val name = file.name
                if (name == "$id.pack" || name == "$id.json" || name == "$id.new" || name == "$id.pack.old" ||
                    (name.startsWith("$id.") && name.endsWith(".part"))
                ) {
                    file.delete()
                }
            }
            call.resolve()
        }
    }

    @PluginMethod
    fun httpGet(call: PluginCall) {
        val url = call.getString("url") ?: return call.reject("httpGet needs a url.")
        val rangeStart = call.getInt("rangeStart")
        val request = nextId.getAndIncrement()
        thread(name = "mm-pack-http-$request") {
            var connection: HttpURLConnection? = null
            var resolved = false
            try {
                connection = URL(url).openConnection() as HttpURLConnection
                connection.instanceFollowRedirects = true
                connection.connectTimeout = 20_000
                connection.readTimeout = 30_000
                if (rangeStart != null) connection.setRequestProperty("Range", "bytes=$rangeStart-")
                val status = connection.responseCode
                requests[request] = connection
                call.resolve(JSObject().put("request", request).put("status", status))
                resolved = true
                val body: InputStream =
                    if (status >= 400) connection.errorStream ?: ByteArray(0).inputStream()
                    else connection.inputStream
                body.use { stream ->
                    val buffer = ByteArray(256 * 1024)
                    while (true) {
                        val read = stream.read(buffer)
                        if (read < 0) break
                        if (read > 0) {
                            notifyListeners(
                                "packHttpChunk",
                                JSObject()
                                    .put("request", request)
                                    .put("data", Base64.encodeToString(buffer, 0, read, Base64.NO_WRAP)),
                            )
                        }
                    }
                }
                notifyListeners("packHttpChunk", JSObject().put("request", request).put("done", true))
            } catch (error: Throwable) {
                if (resolved) {
                    notifyListeners(
                        "packHttpChunk",
                        JSObject().put("request", request).put("error", error.message ?: error.toString()),
                    )
                } else {
                    call.reject(error.message ?: error.toString())
                }
            } finally {
                requests.remove(request)
                connection?.disconnect()
            }
        }
    }

    @PluginMethod
    fun httpAbort(call: PluginCall) {
        requests.remove(call.getInt("request") ?: -1)?.disconnect()
        call.resolve()
    }
}
