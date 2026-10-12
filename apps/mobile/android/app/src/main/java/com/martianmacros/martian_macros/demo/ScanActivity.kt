package com.martianmacros.martian_macros.demo

import android.content.Intent
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.lifecycle.awaitInstance
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage

/**
 * A full-screen barcode scan (MM-43): the camera's view, ML Kit reading
 * frames on the device, and Cancel. It ends at the first barcode of a kind
 * the app reads: the retail ones, so a UPC-E is told apart from an EAN-8
 * and the digits are never guessed.
 */
class ScanActivity : AppCompatActivity() {

    companion object {
        const val RESULT_FAILED = 9
    }

    private var done = false

    private val scanner = BarcodeScanning.getClient(
        BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_UPC_A,
                Barcode.FORMAT_UPC_E,
                Barcode.FORMAT_EAN_13,
                Barcode.FORMAT_EAN_8,
            )
            .build(),
    )

    private fun symbology(format: Int): String? = when (format) {
        Barcode.FORMAT_UPC_A -> "upcA"
        Barcode.FORMAT_UPC_E -> "upcE"
        Barcode.FORMAT_EAN_13 -> "ean13"
        Barcode.FORMAT_EAN_8 -> "ean8"
        else -> null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val view = PreviewView(this)
        val cancel = Button(this).apply {
            text = "Cancel"
            setOnClickListener { finish() }
        }
        val layout = FrameLayout(this).apply {
            addView(view, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
            addView(
                cancel,
                FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT).apply {
                    gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                    bottomMargin = 120
                },
            )
        }
        setContentView(layout)

        lifecycleScope.launch {
            try {
                val provider = ProcessCameraProvider.awaitInstance(this@ScanActivity)
                val preview = Preview.Builder().build().also { it.surfaceProvider = view.surfaceProvider }
                val analysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                analysis.setAnalyzer(ContextCompat.getMainExecutor(this@ScanActivity)) { frame -> analyze(frame) }
                provider.unbindAll()
                provider.bindToLifecycle(this@ScanActivity, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis)
            } catch (error: Throwable) {
                setResult(RESULT_FAILED, Intent().putExtra("message", error.message ?: "The camera cannot be used."))
                finish()
            }
        }
    }

    @androidx.camera.core.ExperimentalGetImage
    private fun analyze(frame: ImageProxy) {
        val image = frame.image
        if (done || image == null) {
            frame.close()
            return
        }
        scanner.process(InputImage.fromMediaImage(image, frame.imageInfo.rotationDegrees))
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    val digits = barcode.rawValue
                    val kind = symbology(barcode.format)
                    if (!done && digits != null && kind != null) {
                        done = true
                        setResult(RESULT_OK, Intent().putExtra("digits", digits).putExtra("symbology", kind))
                        finish()
                        break
                    }
                }
            }
            .addOnCompleteListener { frame.close() }
    }

    override fun onDestroy() {
        super.onDestroy()
        scanner.close()
    }
}
