/// A size in megabytes for people, counted the way the phone's own storage
/// screen counts them (1 MB is a million bytes): "47 MB", "0.8 MB".
String megabytes(int bytes) {
  final mb = bytes / 1000000;
  return mb >= 10 ? '${mb.round()} MB' : '${mb.toStringAsFixed(1)} MB';
}
