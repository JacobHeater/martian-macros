package com.martianmacros

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.provider.MediaStore
import androidx.activity.result.ActivityResult
import androidx.core.content.FileProvider
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File

/**
 * The phone's camera (MM-43, MM-44): a barcode read live, another phone's
 * move code read live (MM-698), and a photo of a Nutrition Facts panel read
 * as text with ML Kit. Both are read on the
 * device; the photo is deleted and nothing is uploaded.
 */
@CapacitorPlugin(
    name = "MmScanner",
    permissions = [Permission(strings = [Manifest.permission.CAMERA], alias = "camera")],
)
class MmScannerPlugin : Plugin() {

    @PluginMethod
    fun scan(call: PluginCall) = withCamera(call, "scanAllowed") { startScan(it) }

    @PermissionCallback
    fun scanAllowed(call: PluginCall) = ifGranted(call) { startScan(it) }

    @PluginMethod
    fun scanCode(call: PluginCall) = withCamera(call, "scanCodeAllowed") { startCodeScan(it) }

    @PermissionCallback
    fun scanCodeAllowed(call: PluginCall) = ifGranted(call) { startCodeScan(it) }

    @PluginMethod
    fun readLabel(call: PluginCall) = withCamera(call, "labelAllowed") { startPhoto(it) }

    @PermissionCallback
    fun labelAllowed(call: PluginCall) = ifGranted(call) { startPhoto(it) }

    private fun withCamera(call: PluginCall, callback: String, start: (PluginCall) -> Unit) {
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            start(call)
        } else {
            requestPermissionForAlias("camera", call, callback)
        }
    }

    private fun ifGranted(call: PluginCall, start: (PluginCall) -> Unit) {
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            start(call)
        } else {
            call.reject("Camera permission was refused.")
        }
    }

    private fun startScan(call: PluginCall) {
        startActivityForResult(call, Intent(context, ScanActivity::class.java), "scanned")
    }

    @ActivityCallback
    fun scanned(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val data = result.data
        when {
            result.resultCode == android.app.Activity.RESULT_OK && data != null ->
                call.resolve(
                    JSObject()
                        .put("cancelled", false)
                        .put("digits", data.getStringExtra("digits"))
                        .put("symbology", data.getStringExtra("symbology")),
                )
            result.resultCode == ScanActivity.RESULT_FAILED ->
                call.reject(data?.getStringExtra("message") ?: "The camera cannot be used.")
            else -> call.resolve(JSObject().put("cancelled", true))
        }
    }

    /** The other phone's move code (MM-698): the same full-screen scan, reading QR codes only. */
    private fun startCodeScan(call: PluginCall) {
        startActivityForResult(call, Intent(context, ScanActivity::class.java).putExtra(ScanActivity.EXTRA_QR, true), "codeScanned")
    }

    @ActivityCallback
    fun codeScanned(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val data = result.data
        when {
            result.resultCode == android.app.Activity.RESULT_OK && data != null ->
                call.resolve(JSObject().put("cancelled", false).put("text", data.getStringExtra("digits")))
            result.resultCode == ScanActivity.RESULT_FAILED ->
                call.reject(data?.getStringExtra("message") ?: "The camera cannot be used.")
            else -> call.resolve(JSObject().put("cancelled", true))
        }
    }

    private fun photoFile() = File(context.cacheDir, "label.jpg")

    private fun startPhoto(call: PluginCall) {
        val uri: Uri = FileProvider.getUriForFile(context, context.packageName + ".fileprovider", photoFile())
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).putExtra(MediaStore.EXTRA_OUTPUT, uri)
        startActivityForResult(call, intent, "photographed")
    }

    @ActivityCallback
    fun photographed(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val file = photoFile()
        if (result.resultCode != android.app.Activity.RESULT_OK || !file.exists()) {
            file.delete()
            return call.resolve(JSObject().put("cancelled", true))
        }
        try {
            val image = InputImage.fromFilePath(context, Uri.fromFile(file))
            TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
                .process(image)
                .addOnSuccessListener { text ->
                    file.delete()
                    call.resolve(JSObject().put("cancelled", false).put("text", text.text))
                }
                .addOnFailureListener { error ->
                    file.delete()
                    call.reject(error.message ?: error.toString())
                }
        } catch (error: Throwable) {
            file.delete()
            call.reject(error.message ?: error.toString())
        }
    }
}
