import 'fmt.dart';

/// A size of waist change as shown: to the half centimeter or the quarter
/// inch, without a sign. Finer would be false precision for a tape
/// (MM-155).
String waistAmount(double cm, Fmt fmt) {
  final step = fmt.imperial ? 0.25 : 0.5;
  final value = (fmt.lengthFromCm(cm.abs()) / step).round() * step;
  final text = value == value.roundToDouble()
      ? value.round().toString()
      : value.toString();
  return '$text ${fmt.lengthUnit}';
}
