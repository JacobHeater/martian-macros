import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { coachFindingNarrationRequest } from '../../src/format/coach/coachFindingNarrationRequest';
import { coachFindingText } from '../../src/format/coach/coachFindingText';
import { Fmt } from '../../src/format/Fmt';
import { whyCoachNarrationRejected } from '../../src/format/coach/whyCoachNarrationRejected';

/** MM-672: a finding of "Coach's feedback" asked of the person's own model, the built-in sentence its fallback. */
const yesterday = CalendarDate.of(2026, 10, 27);
const fmt = new Fmt('metric');
const finding: CoachFinding = {
  id: 'proteinMinimum:level',
  signal: 'proteinMinimum',
  kind: 'fix',
  span: 14,
  from: yesterday.addDays(-13),
  to: yesterday,
  priority: 'coaching',
  figures: { metDays: 6, judgedDays: 14, minimumG: 140, averageShortfallG: 22.4 },
  foods: [],
  trade: undefined,
  trend: undefined,
};

describe('a finding’s narration request', () => {
  const words = () => {
    const [title, body, evidence] = coachFindingText(finding, fmt);
    return { title, body, evidence };
  };

  it('falls back to the built-in sentence, and sends the title, the sentence and the numbers behind it', () => {
    const w = words();
    const req = coachFindingNarrationRequest(finding, w, false);
    expect(req.fallbackText).toBe(w.body);
    const sent = JSON.parse(req.userPrompt) as { title: string; builtInWords: string; numbersBehindThis: { label: string; value: string }[] };
    expect(sent.title).toBe(w.title);
    expect(sent.builtInWords).toBe(w.body);
    expect(sent.numbersBehindThis.map((row) => row.label)).toEqual(w.evidence.map(([label]) => label));
    expect(req.systemPrompt).toContain('as whole numbers');
    expect(req.protectedPath).toBe(false);
    expect(coachFindingNarrationRequest(finding, w, true).protectedPath).toBe(true);
  });

  it('allows the figures, whole, and the numbers in the words, so the model’s words on them pass the check', () => {
    const req = coachFindingNarrationRequest(finding, words(), false);
    expect(req.allowedNumbers).toEqual(expect.arrayContaining([6, 14, 140, 22]));
    expect(req.allowedNumbers.every(Number.isInteger)).toBe(true);
    expect(
      whyCoachNarrationRejected('Six of 14 days at 140 g is not a habit yet, 22 g short on the rest. Put a protein food on every plate this week.', req),
    ).toBeUndefined();
    expect(whyCoachNarrationRejected('You were 35 g short most days. Add protein at breakfast tomorrow.', req)).toBe(
      'It used a number not in your figures (35)',
    );
  });

  it('is keyed by the finding and its words, so the same finding said the same way is asked once', () => {
    const w = words();
    const same = coachFindingNarrationRequest(finding, w, false).cacheKey;
    expect(coachFindingNarrationRequest(finding, w, false).cacheKey).toBe(same);
    expect(same).toMatch(/^finding:proteinMinimum:level:/);
    expect(coachFindingNarrationRequest(finding, { ...w, body: `${w.body} More.` }, false).cacheKey).not.toBe(same);
  });
});
