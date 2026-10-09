import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'barcode_scanner.dart';
import 'mobile_scanner_barcode_scanner.dart';

/// The camera scanner. Tests replace it with a fake.
final barcodeScannerProvider = Provider<BarcodeScanner>(
  (ref) => const MobileScannerBarcodeScanner(),
);
