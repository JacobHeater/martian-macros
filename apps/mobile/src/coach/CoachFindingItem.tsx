import type { CoachFinding } from '../engine/analysis/CoachFinding';
import { coachAnalysisWords } from '../format/coachAnalysisWords';
import { coachFindingText } from '../format/coachFindingText';
import { findingControlName } from '../format/findingControlName';
import type { Fmt } from '../format/Fmt';
import { MmButton } from '../ui/MmButton';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmIcon } from '../ui/MmIcon';
import { StatRow } from '../ui/StatRow';
import './coach.css';

/**
 * One finding of "What your data says" (MM-610), drawn as the Dashboard's
 * insight is (`InsightCard`, its sibling): the title in numbers beside a
 * small neutral mark of its kind (holding up or worth changing, in the
 * secondary text colour, named aloud), the sentence, "The numbers behind
 * this" folded under it as label and value rows, as the confidence section
 * has them, and then the text button to dismiss it, so the reading order
 * is the finding's own. Flat on the section's card, so nothing nests.
 */
export function CoachFindingItem({
  finding,
  fmt,
  level = 4,
  titleId,
  onDismiss,
}: {
  finding: CoachFinding;
  fmt: Fmt;
  /** The title's heading level: 4 under a list's label, 3 where no label stands above it (1d's "what is left"). */
  level?: 3 | 4;
  /** The title's id, so the focus can go to it once the finding before it is dismissed. */
  titleId?: string | undefined;
  /** Hides it for 28 days; absent for what cannot be dismissed (1d's "what is left"). */
  onDismiss?: (() => void) | undefined;
}) {
  const [title, body, evidence] = coachFindingText(finding, fmt);
  const Heading = level === 3 ? 'h3' : 'h4';
  const mark =
    finding.kind === 'holdingUp'
      ? ({ icon: 'checkCircle', label: coachAnalysisWords.holdingUp } as const)
      : finding.kind === 'left'
        ? undefined
        : ({ icon: 'tune', label: coachAnalysisWords.worthChanging } as const);
  return (
    <div className="coach-finding">
      <div className="coach-finding-head">
        {mark === undefined ? null : (
          <span className="coach-finding-mark" role="img" aria-label={mark.label}>
            <MmIcon name={mark.icon} size={16} />
          </span>
        )}
        <Heading id={titleId} tabIndex={-1} className="coach-finding-title">
          {title}
        </Heading>
      </div>
      <p className="app-text">{body}</p>
      <MmDisclosure title={coachAnalysisWords.numbersBehind} name={findingControlName('numbers', title)}>
        {evidence.map(([label, value], at) => (
          <StatRow key={`${at}-${label}`} label={label} value={value} />
        ))}
      </MmDisclosure>
      {onDismiss === undefined ? null : (
        <div className="coach-finding-dismiss">
          <MmButton label={coachAnalysisWords.dismiss} name={findingControlName('dismiss', title)} kind="text" onPress={onDismiss} />
        </div>
      )}
    </div>
  );
}
