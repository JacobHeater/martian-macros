/// The files allowed to break the rules today. It can only shrink.
final class ArchBaseline {
  ArchBaseline(Iterable<String> paths) : paths = {...paths};

  /// Parses the baseline file: one path per line; `#` starts a comment.
  factory ArchBaseline.parse(String text) => ArchBaseline([
    for (final raw in text.split('\n'))
      if (raw.split('#').first.trim().isNotEmpty) raw.split('#').first.trim(),
  ]);

  final Set<String> paths;

  String render() {
    final sorted = paths.toList()..sort();
    return '# Files that do not yet follow the engineering rules (MM-160).\n'
        '# This list can only shrink: do not add to it. `mm arch` fails if a\n'
        '# listed file is fixed and left here.\n'
        '${sorted.join('\n')}${sorted.isEmpty ? '' : '\n'}';
  }
}
