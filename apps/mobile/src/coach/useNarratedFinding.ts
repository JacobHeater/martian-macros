import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import type { CoachFinding } from '../engine/analysis/CoachFinding';
import { coachFindingNarrationRequest } from '../format/coach/coachFindingNarrationRequest';
import { coachFindingText } from '../format/coach/coachFindingText';
import type { Fmt } from '../format/Fmt';
import { useCoachNarration } from '../app/useCoachNarration';

type Evidence = readonly (readonly [label: string, value: string])[];

/**
 * A finding's words with its sentence said by the person's own model when
 * one is set up (MM-672): the wait while it writes (`body` undefined,
 * MM-673), the model's sentence once it answers, the built-in one only
 * when it does not or no model is set up. The title and "The numbers
 * behind this" stay the built-in coach's. A pull to refresh asks again
 * rather than the cache (MM-670).
 */
export function useNarratedFinding(
  finding: CoachFinding,
  fmt: Fmt,
): readonly [title: string, body: string | undefined, evidence: Evidence] {
  const { state } = useApp();
  const brief = useCell(state.coachAnalysis.executiveBrief);
  const protectedPath = brief?.protectedPath === true;
  const [title, body, evidence] = coachFindingText(finding, fmt);
  const narration = useCoachNarration(coachFindingNarrationRequest(finding, { title, body, evidence }, protectedPath));
  return [title, narration.text, evidence];
}
