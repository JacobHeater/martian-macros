import 'package:flutter/material.dart';
import 'package:martian_macros/src/food/scan/barcode_scanner.dart';
import 'package:martian_macros/src/food/scan/scanned_barcode.dart';
import 'package:mm_domain/mm_domain.dart';

/// A scanner for tests: a button "Scan" plus the digits reads that barcode, or, when
/// [cameraAvailable] is false, the unavailable view is shown.
final class FakeBarcodeScanner implements BarcodeScanner {
  const FakeBarcodeScanner(
    this.digits, {
    this.symbology = BarcodeSymbology.ean13,
    this.cameraAvailable = true,
  });

  final String digits;
  final BarcodeSymbology symbology;
  final bool cameraAvailable;

  @override
  Widget view({
    required ValueChanged<ScannedBarcode> onScan,
    required WidgetBuilder unavailable,
  }) => cameraAvailable
      ? Builder(
          builder: (context) => TextButton(
            onPressed: () => onScan(ScannedBarcode(digits, symbology)),
            child: Text('Scan $digits'),
          ),
        )
      : Builder(builder: unavailable);
}
