/**
 * The checkable rules of the direction (MM-253): what a drawn screen must
 * never do. Each problem names the rule it breaks, so a failing story says
 * what to fix.
 */
export function hierarchyProblems(root: ParentNode): string[] {
  const problems: string[] = [];
  const count = (selector: string) => root.querySelectorAll(selector).length;
  // Rule 1: one grouping surface per idea; no card inside a card, no card inside the hero.
  if (count('.mm-surface .mm-surface, .mm-hero .mm-surface, .mm-surface .mm-hero') > 0) {
    problems.push('a card is nested in a card or in the hero (rule 1)');
  }
  // A notice is a surface of its own: never inside a card, the hero or a list group (PD-10).
  if (count('.mm-surface .mm-notice, .mm-hero .mm-notice, .mm-list-group .mm-notice') > 0) {
    problems.push('a notice is drawn inside a card, the hero or a list group (rule 1)');
  }
  // Rule 4: one macro picture at a time; the bars and the donut are never both shown.
  if (count('.mm-macro-bar') > 0 && count('.chart-split-ring') > 0) {
    problems.push('the macro bars and the macro donut are shown at once (rule 4)');
  }
  // Rule 6: one primary action per screen.
  const primaries = count('.mm-button-primary:not([disabled]), .mm-fab');
  if (primaries > 1) problems.push(`${primaries} primary actions are shown; one is the limit (rule 6)`);
  // Rule 1 again: at most one hero.
  if (count('.mm-hero') > 1) problems.push('more than one hero is drawn (rule 1)');
  return problems;
}
