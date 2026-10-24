import { useEffect } from 'react';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { AnalysisSpan } from '../engine/analysis/AnalysisSpan';
import type { CoachFinding } from '../engine/analysis/CoachFinding';
import { coachAnalysisWords } from '../format/coachAnalysisWords';
import { coachFindingText } from '../format/coachFindingText';
import { coachHeadlineText } from '../format/coachHeadlineText';
import { coachPeriodText } from '../format/coachPeriodText';
import { Fmt } from '../format/Fmt';
import { hiddenFindingsText } from '../format/hiddenFindingsText';
import { moreFindingsText } from '../format/moreFindingsText';
import { nothingFoundText } from '../format/nothingFoundText';
import { underEatingPointerText } from '../format/underEatingPointerText';
import { unjudgedAreaText } from '../format/unjudgedAreaText';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSegmented } from '../ui/MmSegmented';
import { Notice } from '../ui/Notice';
import { SectionLabel } from '../ui/SectionLabel';
import { StatRow } from '../ui/StatRow';
import { CoachFindingItem } from './CoachFindingItem';
import './coach.css';

/**
 * "What your data says" on the Coach tab (MM-610), under the one thing to
 * do and above the targets; the safeguards stay above it. It opens on 1d,
 * today so far, and offers 7d to 3m as the data supports each, in an
 * `MmSegmented` as Progress's 30d and 90d (the switcher shows once 7d is
 * supported); leaving the tab brings it back to 1d. Top to bottom: the
 * pointer to the under-eating notice while that finding holds, the
 * switcher, the period line, what is left today (1d), the headline,
 * "Worth changing" and "Holding up" (3 each, never padded), every other
 * finding folded, the hidden ones with the day they show again, and the
 * areas the span cannot judge. With the weight hidden, no finding carries
 * a weight figure (MM-118): none of their words reads one.
 */
export function WhatYourDataSaysSection() {
  const { state } = useApp();
  const analysis = state.coachAnalysis;
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const setup = useLoaded(state.setup);
  const view = useCell(analysis.view);
  // The tab opens on 1d each time: the span chosen is put back when the tab is left.
  useEffect(() => () => analysis.open(), [analysis]);
  if (setup === undefined || view === undefined) return null;
  const fmt = new Fmt(setup.unitSystem, { weightDisplay });
  const { left, headline, worthChanging, holdingUp, more, hidden } = view.sections;
  const item = (finding: CoachFinding) => (
    <CoachFindingItem
      key={finding.id}
      finding={finding}
      fmt={fmt}
      onDismiss={finding.kind === 'left' ? undefined : () => void analysis.dismiss(finding.id)}
    />
  );
  const nothingYet = view.nothingLogged || (view.span === 1 && view.checked.length === 0);
  const nothingFound =
    !nothingYet && left === undefined && worthChanging.length === 0 && holdingUp.length === 0 && more.length === 0;
  return (
    <MmSection framed icon="insight" title={coachAnalysisWords.title}>
      {view.underEating ? (
        <div className="app-stack-item">
          <Notice text={underEatingPointerText(view.underEatingNoticeShown)} />
        </div>
      ) : null}
      {view.spans.includes(7) ? (
        <MmListGroup>
          <MmListRow
            leadingIcon="calendar"
            title={coachAnalysisWords.spanName}
            trailingAction={
              <MmSegmented<AnalysisSpan>
                name={coachAnalysisWords.spanName}
                compact
                segments={view.spans.map((span) => ({ value: span, label: AnalysisSpan.label(span) }))}
                selected={view.span}
                onChange={(chosen) => {
                  if (chosen !== undefined) analysis.choose(chosen);
                }}
              />
            }
          />
        </MmListGroup>
      ) : null}
      <p className="app-caption coach-analysis-period">{coachPeriodText(view)}</p>
      {nothingYet ? <p className="app-text">{coachAnalysisWords.nothingLogged}</p> : null}
      {nothingFound ? <p className="app-text">{nothingFoundText(view.checked)}</p> : null}
      {left === undefined ? null : item(left)}
      {headline === undefined ? null : <p className="app-text coach-analysis-headline">{coachHeadlineText(headline, fmt)}</p>}
      {worthChanging.length === 0 ? null : (
        <div className="coach-analysis-list">
          <SectionLabel text={coachAnalysisWords.worthChanging} />
          {worthChanging.map(item)}
        </div>
      )}
      {holdingUp.length === 0 ? null : (
        <div className="coach-analysis-list">
          <SectionLabel text={coachAnalysisWords.holdingUp} />
          {holdingUp.map(item)}
        </div>
      )}
      {more.length === 0 ? null : <MmDisclosure title={moreFindingsText(more.length)}>{more.map(item)}</MmDisclosure>}
      {hidden.length === 0 ? null : (
        <MmDisclosure title={hiddenFindingsText(hidden)}>
          {hidden.map(({ finding, showsAgainOn }) => (
            <StatRow key={finding.id} label={coachFindingText(finding, fmt)[0]} value={Fmt.shortDay(showsAgainOn)} />
          ))}
        </MmDisclosure>
      )}
      {view.unjudged.length === 0 ? null : (
        <div className="coach-analysis-list">
          <SectionLabel text={coachAnalysisWords.notEnoughData} />
          <ul className="coach-options">
            {view.unjudged.map((area) => (
              <li key={area.area} className="app-text">
                {unjudgedAreaText(area)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </MmSection>
  );
}
