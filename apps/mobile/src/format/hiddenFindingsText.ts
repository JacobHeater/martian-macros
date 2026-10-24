import type { HiddenFinding } from '../engine/analysis/HiddenFinding';

/**
 * The fold of dismissed findings (MM-610): "1 finding hidden", "3 findings
 * hidden". Each row inside says when it shows again (`showsAgainText`).
 * Empty when none is hidden.
 */
export function hiddenFindingsText(hidden: readonly HiddenFinding[]): string {
  if (hidden.length === 0) return '';
  return `${hidden.length} ${hidden.length === 1 ? 'finding' : 'findings'} hidden`;
}
