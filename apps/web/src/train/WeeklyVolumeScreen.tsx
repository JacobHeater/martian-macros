import { Fmt } from '../format/Fmt';
import { Loadable } from '../state/Loadable';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmSpinner } from '../ui/MmSpinner';
import { MuscleVolumeRow } from '../ui/MuscleVolumeRow';

/** Hard sets for each muscle group over the last seven days, beside the seven before. */
export function WeeklyVolumeScreen() {
  const { state } = useApp();
  const volume = useCell(state.weeklyVolume);
  if (Loadable.hasFailed(volume)) {
    return (
      <Screen title="Weekly training volume">
        <InfoCard title="Volume unavailable">
          <p className="app-text">Could not read training history. Your sets are unchanged.</p>
          <MmButton label="Retry volume" onPress={() => state.retryWeeklyVolume()} />
        </InfoCard>
      </Screen>
    );
  }
  if (!volume.ready) {
    return (
      <Screen title="Weekly training volume">
        <div className="app-centered">
          <MmSpinner />
        </div>
      </Screen>
    );
  }
  const { today, groups, unmappedCurrentSets, unmappedPreviousSets } = volume.value;
  return (
    <Screen title="Weekly training volume">
      <InfoCard title="Last seven days">
        <p className="app-text">
          {Fmt.longDate(today.addDays(-6))} – {Fmt.longDate(today)}
        </p>
        <p className="app-text">
          Previous: {Fmt.longDate(today.addDays(-13))} – {Fmt.longDate(today.addDays(-7))}
        </p>
        <p className="app-text">
          Finished workouts only. Hard sets have RIR 0–4 or no RIR recorded. Primary muscles count fully; secondary
          muscles count half.
        </p>
        <p className="app-text">
          The shaded 10–20 range is a typical weekly reference, not a rule or a target for every muscle. The thin
          marker shows your previous seven days.
        </p>
        {unmappedCurrentSets + unmappedPreviousSets > 0 ? (
          <p className="app-text">
            Missing exercise mappings: {unmappedCurrentSets} current and {unmappedPreviousSets} previous hard sets
            omitted. Deleted exercise details are not guessed.
          </p>
        ) : null}
      </InfoCard>
      <InfoCard title="Hard sets by muscle group">
        {groups.map((group) => (
          <MuscleVolumeRow key={group.group} volume={group} />
        ))}
      </InfoCard>
    </Screen>
  );
}
