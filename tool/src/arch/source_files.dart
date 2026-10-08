import 'dart:io';

/// The Dart files the structure rules apply to.
final class SourceFiles {
  const SourceFiles();

  static const roots = ['apps', 'packages', 'tool'];
  static const _skipped = [
    '/build/',
    '/.dart_tool/',
    '/generated_migrations/',
    '/android/',
    '/ios/',
    '/windows/',
    '/linux/',
    '/macos/',
    '/web/',
  ];

  /// Repo-relative paths (with `/`) of every checked file under [repoRoot].
  List<String> list(Directory repoRoot) {
    final base = repoRoot.path.replaceAll(r'\', '/');
    final out = <String>[];
    for (final root in roots) {
      final dir = Directory('${repoRoot.path}/$root');
      if (!dir.existsSync()) continue;
      for (final entity in dir.listSync(recursive: true)) {
        if (entity is! File) continue;
        final full = entity.path.replaceAll(r'\', '/');
        if (!full.endsWith('.dart') || full.endsWith('.g.dart')) continue;
        final relative = full.substring(base.length + 1);
        if (_skipped.any((s) => '/$relative'.contains(s))) continue;
        out.add(relative);
      }
    }
    out.sort();
    return out;
  }
}
