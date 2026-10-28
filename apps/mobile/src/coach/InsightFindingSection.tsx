import type { CoachFinding } from '../engine/analysis/CoachFinding';
import { coachAnalysisWords } from '../format/coachAnalysisWords';
import type { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { MmBusyLine } from '../ui/MmBusyLine';
import { MmButton } from '../ui/MmButton';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmSection } from '../ui/MmSection';
import { StatRow } from '../ui/StatRow';
import { useNarratedFinding } from './useNarratedFinding';

/**
 * The Dashboard's insight when it is the coach's top finding (MM-610): the
 * finding in the Coach tab's words, its sentence in the person's own model's
 * where one is set up, as on Coach (MM-672), with a way to open that section
 * there and to dismiss it on both.
 */
export function InsightFindingSection({ finding, fmt }: { finding: CoachFinding; fmt: Fmt }) {
  const { state } = useApp();
  const [title, body, evidence] = useNarratedFinding(finding, fmt);
  return (
    <MmSection
      framed
      icon="insight"
      title={title}
      trailing={<MmButton label="Dismiss" kind="text" onPress={() => void state.coachAnalysis.dismiss(finding.id)} />}
    >
      {body === undefined ? <MmBusyLine label={coachAnalysisWords.writing} /> : <p className="app-text">{body}</p>}
      <MmDisclosure title={coachAnalysisWords.numbersBehind}>
        {evidence.map(([label, value], at) => (
          <StatRow key={`${at}-${label}`} label={label} value={value} />
        ))}
      </MmDisclosure>
      <MmButton
        label={coachAnalysisWords.openOnCoach}
        name={`${coachAnalysisWords.openOnCoach}: ${title}`}
        kind="text"
        onPress={() => {
          state.coachAnalysis.openCanonical();
          // The fold it opens on Coach starts closed (MM-676): opened, so the finding is in sight on arrival.
          state.folds.put(new Map(state.folds.peek()).set('coach.feedback', true));
          state.homeTab.put('coach');
        }}
      />
    </MmSection>
  );
}
