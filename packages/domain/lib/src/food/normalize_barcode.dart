import 'barcode_symbology.dart';

const _gtinLength = 14;

/// The 14-digit GTIN for [raw], or null when it cannot be one (MM-54).
///
/// Anything that is not a digit is dropped. Give [symbology] when the scanner
/// knows it: a UPC-E is expanded to its UPC-A first. Without it, eight digits
/// are read as an EAN-8 and never as a UPC-E, and shorter or longer codes are
/// padded on the left, which restores a zero that a source lost when it stored
/// the code as a number. The check digit must verify.
String? normalizeBarcode(String raw, {BarcodeSymbology? symbology}) {
  var digits = raw.replaceAll(RegExp(r'\D'), '');
  if (symbology == BarcodeSymbology.upcE) {
    final expanded = _expandUpcE(digits);
    if (expanded == null) return null;
    digits = expanded;
  } else if (digits.length < 8 || digits.length > _gtinLength) {
    return null;
  }
  final padded = digits.padLeft(_gtinLength, '0');
  return _checkDigitHolds(padded) ? padded : null;
}

bool _checkDigitHolds(String gtin14) {
  var sum = 0;
  for (var i = 0; i < gtin14.length - 1; i++) {
    final digit = gtin14.codeUnitAt(i) - 0x30;
    sum += i.isEven ? digit * 3 : digit;
  }
  return (10 - sum % 10) % 10 == gtin14.codeUnitAt(gtin14.length - 1) - 0x30;
}

/// UPC-E (number system, six digits, check digit) to its 12-digit UPC-A.
String? _expandUpcE(String digits) {
  if (digits.length != 8) return null;
  final system = digits[0];
  if (system != '0' && system != '1') return null;
  final d = digits.substring(1, 7).split('');
  final check = digits[7];
  final body = switch (d[5]) {
    '0' || '1' || '2' =>
      '${d[0]}${d[1]}${d[5]}00'
          '00${d[2]}${d[3]}${d[4]}',
    '3' =>
      '${d[0]}${d[1]}${d[2]}00'
          '000${d[3]}${d[4]}',
    '4' =>
      '${d[0]}${d[1]}${d[2]}${d[3]}0'
          '0000${d[4]}',
    _ =>
      '${d[0]}${d[1]}${d[2]}${d[3]}${d[4]}'
          '0000${d[5]}',
  };
  return '$system$body$check';
}
