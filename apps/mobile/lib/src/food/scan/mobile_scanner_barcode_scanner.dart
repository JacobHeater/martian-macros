import 'package:flutter/widgets.dart';

import 'barcode_scanner.dart';
import 'mobile_scanner_view.dart';
import 'scanned_barcode.dart';

/// [BarcodeScanner] over the `mobile_scanner` plugin: ML Kit on Android and
/// Apple Vision on iOS, reading on the device with nothing sent anywhere.
final class MobileScannerBarcodeScanner implements BarcodeScanner {
  const MobileScannerBarcodeScanner();

  @override
  Widget view({
    required ValueChanged<ScannedBarcode> onScan,
    required WidgetBuilder unavailable,
  }) => MobileScannerView(onScan: onScan, unavailable: unavailable);
}
