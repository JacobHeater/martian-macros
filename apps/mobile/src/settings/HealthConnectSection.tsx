import { HealthDataType } from '../healthIngest/HealthDataType';
import type { HealthSample } from '../healthIngest/HealthSample';
import { healthDataTypeLabel } from '../format/healthDataTypeLabel';
import { healthDataTypePurpose } from '../format/healthDataTypePurpose';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { GroupHeader } from '../ui/GroupHeader';
import { MmButton } from '../ui/MmButton';
import { MmIcon } from '../ui/MmIcon';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';

function count(samples: readonly HealthSample[]): string {
  if (samples.length === 0) return 'Allowed. Nothing to read yet.';
  const sources = [...new Set(samples.map((sample) => sample.sourceName))];
  const readings = samples.length === 1 ? '1 reading' : `${samples.length} readings`;
  return `Allowed. ${readings} from ${sources.join(', ')}.`;
}

/**
 * The Health Connect group of Settings (MM-68). Connecting is offered,
 * never required: each kind of reading is allowed by itself, with what it
 * is for, and refusing one does not block the others. The app only reads.
 */
export function HealthConnectSection() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const connection = useLoaded(state.healthConnection);
  const setup = useLoaded(state.setup);
  if (connection === undefined || setup === undefined) return null;
  if (connection.available.size === 0) {
    return (
      <>
        <GroupHeader text="Health Connect" />
        <p className="app-text settings-note">
          Health Connect is not on this phone, so there is nothing to connect. Everything in the app works without
          it.
        </p>
      </>
    );
  }

  /**
   * Reads every allowed kind. A platform that cannot be read just now
   * leaves what is kept as it was, and says so.
   */
  const read = async () => {
    if (!(await state.syncHealth())) {
      overlays.snack('Health Connect could not be read just now. Nothing was changed.');
    }
  };

  const allow = async (type: HealthDataType) => {
    const after = await services.healthSource.requestPermission(new Set([type]));
    state.refreshHealthConnection();
    if (after.has(type)) {
      await read();
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
    <>
      <GroupHeader text="Health Connect" />
      <MmListGroup>
        {offered.map((type) => {
          const permitted = connection.permitted.has(type);
          return (
            <MmListRow
              key={type}
              title={healthDataTypeLabel(type)}
              subtitle={
                permitted ? count(connection.imported.get(type) ?? []) : `Not allowed. ${healthDataTypePurpose(type)}`
              }
              trailing={
                permitted ? (
                  <span role="img" aria-label="Allowed">
                    <MmIcon name="check" />
                  </span>
                ) : (
                  <MmIcon name="chevronRight" />
                )
              }
              onPress={permitted ? undefined : () => void allow(type)}
            />
          );
        })}
      </MmListGroup>
      {connection.permitted.size === 0 ? null : (
        <div className="settings-note">
          <MmButton label="Read from Health Connect now" kind="secondary" expand onPress={() => void read()} />
        </div>
      )}
      <p className="app-caption settings-note">
        The app only reads. Nothing is written to your health data, and nothing read leaves this phone. One weigh-in
        counts for a day: the first of the morning, or the middle of the day’s readings. A value you type for a day is
        used instead. To stop, take the permission away in Health Connect: what was read is kept until you erase your
        data.
      </p>
    </>
  );
}
