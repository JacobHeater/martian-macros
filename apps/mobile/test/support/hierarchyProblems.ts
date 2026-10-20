import { readFileSync } from 'node:fs';
import { rules, stylesheets } from './stylesheetRules';

/**
 * The classes drawn in a figure type role (`--type-figure`, `--type-figure-xl`), read from the app's own
 * stylesheets, so a new figure class is counted without this file knowing its name (MM-287).
 */
const figureSelector = [
  ...new Set(
    stylesheets('src').flatMap((path) =>
      rules(readFileSync(path, 'utf8'))
        .filter((rule) => /font:\s*var\(--type-figure(?:-xl)?\)/.test(rule.body))
        .flatMap((rule) => rule.selectors)
        .filter((selector) => /^\.[\w-]+$/.test(selector)),
    ),
  ),
]
  .map((selector) => `.mm-hero ${selector}`)
  .join(', ');

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
  // Rule 6: one primary action per screen, and so one Ember action (MM-288): a fill, the floating action,
  // or the lead text action in the app bar; every other action is a text action in the text colour.
  const primaries = count('.mm-button-primary:not([disabled]), .mm-fab, .mm-button-lead:not([disabled])');
  if (primaries > 1) problems.push(`${primaries} primary actions are shown; one is the limit (rule 6)`);
  // Rule 1, the owner's ruling of 2026-10-14 (MM-291): a field sits on a surface
  // (a card, the hero, a list group, a sheet or a dialog), never bare on the canvas.
  const bare = [...root.querySelectorAll('.mm-field, .mm-chip, .mm-segmented')].filter(
    (field) => field.closest('.mm-surface, .mm-hero, .mm-list-group, .mm-sheet, .mm-dialog, [role="dialog"]') === null,
  ).length;
  if (bare > 0) problems.push(`${bare} field(s) sit bare on the canvas (rule 1)`);
  // Rule 1 again: at most one hero.
  if (count('.mm-hero') > 1) problems.push('more than one hero is drawn (rule 1)');
  // Rule 1: the hero holds one figure, figureXL or figure (MM-287); Progress once showed three of equal weight.
  const figures = figureSelector === '' ? 0 : count(figureSelector);
  if (figures > 1) problems.push(`${figures} figures are drawn in the hero; one is the limit (rule 1)`);
  return problems;
}
