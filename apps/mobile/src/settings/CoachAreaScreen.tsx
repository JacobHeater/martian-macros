import { useEffect, useRef } from 'react';
import { focusNeighbourOf } from '../ui/focusNeighbourOf';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { Fmt } from '../format/Fmt';
import { insightAreaIcon } from '../coach/insightAreaIcon';
import { insightAreaLabel } from '../coach/insightAreaLabel';
import { useInsightKinds } from '../coach/useInsightKinds';
import type { InsightArea } from '../domain/InsightArea';
import { InsightSwitches } from '../domain/InsightSwitches';
import { InsightSnooze } from '../engine/InsightSnooze';
import { ItemInsightKind } from '../engine/ItemInsightKind';
import { MmButton } from '../ui/MmButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { useOverlays } from '../ui/useOverlays';
import './settings.css';

interface CoachAreaScreenProps {
  area: InsightArea;
  /** The title of the kind to bring into view, when opened from one of its insights. */
  focus?: string | undefined;
}

/**
 * One area of Settings > Coach (MM-364): the area's switch, saying when
 * it or everything is off, then every kind of insight of the area with
 * its own switch, its title and an example. A kind left out for the
 * person's health answers is listed as such, with no switch: it is never
 * offered as something to turn on. Opened from an insight, the kind it
 * came from is named, brought into view and given the focus. What is
 * snoozed in the area is listed last, each with the way to turn it back on
 * (MM-378).
 */
export function CoachAreaScreen({ area, focus }: CoachAreaScreenProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const kinds = useInsightKinds();
  const on = useLoaded(state.insightSwitches) ?? InsightSwitches.allOn;
  const safeguards = useCell(state.insightSafeguards);
  const today = useCell(state.today);
  const ofArea = kinds.filter((kind) => kind.area === area);
  // Snoozes of this area's kinds that are still quiet; one that has run out is not shown.
  const snoozed = (useLoaded(state.insightSnoozes) ?? []).filter((s) => {
    const kind = ofArea.find((k) => k.id === s.kind);
    if (kind === undefined || !InsightSnooze.quietOn(s, today)) return false;
    // A kind withheld for the person's health answers could not show, so its snooze is not offered to turn back on (the guard's UX-6).
    return safeguards === undefined || !ItemInsightKind.withheld(kind, safeguards);
  });
  const focused = useRef<HTMLDivElement>(null);
  const snoozedList = useRef<HTMLDivElement>(null);
  const label = insightAreaLabel(area);
  const areaOn = !on.offAreas.has(area);
  const save = (switches: InsightSwitches) => void services.preferences.saveInsightSwitches(switches);

  // The kind an insight opened is brought into view with the focus on its switch (a test's document has no scrolling).
  useEffect(() => {
    const kind = focused.current;
    if (kind === null) return;
    if (typeof kind.scrollIntoView === 'function') kind.scrollIntoView({ block: 'center' });
    kind.querySelector<HTMLElement>('input')?.focus({ preventScroll: true });
  }, []);

  let areaState = 'Insights under the items they are about.';
  if (!on.all) areaState = 'Off while all insights are off. What you choose here is kept for when they are back on.';
  else if (!areaOn) areaState = 'Off. The kinds below take effect when this is on.';

  return (
    <Screen title={`${label} insights`}>
      <MmListGroup>
        <MmSwitchRow
          leadingIcon={insightAreaIcon(area)}
          title={`${label} insights`}
          subtitle={areaState}
          value={areaOn}
          onChange={(value) => save(InsightSwitches.withArea(on, area, value))}
        />
      </MmListGroup>
      <MmSection icon="insight" title="Kinds of insight">
        <MmListGroup>
          {ofArea
            .map((kind) => {
              const opened = kind.title === focus;
              // Named in the row's own words, so a screen reader hears it with the switch (the panel's UX-12).
              const said = (text: string) => (opened ? `The insight you opened is this kind. ${text}` : text);
              const row =
                safeguards !== undefined && ItemInsightKind.withheld(kind, safeguards) ? (
                  <MmListRow title={kind.title} subtitle={said('Not shown for your health answers.')} />
                ) : (
                  <MmSwitchRow
                    title={kind.title}
                    subtitle={said(`“${kind.example}”`)}
                    value={!on.offKinds.has(kind.id)}
                    onChange={(value) => save(InsightSwitches.withKind(on, kind.id, value))}
                  />
                );
              return opened ? (
                <div key={kind.id} ref={focused} className="settings-focused-rule">
                  {row}
                </div>
              ) : (
                <div key={kind.id}>{row}</div>
              );
            })}
        </MmListGroup>
      </MmSection>
      {snoozed.length === 0 ? null : (
        <div ref={snoozedList}>
        <MmSection icon="pause" title="Snoozed">
          <MmListGroup>
            {snoozed.map((s) => (
              <MmListRow
                key={InsightSnooze.key(s.kind, s.subject)}
                title={ofArea.find((kind) => kind.id === s.kind)?.title ?? s.kind}
                subtitle={`${s.item} · ${s.resumesOn === undefined ? 'until turned back on' : `until ${Fmt.shortDay(s.resumesOn)}`}`}
                trailingAction={
                  <MmButton
                    label="Turn back on"
                    name={`Turn back on ${ofArea.find((kind) => kind.id === s.kind)?.title ?? s.kind} for ${s.item}`}
                    kind="text"
                    onPress={() => {
                      // The row is about to go, and the focus with it: it moves to what is left (MM-379).
                      focusNeighbourOf(snoozedList.current);
                      void services.insightSnoozes.removeInsightSnooze(s.kind, s.subject);
                      overlays.snack(`${ofArea.find((kind) => kind.id === s.kind)?.title ?? s.kind} is back on for ${s.item}`, {
                        label: 'Undo',
                        onAction: () => void services.insightSnoozes.saveInsightSnooze(s),
                      });
                    }}
                  />
                }
              />
            ))}
          </MmListGroup>
        </MmSection>
        </div>
      )}
    </Screen>
  );
}
