/// Parses user-typed numbers, tolerating a comma decimal separator.
double? parseNumber(String text) =>
    double.tryParse(text.trim().replaceAll(',', '.'));
