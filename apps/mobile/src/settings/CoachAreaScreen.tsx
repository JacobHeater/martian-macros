import { useEffect, useRef } from 'react';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { insightAreaIcon } from '../coach/insightAreaIcon';
import { insightAreaLabel } from '../coach/insightAreaLabel';
import { useInsightKinds } from '../coach/useInsightKinds';
import type { InsightArea } from '../domain/InsightArea';
import { InsightSwitches } from '../domain/InsightSwitches';
import { ItemInsightKind } from '../engine/ItemInsightKind';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSwitchRow } from '../ui/MmSwitchRow';
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
 * came from is named, brought into view and given the focus.
 */
export function CoachAreaScreen({ area, focus }: CoachAreaScreenProps) {
  const { services, state } = useApp();
  const kinds = useInsightKinds();
  const on = useLoaded(state.insightSwitches) ?? InsightSwitches.allOn;
  const safeguards = useCell(state.insightSafeguards);
  const focused = useRef<HTMLDivElement>(null);
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
          {kinds
            .filter((kind) => kind.area === area)
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
    </Screen>
  );
}
