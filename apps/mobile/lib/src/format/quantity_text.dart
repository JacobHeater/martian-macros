/// An amount as it is typed back and shown: "2", "1.5", "0.33".
String quantityText(double value) {
  if (value == value.roundToDouble()) return value.round().toString();
  final fixed = value.toStringAsFixed(2);
  return fixed
      .replaceFirst(RegExp(r'0+$'), '')
      .replaceFirst(RegExp(r'\.$'), '');
}
