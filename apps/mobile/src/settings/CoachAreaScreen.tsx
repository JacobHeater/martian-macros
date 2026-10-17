import { useEffect, useRef, useState } from 'react';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { inlineInsightRules } from '../coach/inlineInsightRules';
import { insightAreaIcon } from '../coach/insightAreaIcon';
import { insightAreaLabel } from '../coach/insightAreaLabel';
import type { InsightArea } from '../domain/InsightArea';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { InsightSwitchesDraft } from './InsightSwitchesDraft';
import { useInsightSwitches } from './useInsightSwitches';
import './settings.css';

interface CoachAreaScreenProps {
  area: InsightArea;
  /** The kind to bring into view, when opened from one of its insights. */
  focus?: string | undefined;
  /** The switches shared with Settings > Coach; its own when opened from an insight. */
  draft?: InsightSwitchesDraft;
}

/**
 * One area of Settings > Coach (MM-364): the area's switch, saying when
 * it or everything is off, then every kind of insight of the area with
 * its own switch, its title and an example. A kind left out for the
 * person's health answers is listed as such, with no switch: it is never
 * offered as something to turn on. Opened from an insight, the kind it
 * came from is named, brought into view and given the focus.
 */
export function CoachAreaScreen({ area, focus, draft }: CoachAreaScreenProps) {
  const { state } = useApp();
  const setup = useLoaded(state.setup);
  const [switches] = useState(() => draft ?? new InsightSwitchesDraft());
  const on = useInsightSwitches(switches);
  const focused = useRef<HTMLDivElement>(null);
  const label = insightAreaLabel(area);
  const eatingDisorderHistory = setup?.screening.eatingDisorderHistory === true;
  const areaOn = !on.offAreas.has(area);

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
          onChange={(value) => switches.setArea(area, value)}
        />
      </MmListGroup>
      <MmSection icon="insight" title="Kinds of insight">
        <MmListGroup>
          {inlineInsightRules
            .filter((rule) => rule.area === area)
            .map((rule) => {
              const opened = rule.title === focus;
              // Named in the row's own words, so a screen reader hears it with the switch (the panel's UX-12).
              const said = (text: string) => (opened ? `The insight you opened is this kind. ${text}` : text);
              const row =
                eatingDisorderHistory && rule.notWithEatingDisorderHistory === true ? (
                  <MmListRow title={rule.title} subtitle={said('Not shown for your health answers.')} />
                ) : (
                  <MmSwitchRow
                    title={rule.title}
                    subtitle={said(`“${rule.example}”`)}
                    value={!on.offRules.has(rule.title)}
                    onChange={(value) => switches.setRule(rule.title, value)}
                  />
                );
              return opened ? (
                <div key={rule.title} ref={focused} className="settings-focused-rule">
                  {row}
                </div>
              ) : (
                <div key={rule.title}>{row}</div>
              );
            })}
        </MmListGroup>
      </MmSection>
    </Screen>
  );
}
