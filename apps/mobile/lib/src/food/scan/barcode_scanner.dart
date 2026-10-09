import 'package:flutter/widgets.dart';

import 'scanned_barcode.dart';

/// Something that can show a live camera and report barcodes it reads
/// (MM-43). The app depends on this, not on a camera plugin, so tests use a
/// fake and the plugin can be replaced.
abstract interface class BarcodeScanner {
  /// A view that scans while it is shown. [onScan] is called for each barcode
  /// read; [unavailable] is shown in place of the camera when it cannot be
  /// used (permission refused, no camera).
  Widget view({
    required ValueChanged<ScannedBarcode> onScan,
    required WidgetBuilder unavailable,
  });
}
