/// A size in megabytes for people: "46 MB", "0.4 MB".
String megabytes(int bytes) {
  final mb = bytes / (1024 * 1024);
  if (mb >= 10) return '${mb.round()} MB';
  if (mb >= 1) return '${mb.toStringAsFixed(1)} MB';
  return '${(mb).toStringAsFixed(1)} MB';
}
