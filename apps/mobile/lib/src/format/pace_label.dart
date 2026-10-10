/// A fat-loss pace as text, such as "0.5% a week" or "0.75% a week".
String paceLabel(double fraction) {
  final percent = fraction * 100;
  final text = percent == percent.roundToDouble()
      ? percent.toStringAsFixed(0)
      : percent.toStringAsFixed(2).replaceFirst(RegExp(r'0$'), '');
  return '$text% a week';
}
