import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { insightAreaIcon } from '../coach/insightAreaIcon';
import { insightAreaLabel } from '../coach/insightAreaLabel';
import { useInsightKinds } from '../coach/useInsightKinds';
import { InsightArea } from '../domain/InsightArea';
import { InsightSwitches } from '../domain/InsightSwitches';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { CoachAreaScreen } from './CoachAreaScreen';

/**
 * Settings > Coach > Coaching insights (MM-364): one switch for every
 * insight under a logged item, then a row for each area that has kinds of
 * insight, opening its kinds. Turning everything off keeps each area's and
 * kind's position, so turning it back on restores them. The dashboard's
 * insight and the safety notices are not switched here.
 */
export function CoachSettingsScreen() {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const kinds = useInsightKinds();
  const on = useLoaded(state.insightSwitches) ?? InsightSwitches.allOn;
  const areas = InsightArea.values.filter((area) => kinds.some((kind) => kind.area === area));
  const save = (switches: InsightSwitches) => void services.preferences.saveInsightSwitches(switches);

  const areaState = (area: InsightArea) => {
    if (!on.all) return 'Off while insights are off';
    if (on.offAreas.has(area)) return 'Off';
    const ofArea = kinds.filter((kind) => kind.area === area);
    const offKinds = ofArea.filter((kind) => on.offKinds.has(kind.id)).length;
    const word = ofArea.length === 1 ? 'kind' : 'kinds';
    return offKinds === 0 ? `On · ${ofArea.length} ${word}` : `On · ${ofArea.length - offKinds} of ${ofArea.length} ${word}`;
  };

  return (
    <Screen title="Coaching insights">
      <MmListGroup>
        <MmSwitchRow
          leadingIcon="insight"
          title="Insights under logged items"
          subtitle="Short insights from the coach under a food, a lift or a reading. The Coach tab works either way."
          value={on.all}
          onChange={(value) => save(InsightSwitches.withAll(on, value))}
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
              onPress={() => void navigator.push(() => <CoachAreaScreen area={area} />)}
            />
          ))}
        </MmListGroup>
      </MmSection>
    </Screen>
  );
}
