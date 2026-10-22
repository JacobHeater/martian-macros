import { useState } from 'react';
import { HealthDataType } from '../healthIngest/HealthDataType';
import type { HealthSample } from '../healthIngest/HealthSample';
import { HealthBackfill } from '../healthIngest/HealthBackfill';
import { healthSourceName } from '../healthIngest/healthSourceName';
import { healthDataTypeLabel } from '../format/healthDataTypeLabel';
import { healthDataTypePurpose } from '../format/healthDataTypePurpose';
import { healthPlatformName } from '../format/healthPlatformName';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmIcon } from '../ui/MmIcon';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { useOverlays } from '../ui/useOverlays';
import { healthDataTypeIcon } from './healthDataTypeIcon';
import { HealthWritingGroup } from './HealthWritingGroup';
import { PrimaryScaleRow } from './PrimaryScaleRow';
import { useOpenHealthPermissions } from './useOpenHealthPermissions';
import { WeighInWindowRow } from './WeighInWindowRow';
import { useSettingsSection } from './useSettingsSection';

/**
 * Where an iPhone's owner allows, checks or withdraws what an app reads
 * from Apple Health: the route Apple documents, said the same way wherever
 * the app names it (MM-69, the panel's F1), since Apple Health does not
 * tell the app which kinds were allowed.
 */
const healthPath = 'Settings, Health, Data Access & Devices';

/** The row's and the snack's one sentence for a kind asked for with nothing found. */
const whereToCheck = `To allow it, or to check, open ${healthPath}.`;

function count(samples: readonly HealthSample[], { name, ios }: { name: string; ios: boolean }): string {
  // Apple Health never says a kind was refused: nothing found may be nothing shared (MM-69).
  if (samples.length === 0) return ios ? `Nothing found in ${name} yet. ${whereToCheck}` : 'Allowed. Nothing to read yet.';
  // A source the platform did not name is counted, never shown by its package id (MM-395).
  const sources = [...new Set(samples.flatMap((sample) => healthSourceName(sample) ?? []))];
  const readings = samples.length === 1 ? '1 reading' : `${samples.length} readings`;
  const counted = sources.length === 0 ? `${readings}.` : `${readings} from ${sources.join(', ')}.`;
  return ios ? counted : `Allowed. ${counted}`;
}

/**
 * The health platform's section of Settings (MM-68, MM-69), laid out as
 * Reminders is (MM-320, rule 9): one card of rows, a row for each kind of
 * reading with what it is for and "Read from … now" last, and the note as a
 * caption under the card. Connecting is offered, never required: each kind
 * is allowed by itself, and refusing one does not block the others.
 * Writing is a card of switches of its own under the rows (MM-70, MM-314,
 * MM-489), each asked for apart from reading.
 *
 * On Android the platform is Health Connect and says which kinds are
 * allowed. On an iPhone it is Apple Health, which never tells an app that
 * reading a kind was refused: a kind asked for counts as connected, and a
 * row says what was read or that nothing was found yet and where to check.
 */
export function HealthPlatformSection() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const connection = useLoaded(state.healthConnection);
  const setup = useLoaded(state.setup);
  const [reading, setReading] = useState(false);
  // Folds like every other section (MM-398); dropped once and found by the panel (MM-407).
  const fold = useSettingsSection('healthConnect');
  const openPermissions = useOpenHealthPermissions();
  const ios = services.platform === 'ios';
  const name = healthPlatformName(services.platform);
  if (connection === undefined || setup === undefined) return null;
  if (connection.available.size === 0) {
    return (
      <MmSection icon="health" title={name} {...fold}>
        <MmListGroup>
          <MmListRow
            leadingIcon="sync"
            title={`${name} is not on this phone`}
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
    if (await state.syncHealth('asked')) return true;
    // An allowing whose first read fails still says it was allowed (the panel's UX-11).
    const first = allowed === undefined ? name : `${healthDataTypeLabel(allowed)} ${ios ? 'asked for' : 'allowed'}, but ${name}`;
    overlays.snack(`${first} could not be read just now. Nothing was changed.`);
    return false;
  };

  /** The row pressed: busy while it reads, then says it is done (the panel's UX-6). */
  const readNow = async () => {
    setReading(true);
    try {
      // On an iPhone what was asked for is all the app knows of (MM-69, the panel's F3).
      if (await read()) overlays.snack(`Read from ${name}. Everything ${ios ? 'asked for' : 'allowed'} is up to date.`);
    } finally {
      setReading(false);
    }
  };

  const allow = async (type: HealthDataType) => {
    const after = await services.healthSource.requestPermission(new Set([type]));
    state.refreshHealthConnection();
    const label = healthDataTypeLabel(type);
    if (!after.has(type)) {
      // Refused more than twice, Health Connect stops showing the request: "here" would be a circle (MM-323).
      if (await services.healthSource.stoppedAsking(type)) {
        overlays.snack(`${name} no longer asks for ${label.toLowerCase()} here. You can allow it in ${name} instead.`, {
          label: `Open ${name}`,
          onAction: () => void openPermissions(type),
        });
        return;
      }
      overlays.snack(`${label} was not allowed. You can allow it here, or in ${name}, whenever you like.`);
      return;
    }
    // The history is asked for with the first kind it is read for, and only
    // then (MM-73). Refused, the window the platform allows is read and
    // nothing more is said about it.
    if (HealthBackfill.types.includes(type)) await services.healthSource.requestHistory().catch(() => false);
    // The row stops being a button, so what happened is said (the panel's UX-3).
    if (!(await read(type))) return;
    if (!ios) {
      overlays.snack(`${label} allowed.`);
      return;
    }
    // Apple Health has been asked; only readings prove it was allowed (MM-69).
    const found = (await services.healthSamples.samples(type)).length > 0;
    overlays.snack(found ? `${label} read from ${name}.` : `Nothing found in ${name} for ${label} yet. ${whereToCheck}`);
  };

  const offered = HealthDataType.values.filter(
    (type) =>
      connection.available.has(type) &&
      // Asked for only where it applies (MM-68).
      (type !== 'menstruation' || setup.profile.sex === 'female'),
  );
  return (
    <MmSection icon="health" title={name} {...fold}>
      <MmListGroup>
        {offered.map((type) => {
          const permitted = connection.permitted.has(type);
          const samples = connection.imported.get(type) ?? [];
          return (
            <MmListRow
              key={type}
              leadingIcon={healthDataTypeIcon[type]}
              title={healthDataTypeLabel(type)}
              subtitle={
                permitted
                  ? count(samples, { name, ios })
                  : `${ios ? 'Not asked yet' : 'Not allowed'}. ${healthDataTypePurpose(type)}`
              }
              // The subtitle says "Allowed"; the check is not heard twice (the panel's UX-7).
              // On an iPhone the check stands only for a kind that was read, since nothing else proves it was allowed.
              trailing={permitted && (!ios || samples.length > 0) ? <MmIcon name="check" /> : undefined}
              opens={!permitted}
              onPress={permitted ? undefined : () => void allow(type)}
            />
          );
        })}
        {/* Which scale counts first, once weigh-ins come from more than one (MM-71). */}
        {connection.permitted.has('weight') ? <PrimaryScaleRow weighIns={connection.imported.get('weight') ?? []} /> : null}
        {/* The hours in which an imported reading counts as the morning weigh-in (MM-441). */}
        {connection.permitted.has('weight') ? <WeighInWindowRow /> : null}
        {connection.permitted.size === 0 ? null : (
          <MmListRow
            leadingIcon="sync"
            title={`Read from ${name} now`}
            subtitle={reading ? 'Reading…' : undefined}
            // Stays a button while it reads, so focus stays on it; a second press waits for the first.
            onPress={() => {
              if (!reading) void readNow();
            }}
          />
        )}
      </MmListGroup>
      {/* Writing, each kind by itself and apart from reading (MM-70, MM-314, MM-489). */}
      <HealthWritingGroup />
      <p className="app-caption settings-note">
        Nothing read leaves this phone. The app writes to {name} only what you turn on above, from what you log here,
        and changes or removes only what it wrote. One weigh-in counts for a day: the first of the morning, or the middle
        of the day’s readings, from your primary scale when it weighed you that day. A value you type for a day is used
        instead. To stop reading, take the permission away in {ios ? healthPath : name}: what was read is kept until you
        erase your data.
      </p>
    </MmSection>
  );
}
