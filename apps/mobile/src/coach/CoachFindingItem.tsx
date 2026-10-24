import type { CoachFinding } from '../engine/analysis/CoachFinding';
import { coachAnalysisWords } from '../format/coachAnalysisWords';
import { coachFindingText } from '../format/coachFindingText';
import type { Fmt } from '../format/Fmt';
import { MmButton } from '../ui/MmButton';
import { MmDisclosure } from '../ui/MmDisclosure';
import { StatRow } from '../ui/StatRow';
import './coach.css';

/**
 * One finding of "What your data says" (MM-610), drawn as the Dashboard's
 * insight is (`InsightCard`, its sibling): the title in numbers with a
 * text button to dismiss it, the sentence, and "The numbers behind this"
 * folded under it as label and value rows, as the confidence section has
 * them. Flat on the section's card, so nothing nests.
 */
export function CoachFindingItem({
  finding,
  fmt,
  onDismiss,
}: {
  finding: CoachFinding;
  fmt: Fmt;
  /** Hides it for 28 days; absent for what cannot be dismissed (1d's "what is left"). */
  onDismiss?: (() => void) | undefined;
}) {
  const [title, body, evidence] = coachFindingText(finding, fmt);
  return (
    <div className="coach-finding">
      <div className="coach-finding-head">
        <h4 className="coach-finding-title">{title}</h4>
        {onDismiss === undefined ? null : <MmButton label="Dismiss" name={`Dismiss: ${title}`} kind="text" onPress={onDismiss} />}
      </div>
      <p className="app-text">{body}</p>
      <MmDisclosure title={coachAnalysisWords.numbersBehind}>
        {evidence.map(([label, value], at) => (
          <StatRow key={`${at}-${label}`} label={label} value={value} />
        ))}
      </MmDisclosure>
    </div>
  );
}
