import { Fmt } from '../format/Fmt';
import { Loadable } from '../state/Loadable';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmSection } from '../ui/MmSection';
import { MuscleVolumeRow } from '../ui/MuscleVolumeRow';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';

const sets = (value: number) => (Number.isInteger(value) ? String(value + 0) : value.toFixed(1));
const capital = (word: string) => `${word.charAt(0).toUpperCase()}${word.substring(1)}`;

/**
 * Hard sets for each muscle group over the last seven days, beside the seven
 * before (MM-78), as a fold on Train (MM-680, the owner): closed, the
 * groups trained on one line; open, the muscle rows, the line on sets left
 * out when there are any, and how to read it one tap down.
 */
export function WeeklyVolumeFold() {
  const { state } = useApp();
  const volume = useCell(state.weeklyVolume);
  const groups = volume.ready ? [...volume.value.groups].sort((a, b) => b.currentSets - a.currentSets) : [];
  const trainedGroups = groups.filter((group) => group.currentSets > 0);
  let summary: string;
  if (Loadable.hasFailed(volume)) summary = 'Could not read training history.';
  else if (!volume.ready) summary = 'Reading your sets…';
  else if (trainedGroups.length === 0) summary = 'No hard sets in the last seven days.';
  else summary = trainedGroups.slice(0, 4).map((group) => `${capital(group.group)} ${sets(group.currentSets)}`).join(' · ');
  return (
    <MmSection icon="speed" title="Weekly training volume" summary={summary} collapsible initiallyExpanded={false} remember="train.volume">
      {Loadable.hasFailed(volume) ? (
        <ReadFailedNotice title="Could not read training history" consequence="Your sets are unchanged." onRetry={() => state.retryWeeklyVolume()} />
      ) : !volume.ready ? null : (
        <>
          {groups.map((group) => (
            <MuscleVolumeRow key={group.group} volume={group} />
          ))}
          {volume.value.unmappedCurrentSets + volume.value.unmappedPreviousSets > 0 ? (
            <p className="app-text">
              Missing exercise mappings: {volume.value.unmappedCurrentSets} current and {volume.value.unmappedPreviousSets} previous hard sets
              omitted. Deleted exercise details are not guessed.
            </p>
          ) : null}
          <MmDisclosure title="How to read this" remember="train.volume.how">
            <p className="app-text">
              {Fmt.longDate(volume.value.today.addDays(-6))} – {Fmt.longDate(volume.value.today)}, beside the seven days before. Finished
              workouts only. Hard sets have RIR 0–4 or no RIR recorded. Primary muscles count fully; secondary muscles count half. The
              shaded 10–20 range is a typical weekly reference, not a rule or a target for every muscle. The thin marker shows your
              previous seven days.
            </p>
          </MmDisclosure>
        </>
      )}
    </MmSection>
  );
}
