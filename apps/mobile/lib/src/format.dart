import 'package:intl/intl.dart';
import 'package:mm_domain/mm_domain.dart';

/// Unit-aware formatting and parsing. Storage is always SI; this is the
/// only place imperial units exist.
final class Fmt {
  const Fmt(this.units);

  final UnitSystem units;

  bool get imperial => units == UnitSystem.imperial;

  String get weightUnit => imperial ? 'lb' : 'kg';
  String get lengthUnit => imperial ? 'in' : 'cm';

  double weightFromKg(double kg) => imperial ? Units.kgToLb(kg) : kg;
  double weightToKg(double value) => imperial ? Units.lbToKg(value) : value;
  double lengthFromCm(double cm) => imperial ? Units.cmToInches(cm) : cm;
  double lengthToCm(double value) => imperial ? Units.inchesToCm(value) : value;

  String weight(double kg, {int decimals = 1}) =>
      '${weightFromKg(kg).toStringAsFixed(decimals)} $weightUnit';

  /// A signed weight change, e.g. "−0.8 lb".
  String weightDelta(double kg, {int decimals = 1}) {
    final v = weightFromKg(kg);
    final sign = v > 0 ? '+' : (v < 0 ? '−' : '');
    return '$sign${v.abs().toStringAsFixed(decimals)} $weightUnit';
  }

  String length(double cm) =>
      '${lengthFromCm(cm).toStringAsFixed(1)} $lengthUnit';

  static String kcal(double value) => '${_whole.format(value.round())} kcal';
  static String whole(double value) => _whole.format(value.round());
  static String grams(double value) => '${value.round()} g';

  static String percentPerWeek(double fraction) {
    final pct = fraction * 100;
    final sign = pct > 0 ? '+' : (pct < 0 ? '−' : '');
    return '$sign${pct.abs().toStringAsFixed(2)}% / week';
  }

  static String day(CalendarDate date, CalendarDate today) {
    final diff = today.daysUntil(date);
    if (diff == 0) return 'Today';
    if (diff == -1) return 'Yesterday';
    if (diff == 1) return 'Tomorrow';
    return _dayFormat.format(DateTime(date.year, date.month, date.day));
  }

  static String shortDay(CalendarDate date) =>
      _shortFormat.format(DateTime(date.year, date.month, date.day));

  static String longDate(CalendarDate date) =>
      _longFormat.format(DateTime(date.year, date.month, date.day));

  static final _longFormat = DateFormat('MMMM d, y');
  static final _whole = NumberFormat.decimalPattern('en_US');
  static final _dayFormat = DateFormat('EEE, MMM d');
  static final _shortFormat = DateFormat('MMM d');
}

/// Parses user-typed numbers, tolerating a comma decimal separator.
double? parseNumber(String text) =>
    double.tryParse(text.trim().replaceAll(',', '.'));

extension GoalModeLabel on GoalMode {
  String get label => switch (this) {
    GoalMode.fatLoss => 'Fat loss',
    GoalMode.recomp => 'Recomp',
    GoalMode.leanGain => 'Lean gain',
    GoalMode.maintenance => 'Maintenance',
  };

  String get blurb => switch (this) {
    GoalMode.fatLoss => 'Lose fat at a steady pace while keeping muscle.',
    GoalMode.recomp =>
      'Hold weight roughly steady while trading fat for muscle.',
    GoalMode.leanGain => 'Build muscle in a small, controlled surplus.',
    GoalMode.maintenance => 'Hold where you are.',
  };
}

extension TrainingStatusLabel on TrainingStatus {
  String get label => switch (this) {
    TrainingStatus.untrained => 'Not lifting yet',
    TrainingStatus.novice => 'Under 1 year',
    TrainingStatus.returning => 'Returning after 6+ months off',
    TrainingStatus.intermediate => '1–3 years',
    TrainingStatus.advanced => '3+ years',
  };
}

extension MealLabel on Meal {
  String get label => switch (this) {
    Meal.breakfast => 'Breakfast',
    Meal.lunch => 'Lunch',
    Meal.dinner => 'Dinner',
    Meal.snack => 'Snacks',
  };
}

extension QuantitySourceLabel on QuantitySource {
  String get label => switch (this) {
    QuantitySource.weighed => 'Weighed',
    QuantitySource.labelServing => 'Label serving',
    QuantitySource.householdMeasure => 'Cup / spoon',
    QuantitySource.palm => 'Palm',
    QuantitySource.cuppedHand => 'Cupped hand',
    QuantitySource.thumb => 'Thumb',
    QuantitySource.quickAdd => 'Estimate',
  };
}
