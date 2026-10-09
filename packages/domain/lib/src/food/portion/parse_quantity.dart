/// An amount typed by a person: a decimal ("1.5", "0.5") or a simple
/// fraction ("1/2", "1 1/2"). Returns null for anything that is not a number
/// above zero, including empty, zero, negative and non-numeric text.
double? parseQuantity(String text) {
  final t = text.trim().replaceAll(',', '.');
  if (t.isEmpty) return null;
  double? value;
  final mixed = RegExp(r'^(\d+)\s+(\d+)\s*/\s*(\d+)$').firstMatch(t);
  final fraction = RegExp(r'^(\d+)\s*/\s*(\d+)$').firstMatch(t);
  if (mixed != null) {
    final denominator = int.parse(mixed.group(3)!);
    if (denominator == 0) return null;
    value =
        int.parse(mixed.group(1)!) + int.parse(mixed.group(2)!) / denominator;
  } else if (fraction != null) {
    final denominator = int.parse(fraction.group(2)!);
    if (denominator == 0) return null;
    value = int.parse(fraction.group(1)!) / denominator;
  } else if (RegExp(r'^(\d+\.?\d*|\.\d+)$').hasMatch(t)) {
    value = double.tryParse(t);
  }
  if (value == null || !value.isFinite || value <= 0) return null;
  return value;
}
