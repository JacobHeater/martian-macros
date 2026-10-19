import AVFoundation
import Capacitor
import UIKit
import Vision

/**
 * The phone's camera (MM-43, MM-44, MM-406): a barcode read live with
 * AVFoundation, and a photo of a Nutrition Facts panel read as text with
 * Vision. Both are read on the device; the photo stays in memory and
 * nothing is uploaded. A camera that cannot be used (the simulator has
 * none) is reported, never hidden.
 */
@objc(MmScannerPlugin)
public class MmScannerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MmScannerPlugin"
    public let jsName = "MmScanner"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "scan", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readLabel", returnType: CAPPluginReturnPromise),
    ]

    private static let unusable = "The camera cannot be used."

    /// The picker shown for a label, held until it answers.
    private var picker: LabelPicker?

    @objc func scan(_ call: CAPPluginCall) {
        withCamera(call) { self.startScan(call) }
    }

    @objc func readLabel(_ call: CAPPluginCall) {
        withCamera(call) { self.startPhoto(call) }
    }

    private func withCamera(_ call: CAPPluginCall, _ start: @escaping () -> Void) {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            start()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                if granted { start() } else { call.reject("Camera permission was refused.") }
            }
        default:
            call.reject("Camera permission was refused.")
        }
    }

    private func startScan(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard AVCaptureDevice.default(for: .video) != nil, let presenter = self.bridge?.viewController else {
                return call.reject(Self.unusable)
            }
            let scan = ScanViewController { outcome in
                switch outcome {
                case .read(let digits, let symbology):
                    call.resolve(["cancelled": false, "digits": digits, "symbology": symbology])
                case .cancelled:
                    call.resolve(["cancelled": true])
                case .failed(let message):
                    call.reject(message)
                }
            }
            scan.modalPresentationStyle = .fullScreen
            presenter.present(scan, animated: true)
        }
    }

    private func startPhoto(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard UIImagePickerController.isSourceTypeAvailable(.camera), let presenter = self.bridge?.viewController else {
                return call.reject(Self.unusable)
            }
            let picker = LabelPicker { [weak self] image in
                self?.picker = nil
                guard let image = image else { return call.resolve(["cancelled": true]) }
                Self.readText(of: image) { result in
                    switch result {
                    case .success(let text):
                        call.resolve(["cancelled": false, "text": text])
                    case .failure(let error):
                        call.reject(mmMessage(error))
                    }
                }
            }
            self.picker = picker
            presenter.present(picker.controller, animated: true)
        }
    }

    /// The text on `image`, read on the device, one line per line found.
    private static func readText(of image: UIImage, _ done: @escaping (Result<String, Error>) -> Void) {
        guard let cgImage = image.cgImage else { return done(.failure(MmFailure("The photo could not be read."))) }
        let request = VNRecognizeTextRequest { request, error in
            if let error = error { return done(.failure(error)) }
            let lines = (request.results as? [VNRecognizedTextObservation] ?? []).compactMap { $0.topCandidates(1).first?.string }
            done(.success(lines.joined(separator: "\n")))
        }
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = false
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try VNImageRequestHandler(cgImage: cgImage, orientation: orientation(of: image.imageOrientation)).perform([request])
            } catch {
                done(.failure(error))
            }
        }
    }

    private static func orientation(of orientation: UIImage.Orientation) -> CGImagePropertyOrientation {
        switch orientation {
        case .up: return .up
        case .down: return .down
        case .left: return .left
        case .right: return .right
        case .upMirrored: return .upMirrored
        case .downMirrored: return .downMirrored
        case .leftMirrored: return .leftMirrored
        case .rightMirrored: return .rightMirrored
        @unknown default: return .up
        }
    }
}

/// The camera app for one photo of a label, and what came of it: the image, or nothing when cancelled.
private final class LabelPicker: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    let controller = UIImagePickerController()
    private let done: (UIImage?) -> Void

    init(done: @escaping (UIImage?) -> Void) {
        self.done = done
        super.init()
        controller.sourceType = .camera
        controller.cameraCaptureMode = .photo
        controller.delegate = self
    }

    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        let image = info[.originalImage] as? UIImage
        picker.dismiss(animated: true) { self.done(image) }
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true) { self.done(nil) }
    }
}
