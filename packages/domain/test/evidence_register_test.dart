import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

const _row =
    '| `A.b` | 1 | here | decides | Source 2020 | strong | adults | No |';

String _doc({String rows = _row, String rowsLine = 'Rows: A.b'}) =>
    '''
# Title

## Questions

### Why?

Because it is so.
$rowsLine

## Register

| Name | Value |
|---|---|
$rows
''';

void main() {
  test('parses questions and rows', () {
    final r = EvidenceRegister.parse(_doc());
    expect(r.questions.single.title, 'Why?');
    expect(r.questions.single.answer, 'Because it is so.');
    expect(r.questions.single.rowNames, ['A.b']);
    expect(r.row('A.b')!.grade, EvidenceGrade.strong);
    expect(r.row('A.b')!.checked, isFalse);
    expect(r.row('missing'), isNull);
  });

  test('rejects a row without 8 cells', () {
    expect(
      () => EvidenceRegister.parse(_doc(rows: '| `A.b` | 1 | here |')),
      throwsFormatException,
    );
  });

  test('rejects a question without a Rows line', () {
    expect(
      () => EvidenceRegister.parse(_doc(rowsLine: '')),
      throwsFormatException,
    );
  });

  test('grades are shown in words', () {
    expect(EvidenceGrade.judgement.inWords, 'Our judgement');
    expect(EvidenceGrade.strong.inWords, 'Well established');
  });
}
