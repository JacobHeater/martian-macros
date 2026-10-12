import { FormatError } from '../../lang/FormatError';
import { EvidenceGrade } from './EvidenceGrade';
import type { EvidenceQuestion } from './EvidenceQuestion';
import type { EvidenceRow } from './EvidenceRow';

/** The evidence register, read from docs/evidence.md (MM-143). */
export class EvidenceRegister {
  readonly questions: readonly EvidenceQuestion[];
  readonly rows: readonly EvidenceRow[];

  constructor(init: { questions: readonly EvidenceQuestion[]; rows: readonly EvidenceRow[] }) {
    this.questions = init.questions;
    this.rows = init.rows;
  }

  /**
   * Reads the register. Throws `FormatError` for a row or entry that is
   * not well formed, so a malformed file cannot reach a user.
   */
  static parse(markdown: string): EvidenceRegister {
    const text = markdown.replaceAll('\r\n', '\n');
    const questionsAt = text.indexOf('\n## Questions');
    const registerAt = text.indexOf('\n## Register');
    if (questionsAt < 0 || registerAt < questionsAt) {
      throw new FormatError('The register needs a "## Questions" section, then "## Register".');
    }
    return new EvidenceRegister({
      questions: questionsIn(text.substring(questionsAt, registerAt)),
      rows: rowsIn(text.substring(registerAt)),
    });
  }

  row(name: string): EvidenceRow | undefined {
    return this.rows.find((r) => r.name === name);
  }
}

function questionsIn(section: string): EvidenceQuestion[] {
  const out: EvidenceQuestion[] = [];
  for (const block of section.split('\n### ').slice(1)) {
    const lines = block.split('\n');
    const title = (lines[0] ?? '').trim();
    const body = lines.slice(1).join('\n').trim();
    const rowsAt = body.lastIndexOf('Rows:');
    if (rowsAt < 0) {
      throw new FormatError(`Question "${title}" has no "Rows:" line.`);
    }
    out.push({
      title,
      answer: body
        .substring(0, rowsAt)
        .trim()
        .replace(/\s*\n\s*/g, ' '),
      rowNames: body
        .substring(rowsAt + 5)
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0),
    });
  }
  return out;
}

function rowsIn(section: string): EvidenceRow[] {
  const out: EvidenceRow[] = [];
  for (const line of section.split('\n')) {
    if (!line.startsWith('| `')) continue;
    const cells = line
      .substring(1, line.lastIndexOf('|'))
      .split(' | ')
      .map((c) => c.trim());
    const [name, value, where, decides, source, grade, population, checked] = cells;
    if (
      cells.length !== 8 ||
      name === undefined ||
      value === undefined ||
      where === undefined ||
      decides === undefined ||
      source === undefined ||
      grade === undefined ||
      population === undefined ||
      checked === undefined
    ) {
      throw new FormatError(`A register row needs 8 cells: ${line}`);
    }
    out.push({
      name: name.replaceAll('`', ''),
      value,
      where,
      decides,
      source,
      grade: EvidenceGrade.parse(grade),
      population,
      checked: checked.toLowerCase() === 'yes',
    });
  }
  return out;
}
