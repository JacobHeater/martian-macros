/// Blanks comments and string contents so a scan sees only code structure.
///
/// Every removed character becomes a space and newlines are kept, so line
/// numbers and brace depth stay correct.
final class SourceScrubber {
  const SourceScrubber();

  String scrub(String source) {
    final out = StringBuffer();
    final n = source.length;
    var i = 0;
    while (i < n) {
      final c = source[i];
      if (c == '/' && i + 1 < n && source[i + 1] == '/') {
        final end = _lineEnd(source, i);
        out.write(_blank(source.substring(i, end)));
        i = end;
      } else if (c == '/' && i + 1 < n && source[i + 1] == '*') {
        final end = _blockCommentEnd(source, i);
        out.write(_blank(source.substring(i, end)));
        i = end;
      } else if (c == "'" || c == '"') {
        final raw =
            i > 0 && source[i - 1] == 'r' && !_isIdentChar(source, i - 2);
        final end = _stringEnd(source, i, raw: raw);
        out.write(_blank(source.substring(i, end)));
        i = end;
      } else {
        out.write(c);
        i++;
      }
    }
    return out.toString();
  }

  bool _isIdentChar(String s, int index) {
    if (index < 0) return false;
    return RegExp(r'[A-Za-z0-9_$]').hasMatch(s[index]);
  }

  int _lineEnd(String s, int from) {
    final nl = s.indexOf('\n', from);
    return nl == -1 ? s.length : nl;
  }

  /// Dart block comments nest.
  int _blockCommentEnd(String s, int from) {
    var depth = 0;
    var i = from;
    while (i < s.length) {
      if (s.startsWith('/*', i)) {
        depth++;
        i += 2;
      } else if (s.startsWith('*/', i)) {
        depth--;
        i += 2;
        if (depth == 0) return i;
      } else {
        i++;
      }
    }
    return s.length;
  }

  /// Returns the index just after the closing delimiter of the string that
  /// starts at [from] (or the end of the line for an unterminated one).
  int _stringEnd(String s, int from, {required bool raw}) {
    final quote = s[from];
    final triple = s.startsWith(quote * 3, from);
    var i = from + (triple ? 3 : 1);
    while (i < s.length) {
      final c = s[i];
      if (!raw && c == r'\') {
        i += 2;
      } else if (!raw && c == r'$' && i + 1 < s.length && s[i + 1] == '{') {
        i = _interpolationEnd(s, i + 2);
      } else if (triple ? s.startsWith(quote * 3, i) : c == quote) {
        return i + (triple ? 3 : 1);
      } else if (!triple && c == '\n') {
        return i;
      } else {
        i++;
      }
    }
    return s.length;
  }

  /// [from] is just after `${`; returns the index after the matching `}`.
  int _interpolationEnd(String s, int from) {
    var depth = 1;
    var i = from;
    while (i < s.length && depth > 0) {
      final c = s[i];
      if (c == '{') {
        depth++;
        i++;
      } else if (c == '}') {
        depth--;
        i++;
      } else if (c == "'" || c == '"') {
        i = _stringEnd(s, i, raw: false);
      } else {
        i++;
      }
    }
    return i;
  }

  String _blank(String text) => text.replaceAll(RegExp(r'[^\n]'), ' ');
}
