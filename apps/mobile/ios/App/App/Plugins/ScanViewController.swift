import AVFoundation
import UIKit

/**
 * A full-screen barcode scan (MM-43, MM-406): the camera's view, the
 * barcodes read on the device as frames come, and Cancel. It ends at the
 * first barcode of a kind the app reads: the retail ones, so a UPC-E is
 * told apart from an EAN-8 and the digits are never guessed. iOS reports a
 * UPC-A as an EAN-13 beginning with 0, which the app's lookup takes as the
 * same code.
 */
final class ScanViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    enum Outcome {
        case read(digits: String, symbology: String)
        case cancelled
        case failed(String)
    }

    private let done: (Outcome) -> Void
    /// Reading a move code's QR code (MM-695), not a product's barcode: the two never mix.
    private let readsQr: Bool
    private let session = AVCaptureSession()
    private var preview: AVCaptureVideoPreviewLayer?
    private var finished = false
    /// Set when the camera could not be started; told once the scan is on screen, since a view
    /// controller still being presented cannot be dismissed, and the app would never hear back.
    private var unusable = false

    init(readsQr: Bool = false, done: @escaping (Outcome) -> Void) {
        self.readsQr = readsQr
        self.done = done
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("A scan is not loaded from a storyboard.") }

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .portrait }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device),
              session.canAddInput(input)
        else { unusable = true; return }
        session.addInput(input)
        let output = AVCaptureMetadataOutput()
        guard session.canAddOutput(output) else { unusable = true; return }
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: .main)
        let wanted: [AVMetadataObject.ObjectType] = readsQr ? [.qr] : [.ean13, .ean8, .upce]
        output.metadataObjectTypes = wanted.filter { output.availableMetadataObjectTypes.contains($0) }

        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.videoGravity = .resizeAspectFill
        preview.frame = view.bounds
        view.layer.addSublayer(preview)
        self.preview = preview

        let cancel = UIButton(type: .system)
        cancel.setTitle("Cancel", for: .normal)
        cancel.setTitleColor(.black, for: .normal)
        cancel.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        cancel.backgroundColor = UIColor.white.withAlphaComponent(0.9)
        cancel.layer.cornerRadius = 24
        cancel.contentEdgeInsets = UIEdgeInsets(top: 12, left: 28, bottom: 12, right: 28)
        cancel.translatesAutoresizingMaskIntoConstraints = false
        cancel.addTarget(self, action: #selector(cancelPressed), for: .touchUpInside)
        view.addSubview(cancel)
        NSLayoutConstraint.activate([
            cancel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            cancel.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -32),
            cancel.heightAnchor.constraint(greaterThanOrEqualToConstant: 48),
        ])

        DispatchQueue.global(qos: .userInitiated).async { self.session.startRunning() }
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        if unusable { finish(.failed("The camera cannot be used.")) }
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        preview?.frame = view.bounds
    }

    @objc private func cancelPressed() { finish(.cancelled) }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard !finished else { return }
        for object in metadataObjects {
            guard let code = object as? AVMetadataMachineReadableCodeObject,
                  let digits = code.stringValue,
                  let symbology = readsQr ? (code.type == .qr ? "qr" : nil) : Self.symbology(code.type)
            else { continue }
            finish(.read(digits: digits, symbology: symbology))
            return
        }
    }

    private static func symbology(_ type: AVMetadataObject.ObjectType) -> String? {
        switch type {
        case .ean13: return "ean13"
        case .ean8: return "ean8"
        case .upce: return "upcE"
        default: return nil
        }
    }

    private func finish(_ outcome: Outcome) {
        guard !finished else { return }
        finished = true
        if session.isRunning { DispatchQueue.global(qos: .userInitiated).async { self.session.stopRunning() } }
        if presentingViewController == nil {
            done(outcome)
        } else {
            dismiss(animated: true) { self.done(outcome) }
        }
    }
}
