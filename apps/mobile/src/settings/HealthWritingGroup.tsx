import { useEffect, useState } from 'react';
import { HealthWriteKind } from '../healthIngest/HealthWriteKind';
import { healthPlatformName } from '../format/healthPlatformName';
import { useApp } from '../app/useApp';
import type { MmIconName } from '../ui/MmIconName';
import { MmListGroup } from '../ui/MmListGroup';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { useOverlays } from '../ui/useOverlays';

/** What each kind is, as a snack names it. */
const named: Record<HealthWriteKind, string> = {
  food: 'Food you log',
  water: 'Water you log',
  workouts: 'Workouts you finish',
};

/** Where an iPhone's owner allows what an app writes to Apple Health: Apple asks only once. */
const healthPath = 'Settings, Health, Data Access & Devices';

const icon: Record<HealthWriteKind, MmIconName> = {
  food: 'food',
  water: 'water',
  workouts: 'train',
};

/** What each switch writes, said the same whether it is on or off. */
function what(kind: HealthWriteKind, { ios, name }: { ios: boolean; name: string }): string {
  switch (kind) {
    case 'food':
      return `Each food with its calories and macros, at its meal. Changed or removed in ${name} too.`;
    case 'water':
      return `Each drink at the time you logged it. Removed in ${name} too.`;
    case 'workouts':
      return ios
        ? 'Each finished workout, as a strength workout.'
        : 'Each finished workout, as strength training with its timed sets.';
  }
}

/**
 * The health platform's writing switches in Settings (MM-70, MM-314,
 * MM-489), a card of its own under the reading rows, built as Nutrition
 * goals' switches are (rule 9). Each is off until turned on, and turning
 * one on asks the platform for that kind's write permission alone; refused,
 * it stays off and says so. Turning one off writes nothing more and leaves
 * what was written where it is. The plugin keeps which are on.
 */
export function HealthWritingGroup() {
  const { services } = useApp();
  const overlays = useOverlays();
  const [writing, setWriting] = useState<ReadonlySet<HealthWriteKind> | undefined>(undefined);
  // A kind being asked about waits for its answer: a second press does nothing.
  const [asking, setAsking] = useState<ReadonlySet<HealthWriteKind>>(new Set());
  const name = healthPlatformName(services.platform);
  const ios = services.platform === 'ios';

  useEffect(() => {
    let live = true;
    void services.healthWriting.writing().then((kinds) => {
      if (live) setWriting(kinds);
    });
    return () => {
      live = false;
    };
  }, [services]);

  if (writing === undefined) return null;

  const turn = async (kind: HealthWriteKind, on: boolean) => {
    if (asking.has(kind)) return;
    setAsking((now) => new Set([...now, kind]));
    try {
      if (on) {
        const started = await services.healthWriting.startWriting(kind);
        setWriting(await services.healthWriting.writing());
        // Apple Health asks only once; after that it is allowed in the phone's settings (the panel's UX finding).
        const where = ios ? `To allow it, open ${healthPath}.` : `You can allow it here, or in ${name}.`;
        overlays.snack(
          started
            ? `${named[kind]} from now on is sent to ${name}.`
            : `Sending to ${name} was not allowed, so nothing is sent. ${where}`,
        );
        return;
      }
      await services.healthWriting.stopWriting(kind);
      setWriting(await services.healthWriting.writing());
      overlays.snack(`Sending ${named[kind].toLowerCase()} to ${name} is off. What was sent stays there.`);
    } finally {
      setAsking((now) => new Set([...now].filter((k) => k !== kind)));
    }
  };

  return (
    <MmListGroup>
      {HealthWriteKind.values.map((kind) => (
        <MmSwitchRow
          key={kind}
          leadingIcon={icon[kind]}
          title={`Send ${named[kind].toLowerCase()} to ${name}`}
          subtitle={what(kind, { ios, name })}
          value={writing.has(kind)}
          onChange={(on) => void turn(kind, on)}
        />
      ))}
    </MmListGroup>
  );
}
