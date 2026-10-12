import type { ConfidenceLevel } from '../engine';

const labels: Readonly<Record<ConfidenceLevel, string>> = {
  learning: 'Learning',
  fair: 'Fair',
  good: 'Good',
};

export const confidenceLabel = (level: ConfidenceLevel): string => labels[level];
