import { FormatError } from '../../lang/FormatError';

const inWords = {
  /** Consistent meta-analyses, consensus statements, or established physiology. */
  strong: 'Well established',
  /**
   * A good meta-analysis with inconsistency, several trials, or strong
   * evidence in a population different from the app's users.
   */
  moderate: 'Reasonably supported',
  /** One or a few small studies. */
  emerging: 'Early evidence',
  /** Expert practice or product reasoning with no direct trial. */
  judgement: 'Our judgement',
} as const;

/** How good the evidence behind a constant or rule is (docs/evidence.md). */
export type EvidenceGrade = keyof typeof inWords;

export const EvidenceGrade = {
  values: Object.keys(inWords) as readonly EvidenceGrade[],

  /** What the app says, in place of the grade's name. */
  inWords(grade: EvidenceGrade): string {
    return inWords[grade];
  },

  parse(name: string): EvidenceGrade {
    if (Object.hasOwn(inWords, name)) return name as EvidenceGrade;
    throw new FormatError(`Not an evidence grade: "${name}"`);
  },
} as const;
