import type { Fmt } from '../format/Fmt';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import type { WeightFromHealth } from './WeightFromHealth';

interface WeightFromHealthRowsProps {
  health: WeightFromHealth;
  fmt: Fmt;
}

/** The offer under the weight: allow reading it, then use today's weigh-in (MM-68, MM-73). */
export function WeightFromHealthRows({ health, fmt }: WeightFromHealthRowsProps) {
  const { platform, allowed, reading, today, used } = health;
  if (!allowed) {
    return (
      <MmListGroup>
        <MmListRow
          leadingIcon="health"
          title={`Read weight from ${platform}`}
          subtitle="Optional. Your scale’s weigh-ins, with up to a year of them for the trend. Other kinds can be allowed in Settings."
          opens
          onPress={health.onAllow}
        />
      </MmListGroup>
    );
  }
  if (today !== undefined) {
    if (used) return null;
    return (
      <MmListGroup>
        <MmListRow
          leadingIcon="scale"
          title={`Use ${fmt.weight(today.kg)}`}
          subtitle={`Today’s weigh-in from ${today.sourceName === '' ? platform : today.sourceName}, in ${platform}.`}
          onPress={health.onUse}
        />
      </MmListGroup>
    );
  }
  return (
    <MmListGroup>
      <MmListRow
        leadingIcon="sync"
        title={reading ? `Reading ${platform}…` : `No weigh-in in ${platform} today`}
        subtitle={reading ? undefined : 'Type today’s weight above. Earlier weigh-ins still fill in the trend.'}
      />
    </MmListGroup>
  );
}
