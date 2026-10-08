/// Converts a Dart type name to the file name stem the rules expect.
final class SnakeCase {
  const SnakeCase();

  /// `MacroBar` -> `macro_bar`, `HTTPClient` -> `http_client`,
  /// `_Private` -> `private`.
  String of(String name) {
    final stripped = name.startsWith('_') ? name.substring(1) : name;
    final out = StringBuffer();
    for (var i = 0; i < stripped.length; i++) {
      final c = stripped[i];
      final isUpper = c != c.toLowerCase();
      if (isUpper && i > 0) {
        final prev = stripped[i - 1];
        final prevLower = prev == prev.toLowerCase() && prev != '_';
        final nextLower =
            i + 1 < stripped.length &&
            stripped[i + 1] == stripped[i + 1].toLowerCase() &&
            stripped[i + 1] != '_';
        final prevUpper = prev != prev.toLowerCase();
        if (prevLower || (prevUpper && nextLower)) out.write('_');
      }
      out.write(c.toLowerCase());
    }
    return out.toString();
  }
}
