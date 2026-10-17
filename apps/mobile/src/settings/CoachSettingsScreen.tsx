import { useState } from 'react';
import { Screen } from '../app/Screen';
import { useNavigator } from '../app/useNavigator';
import { inlineInsightRules } from '../coach/inlineInsightRules';
import { insightAreaIcon } from '../coach/insightAreaIcon';
import { insightAreaLabel } from '../coach/insightAreaLabel';
import type { InsightArea } from '../domain/InsightArea';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { CoachAreaScreen } from './CoachAreaScreen';
import { InsightSwitchesDraft } from './InsightSwitchesDraft';
import { useInsightSwitches } from './useInsightSwitches';

/** The areas offered; sleep joins once a night of sleep is recorded (MM-250). */
const areas: readonly InsightArea[] = ['food', 'training', 'body', 'water'];

/**
 * Settings > Coach > Coaching insights (MM-364): one switch for every
 * insight under a logged item, then a row for each area that opens its
 * rules. Turning everything off keeps each area's and rule's position, so
 * turning it back on restores them. The dashboard's insight and the safety
 * notices are not switched here.
 */
export function CoachSettingsScreen({ draft }: { draft?: InsightSwitchesDraft }) {
  const navigator = useNavigator();
  const [switches] = useState(() => draft ?? new InsightSwitchesDraft());
  const on = useInsightSwitches(switches);

  const areaState = (area: InsightArea) => {
    if (!on.all) return 'Off while insights are off';
    if (on.offAreas.has(area)) return 'Off';
    const rules = inlineInsightRules.filter((rule) => rule.area === area);
    const offRules = rules.filter((rule) => on.offRules.has(rule.title)).length;
    const kinds = rules.length === 1 ? 'kind' : 'kinds';
    return offRules === 0 ? `On · ${rules.length} ${kinds}` : `On · ${rules.length - offRules} of ${rules.length} ${kinds}`;
  };

  return (
    <Screen title="Coaching insights">
      <MmListGroup>
        <MmSwitchRow
          leadingIcon="insight"
          title="Insights under logged items"
          subtitle="Short insights from the coach under a food, a lift or a reading. The Coach tab works either way."
          value={on.all}
          onChange={(value) => switches.setAll(value)}
        />
      </MmListGroup>
      <MmSection icon="tune" title="By area">
        <MmListGroup>
          {areas.map((area) => (
            <MmListRow
              key={area}
              leadingIcon={insightAreaIcon(area)}
              title={insightAreaLabel(area)}
              subtitle={areaState(area)}
              opens
              onPress={() => void navigator.push(() => <CoachAreaScreen area={area} draft={switches} />)}
            />
          ))}
        </MmListGroup>
      </MmSection>
    </Screen>
  );
}
