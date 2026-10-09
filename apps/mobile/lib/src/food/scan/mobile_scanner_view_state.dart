import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../ui/mm_icon_button.dart';
import 'mobile_scanner_view.dart';
import 'scanned_barcode.dart';

class MobileScannerViewState extends State<MobileScannerView> {
  final _controller = MobileScannerController(
    formats: const [
      BarcodeFormat.upcA,
      BarcodeFormat.upcE,
      BarcodeFormat.ean13,
      BarcodeFormat.ean8,
    ],
    detectionSpeed: DetectionSpeed.noDuplicates,
  );
  var _torch = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  static BarcodeSymbology? _symbology(BarcodeFormat format) => switch (format) {
    BarcodeFormat.upcA => BarcodeSymbology.upcA,
    BarcodeFormat.upcE => BarcodeSymbology.upcE,
    BarcodeFormat.ean13 => BarcodeSymbology.ean13,
    BarcodeFormat.ean8 => BarcodeSymbology.ean8,
    _ => null,
  };

  void _detected(BarcodeCapture capture) {
    for (final barcode in capture.barcodes) {
      final digits = barcode.rawValue;
      final symbology = _symbology(barcode.format);
      if (digits != null && symbology != null) {
        widget.onScan(ScannedBarcode(digits, symbology));
        return;
      }
    }
  }

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(12),
    child: SizedBox(
      height: 220,
      child: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _detected,
            errorBuilder: (context, error) => widget.unavailable(context),
          ),
          ValueListenableBuilder<MobileScannerState>(
            valueListenable: _controller,
            builder: (context, state, _) => state.error != null
                ? const SizedBox.shrink()
                : Positioned(
                    right: 4,
                    top: 4,
                    child: MmIconButton(
                      tooltip: _torch
                          ? 'Turn the light off'
                          : 'Turn the light on',
                      icon: _torch ? Icons.flash_on : Icons.flash_off,
                      onPressed: () async {
                        await _controller.toggleTorch();
                        setState(() => _torch = !_torch);
                      },
                    ),
                  ),
          ),
        ],
      ),
    ),
  );
}
