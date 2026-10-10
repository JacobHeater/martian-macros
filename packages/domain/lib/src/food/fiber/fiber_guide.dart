import '../../biological_sex.dart';

/// The day's fiber guide in grams (MM-126): 14 g per 1,000 kcal of the calorie
/// target, never below 25 g for men or 21 g for women, so a low target does
/// not lower it much. A guide, never a goal that is judged.
double fiberGuideG({required double kcalTarget, required BiologicalSex sex}) {
  final minimum = sex == BiologicalSex.male ? 25.0 : 21.0;
  final scaled = kcalTarget * 14 / 1000;
  return scaled > minimum ? scaled : minimum;
}
