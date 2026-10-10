import 'label_reading.dart';

/// Reads the US Nutrition Facts layout from recognised [text] (MM-44): serving
/// size, calories, total fat, total carbohydrate, protein, and where present
/// fiber and sodium.
///
/// It is deliberately plain. It finds each label's first number after the
/// label, tolerating the line breaks a text recogniser inserts and the
/// look-alike characters it confuses with digits. It cannot read a panel
/// whose labels and values are in separate columns, and it never fills a
/// field it did not find. The caller reviews everything it returns.
LabelReading parseNutritionLabel(String text) {
  final t = _clean(text);
  return LabelReading(
    servingText: _servingText(t),
    servingGrams: _servingGrams(t),
    kcal: _number(t, r'calories(?!\s*from)'),
    fatG: _number(t, r'total\s*fat'),
    carbsG: _number(t, r'total\s*carb\w*\.?'),
    proteinG: _number(t, r'protein'),
    fiberG: _number(t, r'(?:dietary\s*)?fiber'),
    sodiumMg: _number(t, r'sodium'),
  );
}

String _clean(String text) => text
    .replaceAll('\r', '\n')
    .replaceAll(RegExp(r'[ \t]+'), ' ')
    .toLowerCase();

/// Digits only after fixing the letters a recogniser mistakes for them, and
/// only when they sit next to other digits.
String _digits(String s) => s
    .replaceAllMapped(
      RegExp(r'(?<=\d)[oO](?=\d|\b)|(?<=\b)[oO](?=\d)'),
      (_) => '0',
    )
    .replaceAllMapped(RegExp(r'(?<=\d)[l|](?=\d)'), (_) => '1');

double? _number(String t, String label) {
  final m = RegExp('$label${r'[\s:.\-]*(\d+(?:[.,]\d+)?)'}')
      .firstMatch(_digits(t));
  if (m == null) return null;
  return double.tryParse(m.group(1)!.replaceAll(',', '.'));
}

String? _servingText(String t) {
  final m = RegExp(r'serving\s*size[\s:]*([^\n]+)').firstMatch(t);
  final text = m?.group(1)?.trim();
  return text == null || text.isEmpty ? null : text;
}

double? _servingGrams(String t) {
  final line = RegExp(r'serving\s*size[\s:]*([^\n]+)').firstMatch(t)?.group(1);
  if (line == null) return null;
  final g = RegExp(r'\(?\s*(\d+(?:\.\d+)?)\s*g\b').firstMatch(line);
  return g == null ? null : double.tryParse(g.group(1)!);
}
