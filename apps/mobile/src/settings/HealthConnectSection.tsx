import { useState } from 'react';
import { HealthDataType } from '../healthIngest/HealthDataType';
import type { HealthSample } from '../healthIngest/HealthSample';
import { healthSourceName } from '../healthIngest/healthSourceName';
import { healthDataTypeLabel } from '../format/healthDataTypeLabel';
import { healthDataTypePurpose } from '../format/healthDataTypePurpose';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmIcon } from '../ui/MmIcon';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { useOverlays } from '../ui/useOverlays';
import { healthDataTypeIcon } from './healthDataTypeIcon';

function count(samples: readonly HealthSample[]): string {
  if (samples.length === 0) return 'Allowed. Nothing to read yet.';
  // A source the platform did not name is counted, never shown by its package id (MM-395).
  const sources = [...new Set(samples.flatMap((sample) => healthSourceName(sample) ?? []))];
  const readings = samples.length === 1 ? '1 reading' : `${samples.length} readings`;
  return sources.length === 0 ? `Allowed. ${readings}.` : `Allowed. ${readings} from ${sources.join(', ')}.`;
}

/**
 * The Health Connect section of Settings (MM-68), laid out as Reminders is
 * (MM-320, rule 9): one card of rows, a row for each kind of reading with
 * what it is for and "Read from Health Connect now" last, and the note as a
 * caption under the card. Connecting is offered, never required: each kind
 * is allowed by itself, and refusing one does not block the others. The
 * app only reads.
 */
export function HealthConnectSection() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const connection = useLoaded(state.healthConnection);
  const setup = useLoaded(state.setup);
  const [reading, setReading] = useState(false);
  if (connection === undefined || setup === undefined) return null;
  if (connection.available.size === 0) {
    return (
      <MmSection icon="health" title="Health Connect">
        <MmListGroup>
          <MmListRow
            leadingIcon="sync"
            title="Health Connect is not on this phone"
            subtitle="Nothing to connect. Everything in the app works without it."
          />
        </MmListGroup>
      </MmSection>
    );
  }

  /**
   * Reads every allowed kind. A platform that cannot be read just now
   * leaves what is kept as it was, and says so.
   */
  const read = async (allowed?: HealthDataType): Promise<boolean> => {
    if (await state.syncHealth()) return true;
    // An allowing whose first read fails still says it was allowed (the panel's UX-11).
    const first = allowed === undefined ? 'Health Connect' : `${healthDataTypeLabel(allowed)} allowed, but Health Connect`;
    overlays.snack(`${first} could not be read just now. Nothing was changed.`);
    return false;
  };

  /** The row pressed: busy while it reads, then says it is done (the panel's UX-6). */
  const readNow = async () => {
    setReading(true);
    try {
      if (await read()) overlays.snack('Read from Health Connect. Everything allowed is up to date.');
    } finally {
      setReading(false);
    }
  };

  const allow = async (type: HealthDataType) => {
    const after = await services.healthSource.requestPermission(new Set([type]));
    state.refreshHealthConnection();
    if (after.has(type)) {
      // The row stops being a button, so what happened is said (the panel's UX-3).
      if (await read(type)) overlays.snack(`${healthDataTypeLabel(type)} allowed.`);
    } else {
      overlays.snack(
        `${healthDataTypeLabel(type)} was not allowed. You can allow it here, or in Health Connect, whenever you like.`,
      );
    }
  };

  const offered = HealthDataType.values.filter(
    (type) =>
      connection.available.has(type) &&
      // Asked for only where it applies (MM-68).
      (type !== 'menstruation' || setup.profile.sex === 'female'),
  );
  return (
    <MmSection icon="health" title="Health Connect">
      <MmListGroup>
        {offered.map((type) => {
          const permitted = connection.permitted.has(type);
          return (
            <MmListRow
              key={type}
              leadingIcon={healthDataTypeIcon[type]}
              title={healthDataTypeLabel(type)}
              subtitle={
                permitted ? count(connection.imported.get(type) ?? []) : `Not allowed. ${healthDataTypePurpose(type)}`
              }
              // The subtitle says "Allowed"; the check is not heard twice (the panel's UX-7).
              trailing={permitted ? <MmIcon name="check" /> : undefined}
              opens={!permitted}
              onPress={permitted ? undefined : () => void allow(type)}
            />
          );
        })}
        {connection.permitted.size === 0 ? null : (
          <MmListRow
            leadingIcon="sync"
            title="Read from Health Connect now"
            subtitle={reading ? 'Reading…' : undefined}
            // Stays a button while it reads, so focus stays on it; a second press waits for the first.
            onPress={() => {
              if (!reading) void readNow();
            }}
          />
        )}
      </MmListGroup>
      <p className="app-caption settings-note">
        The app only reads. Nothing is written to your health data, and nothing read leaves this phone. One weigh-in
        counts for a day: the first of the morning, or the middle of the day’s readings. A value you type for a day is
        used instead. To stop, take the permission away in Health Connect: what was read is kept until you erase your
        data.
      </p>
    </MmSection>
  );
}
