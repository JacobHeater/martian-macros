import { useEffect, useId, useRef } from 'react';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { AnalysisSpan } from '../engine/analysis/AnalysisSpan';
import type { CoachFinding } from '../engine/analysis/CoachFinding';
import { findingQuietDays } from '../engine/analysis/findingQuietDays';
import { coachAnalysisWords } from '../format/coachAnalysisWords';
import { coachFindingText } from '../format/coachFindingText';
import { coachHeadlineText } from '../format/coachHeadlineText';
import { coachPeriodText } from '../format/coachPeriodText';
import { Fmt } from '../format/Fmt';
import { hiddenFindingsText } from '../format/hiddenFindingsText';
import { hiddenUntilText } from '../format/hiddenUntilText';
import { moreFindingsText } from '../format/moreFindingsText';
import { nothingFoundText } from '../format/nothingFoundText';
import { showsAgainText } from '../format/showsAgainText';
import { underEatingPointerText } from '../format/underEatingPointerText';
import { unjudgedAreaText } from '../format/unjudgedAreaText';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSegmented } from '../ui/MmSegmented';
import { Notice } from '../ui/Notice';
import { StatRow } from '../ui/StatRow';
import { useOverlays } from '../ui/useOverlays';
import { CoachFindingItem } from './CoachFindingItem';
import './coach.css';

/**
 * "What your data says" on the Coach tab (MM-610), under the one thing to
 * do and above the targets; the safeguards stay above it. It opens on 1d,
 * today so far, and offers 7d to 3m as the data supports each, in an
 * `MmSegmented` under its row's label, as the Goal section's rows hold
 * their controls (MM-291); leaving the tab brings it back to 1d. Top to
 * bottom: the pointer to the under-eating notice while that finding holds,
 * the switcher, the period line (said again when the span changes), the
 * headline, what is left today (1d), "Worth changing" and "Holding up" (3
 * each, never padded), every other finding folded in the same two groups,
 * the hidden ones with the day each shows again, and the areas the span
 * cannot judge. With the weight hidden, no finding carries a weight figure
 * (MM-118): none of their words reads one.
 *
 * Dismissing a finding hides it until the day it shows again, says so in a
 * snack (no undo: the trend log only appends), and moves the focus to the
 * next finding's title, or to the hidden fold when there is none.
 */
export function WhatYourDataSaysSection() {
  const { state } = useApp();
  const overlays = useOverlays();
  const analysis = state.coachAnalysis;
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const today = useCell(state.today);
  const setup = useLoaded(state.setup);
  const view = useCell(analysis.view);
  const base = useId();
  // Where the focus goes once a dismissal has been drawn: a finding's title id, or the hidden fold.
  const focusNext = useRef<string | undefined>(undefined);
  const hiddenFoldId = `${base}-hidden`;
  const titleIdOf = (finding: CoachFinding) => `${base}-${finding.id}`;
  // The tab opens on 1d each time: the span chosen is put back when the tab is left.
  useEffect(() => () => analysis.open(), [analysis]);
  useEffect(() => {
    const target = focusNext.current;
    if (target === undefined) return;
    const fold = document.getElementById(hiddenFoldId)?.querySelector('button') ?? null;
    const into = target === hiddenFoldId ? fold : (document.getElementById(target) ?? fold);
    if (into === null) return;
    focusNext.current = undefined;
    into.focus();
  }, [view, hiddenFoldId]);
  if (setup === undefined || view === undefined) return null;
  const fmt = new Fmt(setup.unitSystem, { weightDisplay });
  const { left, headline, worthChanging, holdingUp, more, hidden } = view.sections;
  const moreFixes = more.filter((f) => f.kind !== 'holdingUp');
  const moreHolding = more.filter((f) => f.kind === 'holdingUp');
  // In the order they are drawn, so the one after a dismissed finding is the next a reader meets.
  const order = [...worthChanging, ...holdingUp, ...moreFixes, ...moreHolding];
  const dismiss = (finding: CoachFinding) => {
    const next = order[order.findIndex((f) => f.id === finding.id) + 1];
    focusNext.current = next === undefined ? hiddenFoldId : titleIdOf(next);
    void analysis.dismiss(finding.id).then(() => overlays.snack(hiddenUntilText(today.addDays(findingQuietDays))));
  };
  const item = (level: 3 | 4) => (finding: CoachFinding) => (
    <CoachFindingItem
      key={finding.id}
      finding={finding}
      fmt={fmt}
      level={level}
      titleId={titleIdOf(finding)}
      onDismiss={finding.kind === 'left' ? undefined : () => dismiss(finding)}
    />
  );
  const group = (label: string, findings: readonly CoachFinding[]) =>
    findings.length === 0 ? null : (
      <div className="coach-analysis-list">
        <h3 className="coach-options-label">{label}</h3>
        {findings.map(item(4))}
      </div>
    );
  const nothingEver = view.nothingLogged;
  // History, but nothing logged today: 1d says so, with what is left at the whole of today's targets (MM-612).
  const nothingToday = !nothingEver && view.span === 1 && view.checked.length === 0;
  const nothingFound =
    !nothingEver &&
    !nothingToday &&
    left === undefined &&
    worthChanging.length === 0 &&
    holdingUp.length === 0 &&
    more.length === 0;
  return (
    <MmSection framed icon="insight" title={coachAnalysisWords.title}>
      {view.underEating ? (
        <div className="app-stack-item">
          <Notice text={underEatingPointerText(view.underEatingNoticeShown)} />
        </div>
      ) : null}
      {view.spans.includes(7) ? (
        <MmListRow
          leadingIcon="calendar"
          title={coachAnalysisWords.spanName}
          flush
          entry={
            <div className="coach-analysis-spans">
              <MmSegmented<AnalysisSpan>
                name={coachAnalysisWords.spanName}
                segments={view.spans.map((span) => ({ value: span, label: AnalysisSpan.label(span) }))}
                selected={view.span}
                onChange={(chosen) => {
                  if (chosen !== undefined) analysis.choose(chosen);
                }}
              />
            </div>
          }
        />
      ) : null}
      <p className="app-caption coach-analysis-period" aria-live="polite">
        {coachPeriodText(view)}
      </p>
      {headline === undefined ? null : <p className="app-text coach-analysis-headline">{coachHeadlineText(headline)}</p>}
      {nothingEver ? <p className="app-text">{coachAnalysisWords.nothingLogged}</p> : null}
      {nothingToday ? (
        <p className="app-text">
          {view.spans.includes(7) ? `${coachAnalysisWords.nothingToday} ${coachAnalysisWords.weekReads}` : coachAnalysisWords.nothingToday}
        </p>
      ) : null}
      {nothingFound ? <p className="app-text">{nothingFoundText(view.checked)}</p> : null}
      {left === undefined || nothingEver ? null : item(3)(left)}
      {group(coachAnalysisWords.worthChanging, worthChanging)}
      {group(coachAnalysisWords.holdingUp, holdingUp)}
      {more.length === 0 ? null : (
        <MmDisclosure title={moreFindingsText(more.length)}>
          {group(coachAnalysisWords.worthChanging, moreFixes)}
          {group(coachAnalysisWords.holdingUp, moreHolding)}
        </MmDisclosure>
      )}
      {hidden.length === 0 ? null : (
        <div id={hiddenFoldId}>
          <MmDisclosure title={hiddenFindingsText(hidden)}>
            {hidden.map(({ finding, showsAgainOn }) => (
              <StatRow key={finding.id} label={coachFindingText(finding, fmt)[0]} value={showsAgainText(showsAgainOn)} />
            ))}
          </MmDisclosure>
        </div>
      )}
      {view.unjudged.length === 0 ? null : (
        <div className="coach-analysis-list">
          <h3 className="coach-options-label">{coachAnalysisWords.notEnoughData}</h3>
          <ul className="coach-options">
            {view.unjudged.map((area) => (
              <li key={area.area} className="app-caption">
                {unjudgedAreaText(area)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </MmSection>
  );
}
