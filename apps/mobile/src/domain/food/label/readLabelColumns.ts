/**
 * The lines a panel prints as labels, by what they are: anchored, so a line
 * is a label only when it is nothing else. Lines that are labels but not
 * read (trans fat, added sugars) still count, so the values pair in order.
 */
const labels: readonly (readonly [string, RegExp])[] = [
  ['kcal', /^calories$/],
  ['fatG', /^total\s*fat$/],
  ['saturatedFat', /^sat(?:urated|\.)?\s*fat$/],
  ['transFat', /^trans\s*fat$/],
  ['cholesterol', /^cholesterol$/],
  ['sodiumMg', /^sodium$/],
  ['carbsG', /^total\s*carb\w*\.?$/],
  ['fiberG', /^(?:dietary\s*)?fiber$/],
  ['sugars', /^(?:total\s*)?sugars?$/],
  ['addedSugars', /^(?:incl(?:udes|\.)?\s*)?added\s*sugars?$/],
  ['sugarAlcoholsG', /^sugar\s*alcohols?$/],
  ['proteinG', /^protein$/],
];

/** A value alone on its line ("8g", "160 mg", "230"), with an optional percent after it. */
// "µg" lower-cased is the Greek "μg"; both are micrograms.
const valueLine = /^(\d+(?:[.,]\d+)?)\s*(g|mg|mcg|µg|μg|ug)?(?:\s+\d+(?:[.,]\d+)?\s*%)?$/;
const percentLine = /^\d+(?:[.,]\d+)?\s*%$/;

/** The fewest labels in a row that make a column; one or two are a label and its value on the next line. */
const shortestColumn = 3;

function labelOf(line: string): string | undefined {
  return labels.find(([, pattern]) => pattern.test(line))?.[0];
}

/**
 * Reads a panel whose labels and values a recogniser returned in separate
 * columns (MM-44): a run of label lines, then a run of value lines, paired
 * in order. `text` is the cleaned, lower-case, digit-repaired text.
 *
 * It pairs only when the runs are the same length, percent-only lines
 * aside, so a column it cannot line up is not read at all rather than read
 * shifted: its labels are kept with no value, so the caller does not take
 * the number below the last of them as its own either. Each value is the number and the unit printed with it, if any;
 * the caller decides whether that unit fits. What it reads is inferred from
 * position, so the caller marks it unsure.
 */
export function readLabelColumns(text: string): ReadonlyMap<string, readonly [number, string | undefined] | undefined> {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const read = new Map<string, readonly [number, string | undefined] | undefined>();
  let i = 0;
  while (i < lines.length) {
    const run: string[] = [];
    while (i < lines.length && labelOf(lines[i] as string) !== undefined) {
      run.push(labelOf(lines[i] as string) as string);
      i += 1;
    }
    if (run.length < shortestColumn) {
      if (run.length === 0) i += 1;
      continue;
    }
    const values: (readonly [number, string | undefined])[] = [];
    while (i < lines.length && values.length < run.length) {
      const line = lines[i] as string;
      const m = valueLine.exec(line);
      if (m !== null) {
        values.push([Number((m[1] as string).replace(',', '.')), m[2] === 'µg' || m[2] === 'μg' || m[2] === 'ug' ? 'mcg' : m[2]]);
      } else if (!percentLine.test(line)) {
        break;
      }
      i += 1;
    }
    const paired = values.length === run.length;
    run.forEach((key, k) => {
      if (!read.has(key)) read.set(key, paired ? values[k] : undefined);
    });
  }
  return read;
}
