import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

void main() {
  const gtin = '00042100005264';

  test('UPC-A, EAN-13 with a leading zero and UPC-E give one GTIN-14', () {
    expect(normalizeBarcode('042100005264'), gtin);
    expect(normalizeBarcode('0042100005264'), gtin);
    expect(
      normalizeBarcode('04252614', symbology: BarcodeSymbology.upcE),
      gtin,
    );
    expect(normalizeBarcode('0 42100-005264'), gtin, reason: 'non-digits go');
  });

  test('a leading zero lost by the source is restored', () {
    expect(normalizeBarcode('42100005264'), gtin);
  });

  test('a wrong check digit is rejected', () {
    expect(normalizeBarcode('042100005265'), isNull);
    expect(
      normalizeBarcode('04252615', symbology: BarcodeSymbology.upcE),
      isNull,
    );
  });

  test('eight digits are an EAN-8 unless told they are UPC-E', () {
    expect(normalizeBarcode('96385074'), '00000096385074');
    expect(
      normalizeBarcode('96385074', symbology: BarcodeSymbology.upcE),
      isNull,
    );
  });

  test('every UPC-E expansion pattern gives the UPC-A it should', () {
    // [UPC-E six digits, the UPC-A's first eleven digits], one per pattern.
    const cases = [
      ('123450', '01200000345'),
      ('123451', '01210000345'),
      ('123453', '01230000045'),
      ('123454', '01234000005'),
      ('123456', '01234500006'),
    ];
    for (final (body, upcA) in cases) {
      final check = _check(upcA);
      expect(
        normalizeBarcode('0$body$check', symbology: BarcodeSymbology.upcE),
        '00$upcA$check',
        reason: 'UPC-E 0$body',
      );
    }
  });

  test('nonsense is rejected', () {
    expect(normalizeBarcode(''), isNull);
    expect(normalizeBarcode('12345'), isNull);
    expect(normalizeBarcode('123456789012345'), isNull);
  });
}

/// The GS1 check digit for a code without one, written independently of the
/// implementation under test.
String _check(String withoutCheck) {
  var sum = 0;
  final digits = withoutCheck.split('').map(int.parse).toList();
  for (var i = 0; i < digits.length; i++) {
    final fromRight = digits.length - i; // 1 is next to the check digit
    sum += digits[i] * (fromRight.isOdd ? 3 : 1);
  }
  return '${(10 - sum % 10) % 10}';
}
