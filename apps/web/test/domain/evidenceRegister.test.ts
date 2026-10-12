import { expect, it } from 'vitest';
import { EvidenceGrade, EvidenceRegister } from '../../src/domain';
import { FormatError } from '../../src/lang/FormatError';

const row = '| `A.b` | 1 | here | decides | Source 2020 | strong | adults | No |';

const doc = ({ rows = row, rowsLine = 'Rows: A.b' }: { rows?: string; rowsLine?: string } = {}) => `# Title
## Questions
### Why?
Because it is so.
${rowsLine}
## Register
| Name | Value |
|---|---|
${rows}
`;

it('parses questions and rows', () => {
  const r = EvidenceRegister.parse(doc());
  expect(r.questions).toHaveLength(1);
  expect(r.questions[0]?.title).toBe('Why?');
  expect(r.questions[0]?.answer).toBe('Because it is so.');
  expect(r.questions[0]?.rowNames).toEqual(['A.b']);
  expect(r.row('A.b')?.grade).toBe('strong');
  expect(r.row('A.b')?.checked).toBe(false);
  expect(r.row('missing')).toBeUndefined();
});

it('rejects a row without 8 cells', () => {
  expect(() => EvidenceRegister.parse(doc({ rows: '| `A.b` | 1 | here |' }))).toThrow(FormatError);
});

it('rejects a question without a Rows line', () => {
  expect(() => EvidenceRegister.parse(doc({ rowsLine: '' }))).toThrow(FormatError);
});

it('grades are shown in words', () => {
  expect(EvidenceGrade.inWords('judgement')).toBe('Our judgement');
  expect(EvidenceGrade.inWords('strong')).toBe('Well established');
});
