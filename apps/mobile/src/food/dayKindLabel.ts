import type { DayKind } from '../domain/DayKind';

const labels: Readonly<Record<DayKind, string>> = {
  none: 'No mark',
  refeed: 'Refeed',
  dayOff: 'Day off',
};

/** A day's mark in words (MM-611): the owner's names, Refeed and Day off. */
export const dayKindLabel = (kind: DayKind): string => labels[kind];
