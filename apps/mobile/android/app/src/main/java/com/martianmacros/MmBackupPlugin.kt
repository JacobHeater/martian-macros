package com.martianmacros

import android.app.Activity
import android.app.KeyguardManager
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.util.Base64
import android.view.WindowManager
import androidx.activity.result.ActivityResult
import androidx.core.content.FileProvider
import androidx.sqlite.driver.bundled.BundledSQLiteDriver
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File
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
 * and writes the clipboard (MM-590), which the WebView cannot read.
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

    override fun load() {
        super.load()
        executor.execute { clearShared() }
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
