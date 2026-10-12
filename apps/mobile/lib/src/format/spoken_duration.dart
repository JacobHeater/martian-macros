/// A length of time as it is said aloud, for a screen reader: "1 minute 30
/// seconds", "45 seconds", "1 hour 2 minutes 0 seconds". Never negative.
String spokenDuration(Duration duration) {
  final total = duration.isNegative ? 0 : duration.inSeconds;
  String count(int n, String unit) => n == 1 ? '1 $unit' : '$n ${unit}s';
  final hours = total ~/ 3600;
  final minutes = (total % 3600) ~/ 60;
  return [
    if (hours > 0) count(hours, 'hour'),
    if (hours > 0 || minutes > 0) count(minutes, 'minute'),
    count(total % 60, 'second'),
  ].join(' ');
}
