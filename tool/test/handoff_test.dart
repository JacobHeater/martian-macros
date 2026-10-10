import 'package:test/test.dart';

import '../src/requirements.dart';

/// MM-174: the handoff document stays a short, rolling summary.
void main() {
  List<String> doc(int sessions) => [
    '# Handoff',
    '',
    '## Where things stand',
    'Something.',
    for (var i = 0; i < sessions; i++) ...['## Session $i', 'What changed.'],
  ];

  test('one to three sessions is fine', () {
    for (var sessions = 1; sessions <= handoffSessionLimit; sessions++) {
      expect(handoffProblems(doc(sessions)), isEmpty);
    }
  });

  test('a fourth session must push the oldest out', () {
    expect(handoffProblems(doc(4)).single, contains('drop the oldest'));
  });

  test('a document with no session says nothing useful', () {
    expect(handoffProblems(doc(0)).single, contains('at least one'));
  });

  test('other headings are not counted as sessions', () {
    expect(
      handoffProblems([...doc(3), '## Open decisions', '### Session notes']),
      isEmpty,
    );
  });
}
