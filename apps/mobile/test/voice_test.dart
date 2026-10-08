import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// MM-108: the app states, it does not judge or moralize. These words must not
/// appear in any text the app shows. (Code identifiers and keys are not text.)
void main() {
  const banned = <String>[
    'good',
    'bad',
    'clean',
    'junk',
    'guilt',
    'cheat',
    'oops',
    'earn',
    'burn off',
    'lbs',
    'true weight',
    'sinful',
    'naughty',
    'indulg',
    'deserve',
    'starvation mode',
    'metabolic damage',
    'toning',
  ];

  // Single- and double-quoted string literals on one line.
  final single = RegExp(r"'((?:[^'\\\n]|\\.)+)'");
  final double = RegExp(r'"((?:[^"\\\n]|\\.)+)"');

  List<(String file, String text)> texts() {
    final out = <(String, String)>[];
    for (final entity in Directory('lib').listSync(recursive: true)) {
      if (entity is! File || !entity.path.endsWith('.dart')) continue;
      // The gallery is developer tooling, not user-facing text.
      if (entity.path.replaceAll(r'\', '/').contains('/gallery/')) continue;
      for (final line in entity.readAsLinesSync()) {
        final t = line.trim();
        if (t.startsWith('import ') ||
            t.startsWith('export ') ||
            t.startsWith('part ') ||
            t.startsWith('//')) {
          continue;
        }
        // Keys are identifiers, not text the user reads.
        if (t.contains('ValueKey(')) continue;
        for (final m in [
          ...single.allMatches(line),
          ...double.allMatches(line),
        ]) {
          final text = m.group(1)!;
          if (text.length >= 3 && text.contains(RegExp('[A-Za-z]{3}'))) {
            out.add((entity.path, text));
          }
        }
      }
    }
    return out;
  }

  test('the text is found', () {
    expect(texts().length, greaterThan(100));
  });

  for (final word in banned) {
    test('no text uses "$word"', () {
      final pattern = RegExp(
        word.length <= 4 ? '\\b$word\\b' : word,
        caseSensitive: false,
      );
      final hits = [
        for (final (file, text) in texts())
          if (pattern.hasMatch(text)) '$file: "$text"',
      ];
      expect(hits, isEmpty);
    });
  }
}
