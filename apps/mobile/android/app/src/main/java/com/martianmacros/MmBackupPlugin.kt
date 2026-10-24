package com.martianmacros

import android.app.Activity
import android.app.KeyguardManager
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.os.Build
import android.net.Uri
import android.util.Base64
import android.view.WindowManager
import androidx.activity.result.ActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.sqlite.driver.bundled.BundledSQLiteDriver
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.ByteArrayOutputStream
import java.io.File
import kotlin.math.roundToInt
import kotlin.math.sqrt
import java.util.UUID
import java.util.concurrent.Executors

/**
 * The phone's part of a backup (MM-63): a consistent copy of the database
 * (`VACUUM INTO`), a temporary file for a copy brought back, the send
 * chooser for a file, and the document picker to choose one. Bytes cross
 * the bridge as base64; the app encrypts before anything leaves. It also
 * hands an https address to the phone's browser (MM-454): the browser
 * fetches the page, the app nothing. It keeps the progress photos private
 * (MM-157): the phone's own lock is asked before they show, and the window
 * is kept out of the app switcher and screenshots while they do. It reads
 * and writes the clipboard (MM-590), which the WebView cannot read. It
 * picks a meal's photos and shares them with the prompt for the person's own
 * assistant (MM-599), keeping none of them.
 */
@CapacitorPlugin(name = "MmBackup")
class MmBackupPlugin : Plugin() {
    private val driver = BundledSQLiteDriver()
    private val executor = Executors.newSingleThreadExecutor()

    private fun tempFile(name: String): File = File(context.cacheDir, "mm-backup-${UUID.randomUUID()}-$name")

    /**
     * Where the encrypted copy handed to the send chooser is kept. The other
     * app may still be reading it when the chooser returns, so it is deleted
     * the next time the app starts, or before the next one is shared (MM-63).
     */
    private fun sharedDir(): File = File(context.cacheDir, "mm-backup-shared")

    private fun clearShared() {
        sharedDir().deleteRecursively()
    }

    /**
     * Where a meal's photos are written to be handed to the person's assistant
     * (MM-599). The other app may still be reading them when the chooser
     * returns, so they are deleted when the app asks (the sheet that holds
     * them closes), before the next meal is shared, and when the app starts.
     */
    private fun mealDir(): File = File(context.cacheDir, "mm-meal-shared")

    override fun load() {
        super.load()
        executor.execute {
            clearShared()
            mealDir().deleteRecursively()
        }
    }

    @PluginMethod
    fun snapshot(call: PluginCall) {
        val name = call.getString("name") ?: return call.reject("snapshot needs the database's name.")
        executor.execute {
            val copy = tempFile("snapshot.sqlite")
            try {
                val connection = driver.open(context.getDatabasePath(name).path, 0x1)
                try {
                    val escaped = copy.path.replace("'", "''")
                    connection.prepare("VACUUM INTO '$escaped'").use { it.step() }
                } finally {
                    connection.close()
                }
                call.resolve(JSObject().put("data", Base64.encodeToString(copy.readBytes(), Base64.NO_WRAP)))
            } catch (error: Throwable) {
                call.reject(error.message ?: error.toString())
            } finally {
                copy.delete()
            }
        }
    }

    @PluginMethod
    fun writeTemp(call: PluginCall) {
        try {
            val file = tempFile(call.getString("name") ?: "file")
            file.writeBytes(Base64.decode(call.getString("data") ?: "", Base64.DEFAULT))
            call.resolve(JSObject().put("path", file.path))
        } catch (error: Throwable) {
            call.reject(error.message ?: error.toString())
        }
    }

    @PluginMethod
    fun removeTemp(call: PluginCall) {
        val path = call.getString("path")
        if (path != null && path.startsWith(context.cacheDir.path)) File(path).delete()
        call.resolve()
    }

    @PluginMethod
    fun share(call: PluginCall) {
        val name = call.getString("name") ?: return call.reject("share needs a name.")
        try {
            clearShared()
            val dir = sharedDir()
            dir.mkdirs()
            val file = File(dir, File(name).name)
            file.writeBytes(Base64.decode(call.getString("data") ?: "", Base64.DEFAULT))
            val uri: Uri = FileProvider.getUriForFile(context, context.packageName + ".fileprovider", file)
            val send = Intent(Intent.ACTION_SEND)
                .setType("application/octet-stream")
                .putExtra(Intent.EXTRA_STREAM, uri)
                .putExtra(Intent.EXTRA_SUBJECT, name)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            startActivityForResult(call, Intent.createChooser(send, "Save or send the backup"), "shared")
        } catch (error: Throwable) {
            call.reject(error.message ?: error.toString())
        }
    }

    @ActivityCallback
    fun shared(call: PluginCall?, result: ActivityResult) {
        // The chooser gives no word on whether the other app kept the file; it was handed on unless cancelled.
        call?.resolve(JSObject().put("outcome", if (result.resultCode == Activity.RESULT_CANCELED) "sent" else "sent"))
    }

    @PluginMethod
    fun openInBrowser(call: PluginCall) {
        val address = call.getString("url") ?: return call.reject("openInBrowser needs an address.")
        val uri = Uri.parse(address)
        if (uri.scheme != "https" || uri.host.isNullOrEmpty()) return call.reject("Only an https address is opened.")
        try {
            activity.startActivity(Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE))
            call.resolve()
        } catch (error: ActivityNotFoundException) {
            call.reject("No browser is installed.")
        }
    }

    /** The clipboard's text (MM-590), read on the main thread while the app has focus, as Android 10 requires. */
    @PluginMethod
    fun readClipboard(call: PluginCall) {
        activity.runOnUiThread {
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = clipboard.primaryClip
            val text = if (clip == null || clip.itemCount == 0) null else clip.getItemAt(0).coerceToText(context)?.toString()
            call.resolve(if (text == null) JSObject() else JSObject().put("text", text))
        }
    }

    @PluginMethod
    fun writeClipboard(call: PluginCall) {
        val text = call.getString("text") ?: return call.reject("writeClipboard needs the text.")
        activity.runOnUiThread {
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboard.setPrimaryClip(ClipData.newPlainText("Martian Macros", text))
            call.resolve()
        }
    }

    @PluginMethod
    fun pick(call: PluginCall) {
        val open = Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE)
        startActivityForResult(call, open, "picked")
    }

    @ActivityCallback
    fun picked(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val uri = result.data?.data
        if (result.resultCode != Activity.RESULT_OK || uri == null) return call.resolve(JSObject().put("cancelled", true))
        try {
            val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: throw IllegalStateException("The file could not be read.")
            call.resolve(JSObject().put("cancelled", false).put("data", Base64.encodeToString(bytes, Base64.NO_WRAP)))
        } catch (error: Throwable) {
            call.reject(error.message ?: error.toString())
        }
    }

    /** The phone's photo picker (MM-599), which needs no permission: the person chooses each photo. */
    @PluginMethod
    fun pickPhotos(call: PluginCall) {
        val max = (call.getInt("max") ?: 1).coerceAtLeast(1)
        val images = PickVisualMediaRequest.Builder().setMediaType(ActivityResultContracts.PickVisualMedia.ImageOnly).build()
        val pick =
            if (max == 1) ActivityResultContracts.PickVisualMedia().createIntent(context, images)
            else ActivityResultContracts.PickMultipleVisualMedia(max).createIntent(context, images)
        startActivityForResult(call, pick, "pickedPhotos")
    }

    @ActivityCallback
    fun pickedPhotos(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val data = result.data
        val uris = mutableListOf<Uri>()
        if (result.resultCode == Activity.RESULT_OK && data != null) {
            val clip = data.clipData
            if (clip != null) for (at in 0 until clip.itemCount) uris.add(clip.getItemAt(at).uri)
            else data.data?.let { uris.add(it) }
        }
        val max = (call.getInt("max") ?: 1).coerceAtLeast(1)
        executor.execute {
            val photos = JSArray()
            for (uri in uris.take(max)) {
                try {
                    val bitmap = reduced(uri) ?: continue
                    val jpeg = ByteArrayOutputStream().use { out ->
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 85, out)
                        out.toByteArray()
                    }
                    photos.put(
                        JSObject()
                            .put("data", Base64.encodeToString(jpeg, Base64.NO_WRAP))
                            .put("width", bitmap.width)
                            .put("height", bitmap.height),
                    )
                    bitmap.recycle()
                } catch (error: Throwable) {
                    // A photo that cannot be read is left out; the rest are still offered.
                }
            }
            call.resolve(JSObject().put("photos", photos))
        }
    }

    /** The photo at `uri` at about 2 megapixels at most, upright where the phone can say which way is up. */
    private fun reduced(uri: Uri): Bitmap? {
        val limit = 2_000_000.0
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val source = ImageDecoder.createSource(context.contentResolver, uri)
            return ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
                val pixels = info.size.width.toDouble() * info.size.height
                val factor = if (pixels > limit) sqrt(limit / pixels) else 1.0
                decoder.setTargetSize((info.size.width * factor).roundToInt().coerceAtLeast(1), (info.size.height * factor).roundToInt().coerceAtLeast(1))
                decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
            }
        }
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (bounds.outWidth.toDouble() / sample * (bounds.outHeight.toDouble() / sample) > limit * 4) sample *= 2
        val decoded = context.contentResolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
        } ?: return null
        val pixels = decoded.width.toDouble() * decoded.height
        if (pixels <= limit) return decoded
        val factor = sqrt(limit / pixels)
        val scaled = Bitmap.createScaledBitmap(decoded, (decoded.width * factor).roundToInt(), (decoded.height * factor).roundToInt(), true)
        if (scaled != decoded) decoded.recycle()
        return scaled
    }

    /**
     * The send chooser with the prompt and a meal's photos together (MM-599).
     * The photos are written to the cache only to be handed on; see `mealDir`.
     */
    @PluginMethod
    fun shareMeal(call: PluginCall) {
        val text = call.getString("text") ?: ""
        val photos = call.getArray("photos")?.toList<String>() ?: emptyList()
        try {
            val dir = mealDir()
            dir.deleteRecursively()
            dir.mkdirs()
            val uris = ArrayList<Uri>()
            photos.forEachIndexed { at, data ->
                val file = File(dir, "meal-${at + 1}.jpg")
                file.writeBytes(Base64.decode(data, Base64.DEFAULT))
                uris.add(FileProvider.getUriForFile(context, context.packageName + ".fileprovider", file))
            }
            val send =
                when (uris.size) {
                    0 -> Intent(Intent.ACTION_SEND).setType("text/plain")
                    1 -> Intent(Intent.ACTION_SEND).setType("image/jpeg").putExtra(Intent.EXTRA_STREAM, uris[0])
                    else -> Intent(Intent.ACTION_SEND_MULTIPLE).setType("image/jpeg").putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris)
                }
            send.putExtra(Intent.EXTRA_TEXT, text).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            if (uris.isNotEmpty()) {
                // The receiving app is granted the photos through the clip, as Android 10 and later expect.
                val clip = ClipData.newRawUri("meal-1.jpg", uris[0])
                uris.drop(1).forEach { clip.addItem(ClipData.Item(it)) }
                send.clipData = clip
            }
            startActivityForResult(call, Intent.createChooser(send, "Send to your assistant"), "mealShared")
        } catch (error: Throwable) {
            mealDir().deleteRecursively()
            call.reject(error.message ?: error.toString())
        }
    }

    @ActivityCallback
    fun mealShared(call: PluginCall?, result: ActivityResult) {
        // The chooser gives no word on whether the other app took the photos; they were handed on unless cancelled.
        call?.resolve(JSObject().put("outcome", "sent"))
    }

    @PluginMethod
    fun clearMealShare(call: PluginCall) {
        executor.execute {
            mealDir().deleteRecursively()
            call.resolve()
        }
    }

    @PluginMethod
    fun protectScreen(call: PluginCall) {
        val on = call.getBoolean("on") ?: false
        activity.runOnUiThread {
            if (on) {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
            } else {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
            }
            call.resolve()
        }
    }

    @PluginMethod
    fun unlock(call: PluginCall) {
        val keyguard = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        if (!keyguard.isDeviceSecure) return call.resolve(JSObject().put("outcome", "noLock"))
        // The phone's own confirmation: fingerprint, face, PIN, pattern or password, whichever the phone is locked with.
        @Suppress("DEPRECATION")
        val confirm = keyguard.createConfirmDeviceCredentialIntent("Progress photos", call.getString("reason") ?: "")
            ?: return call.resolve(JSObject().put("outcome", "noLock"))
        startActivityForResult(call, confirm, "unlocked")
    }

    @ActivityCallback
    fun unlocked(call: PluginCall?, result: ActivityResult) {
        call?.resolve(JSObject().put("outcome", if (result.resultCode == Activity.RESULT_OK) "unlocked" else "refused"))
    }
}
