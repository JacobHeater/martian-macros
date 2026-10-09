import 'package:mm_domain/mm_domain.dart';

/// A barcode a scanner has read: its digits and how it was encoded, so a UPC-E
/// is expanded rather than guessed (MM-54).
final class ScannedBarcode {
  const ScannedBarcode(this.digits, this.symbology);

  final String digits;
  final BarcodeSymbology symbology;
}
