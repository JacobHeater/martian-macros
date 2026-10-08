/// The three macronutrients, each with one fixed color (see MacroBar).
enum MacroKind {
  protein('Protein'),
  carbs('Carbs'),
  fat('Fat');

  const MacroKind(this.label);

  final String label;
}
