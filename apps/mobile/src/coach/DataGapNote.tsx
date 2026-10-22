import { useRef } from 'react';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { InsightSnooze } from '../engine/InsightSnooze';
import { healthPlatformName } from '../format/healthPlatformName';
import { SettingsScreen } from '../settings/SettingsScreen';
import { useOpenHealthPermissions } from '../settings/useOpenHealthPermissions';
import { focusNeighbourOf } from '../ui/focusNeighbourOf';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';
import { DataGap } from './DataGap';

interface DataGapNoteProps {
  gap: DataGap;
}

/**
 * What a gap in the health platform's data costs, said once beside the
 * estimate it weakens (MM-523), built as the line on label accuracy is
 * (MM-123): a note with "Got it". It names the consequence, never a fault,
 * offers where to allow the data, and leaves the choice there: dismissed,
 * it is kept as a snooze for always of its own kind (no table of its own)
 * and never comes back for that gap. Nothing until the dismissals have
 * been read, so it never flashes.
 *
 * Weigh-ins are allowed from their row in Settings; the history, which the
 * platform asks for only once (MM-73), in Health Connect itself (MM-323),
 * and a snack says on coming back whether it was allowed.
 */
export function DataGapNote({ gap }: DataGapNoteProps) {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const openPermissions = useOpenHealthPermissions();
  const snoozes = useLoaded(state.insightSnoozes);
  const today = useCell(state.today);
  const host = useRef<HTMLDivElement>(null);
  if (snoozes === undefined) return null;
  if (snoozes.some((s) => s.kind === DataGap.snoozeKind && s.subject === gap && InsightSnooze.quietOn(s, today))) return null;
  const name = healthPlatformName(services.platform);

  const dismiss = async () => {
    // The note is about to go, and the focus with it: it moves to the nearest control that stays (MM-379).
    focusNeighbourOf(host.current);
    await services.insightSnoozes.saveInsightSnooze({
      kind: DataGap.snoozeKind,
      subject: gap,
      item: gap === 'weight' ? `Weigh-ins from ${name}` : `Past data from ${name}`,
      resumesOn: undefined,
    });
  };
  const gotIt = <MmButton label="Got it" name={`Got it: ${gap === 'weight' ? 'weigh-ins' : 'past data'}`} kind="text" onPress={() => void dismiss()} />;

  return (
    <div ref={host}>
      {gap === 'weight' ? (
        <Notice
          text={`Without weigh-ins from ${name}, your trend and the dates it projects are less certain. Allowing them is up to you.`}
          action={
            <div className="app-row">
              <MmButton
                label="Open Settings"
                name={`Open Settings: ${name}`}
                kind="text"
                onPress={() => void navigator.push(() => <SettingsScreen open="healthConnect" />)}
              />
              {gotIt}
            </div>
          }
        />
      ) : (
        <Notice
          text={`${name} lets the app read only from 30 days before you connected, so this estimate has less to go on. Allowing past data in ${name} would give it more. It is up to you.`}
          action={
            <div className="app-row">
              <MmButton
                label={`Open ${name}`}
                kind="text"
                // Allowed there, the note goes on coming back, and the focus with it (MM-379).
                onPress={() => void openPermissions('history', () => focusNeighbourOf(host.current))}
              />
              {gotIt}
            </div>
          }
        />
      )}
    </div>
  );
}
