import 'evidence_grade.dart';
import 'evidence_question.dart';
import 'evidence_row.dart';

/// The evidence register, read from docs/evidence.md (MM-143).
final class EvidenceRegister {
  const EvidenceRegister({required this.questions, required this.rows});

  /// Reads the register. Throws [FormatException] for a row or entry that is
  /// not well formed, so a malformed file cannot reach a user.
  factory EvidenceRegister.parse(String markdown) {
    final text = markdown.replaceAll('\r\n', '\n');
    final questionsAt = text.indexOf('\n## Questions');
    final registerAt = text.indexOf('\n## Register');
    if (questionsAt < 0 || registerAt < questionsAt) {
      throw const FormatException(
        'The register needs a "## Questions" section, then "## Register".',
      );
    }
    return EvidenceRegister(
      questions: _questions(text.substring(questionsAt, registerAt)),
      rows: _rows(text.substring(registerAt)),
    );
  }

  final List<EvidenceQuestion> questions;
  final List<EvidenceRow> rows;

  EvidenceRow? row(String name) {
    for (final r in rows) {
      if (r.name == name) return r;
    }
    return null;
  }

  static List<EvidenceQuestion> _questions(String section) {
    final out = <EvidenceQuestion>[];
    for (final block in section.split('\n### ').skip(1)) {
      final lines = block.split('\n');
      final title = lines.first.trim();
      final body = lines.skip(1).join('\n').trim();
      final rowsAt = body.lastIndexOf('Rows:');
      if (rowsAt < 0) {
        throw FormatException('Question "$title" has no "Rows:" line.');
      }
      out.add(
        EvidenceQuestion(
          title: title,
          answer: body
              .substring(0, rowsAt)
              .trim()
              .replaceAll(RegExp(r'\s*\n\s*'), ' '),
          rowNames: [
            for (final n in body.substring(rowsAt + 5).split(','))
              if (n.trim().isNotEmpty) n.trim(),
          ],
        ),
      );
    }
    return out;
  }

  static List<EvidenceRow> _rows(String section) {
    final out = <EvidenceRow>[];
    for (final line in section.split('\n')) {
      if (!line.startsWith('| `')) continue;
      final cells = line
          .substring(1, line.lastIndexOf('|'))
          .split(' | ')
          .map((c) => c.trim())
          .toList();
      if (cells.length != 8) {
        throw FormatException('A register row needs 8 cells: $line');
      }
      out.add(
        EvidenceRow(
          name: cells[0].replaceAll('`', ''),
          value: cells[1],
          where: cells[2],
          decides: cells[3],
          source: cells[4],
          grade: EvidenceGrade.parse(cells[5]),
          population: cells[6],
          checked: cells[7].toLowerCase() == 'yes',
        ),
      );
    }
    return out;
  }
}
