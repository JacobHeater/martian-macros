/// Photographs a Nutrition Facts panel and returns the text on it (MM-44).
/// The app depends on this, not on a camera or recognition plugin, so tests use
/// a fake and the plugin can be replaced. Nothing leaves the phone.
abstract interface class LabelTextReader {
  /// The recognised text, or null when the person cancelled.
  Future<String?> readLabel();
}
