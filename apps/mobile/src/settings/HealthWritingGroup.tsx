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
  weight: 'Weight you type',
  workouts: 'Workouts you finish',
};

/** What was sent of each kind, as the question about removing it names it (MM-514). */
const sent: Record<HealthWriteKind, string> = {
  food: 'the food',
  water: 'the water',
  weight: 'the weigh-ins',
  workouts: 'the workouts',
};

/** Where an iPhone's owner allows what an app writes to Apple Health: Apple asks only once. */
const healthPath = 'Settings, Health, Data Access & Devices';

const icon: Record<HealthWriteKind, MmIconName> = {
  food: 'food',
  water: 'water',
  weight: 'scale',
  workouts: 'train',
};

/** What each switch writes, said the same whether it is on or off. */
function what(kind: HealthWriteKind, { ios, name }: { ios: boolean; name: string }): string {
  switch (kind) {
    case 'food':
      return `Each food with its calories and macros, at its meal. Changed or removed in ${name} too.`;
    case 'water':
      return `Each drink at the time you logged it. Removed in ${name} too.`;
    case 'weight':
      return `Each weigh-in you type, on its day. Changed or removed in ${name} too.`;
    case 'workouts':
      return ios
        ? 'Each finished workout, as a strength workout.'
        : 'Each finished workout, as strength training with its timed sets.';
  }
}

/**
 * The health platform's writing switches in Settings (MM-70, MM-314,
 * MM-513, MM-489), a card of its own under the reading rows, built as
 * Nutrition goals' switches are (rule 9). Each is off until turned on, and
 * turning one on asks the platform for that kind's write permission alone;
 * refused, it stays off and says so. Turning one off writes nothing more,
 * then asks once whether to keep or remove what the app wrote of that kind
 * (MM-514), with keeping the safe choice, as every confirmation in the app
 * is (MM-280). The plugin keeps which are on.
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
      const off = `Sending ${named[kind].toLowerCase()} to ${name} is off.`;
      const remove = await overlays.confirm({
        title: `Remove ${sent[kind]} already sent?`,
        message: `Nothing more is sent. You can keep what Martian Macros sent to ${name}, or remove it there. Nothing another app wrote is touched.`,
        confirmLabel: 'Remove',
        cancelLabel: 'Keep',
      });
      if (!remove) {
        overlays.snack(`${off} What was sent stays there.`);
        return;
      }
      overlays.snack(
        (await services.healthWriting.removeWritten(kind))
          ? `${off} What was sent is removed from ${name}.`
          : `${off} What was sent could not be removed. You can remove it in ${name}.`,
      );
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
