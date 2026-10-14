import { useEffect, useRef, useState } from 'react';
import { CalendarDate } from '../domain/CalendarDate';
import { MmButton } from '../ui/MmButton';
import { MmClockTimeDialog } from '../ui/MmClockTimeDialog';
import { MmDateDialog } from '../ui/MmDateDialog';
import { MmDatePicker } from '../ui/MmDatePicker';
import { MmDialog } from '../ui/MmDialog';
import { MmMenu } from '../ui/MmMenu';
import { MmMenuButton } from '../ui/MmMenuButton';
import { MmOverlays } from '../ui/MmOverlays';
import { MmSheet } from '../ui/MmSheet';
import { MmTimeOfDayDialog } from '../ui/MmTimeOfDayDialog';
import { MmTimePicker } from '../ui/MmTimePicker';
import type { OverlayKind } from './OverlayKind';
import { useOverlays } from '../ui/useOverlays';
import './gallery.css';

const today = CalendarDate.of(2026, 10, 13);
const nothing = () => undefined;

/** Opens the overlay the story is about through the host, as a screen does, the moment it is drawn. */
function Opener({ kind }: { kind: OverlayKind }) {
  const overlays = useOverlays();
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    switch (kind) {
      case 'confirm':
        void overlays.confirm({
          title: 'Erase everything?',
          message: 'This permanently deletes your profile, food log, weigh-ins, and targets from this device. It cannot be undone.',
          confirmLabel: 'Erase',
        });
        break;
      case 'choice':
        void overlays.choice({
          title: 'Keep these targets?',
          message: 'They may come down next week.',
          primaryLabel: 'Keep',
          primary: 'keep',
          secondaryLabel: 'Take the change',
          secondary: 'change',
        });
        break;
      case 'options':
        void overlays.options({
          title: 'Daily activity',
          options: [
            { value: 'sedentary', label: 'Mostly sitting' },
            { value: 'light', label: 'Light movement' },
            { value: 'physicalJob', label: 'Physical job' },
          ],
          selected: 'light',
        });
        break;
      case 'sheet':
        void overlays.sheet('Height', () => (
          <div className="gallery-stack" style={{ padding: 'var(--space-16)' }}>
            <p style={{ margin: 0 }}>A sheet rises on the raised surface with the sheet-top radius, a handle that drags it away and a Close action.</p>
          </div>
        ));
        break;
      case 'snack':
        overlays.snack('Saved.');
        break;
      case 'snackUndo':
        overlays.snack('Removed Oats, 80 g', { label: 'Undo', onAction: nothing });
        break;
      default:
        break;
    }
  }, [kind, overlays]);
  return null;
}

/** The pickers on their own, outside a dialog, for a look at their anatomy. */
function Pickers() {
  const [date, setDate] = useState(CalendarDate.of(1996, 1, 15));
  const [seconds, setSeconds] = useState(6 * 3600 + 30 * 60);
  return (
    <div className="gallery-stack">
      <MmDatePicker name="Date of birth" value={date} first={CalendarDate.of(1926, 1, 1)} last={today} today={today} onChange={setDate} />
      <MmTimePicker value={seconds} onChange={setSeconds} />
    </div>
  );
}

/**
 * Every overlay of the design system, one per story (MM-273): the host's
 * recipes (confirm, choice, options, sheet, snack, a menu from its button)
 * opened as a screen opens them, and the dialogs and the menu drawn on
 * their own.
 */
export function OverlaysCatalog({ kind }: { kind: OverlayKind }) {
  const menuAnchor = { top: 16, right: 328, bottom: 64, left: 280 };
  return (
    <MmOverlays>
      <div className="gallery-stack">
        <p style={{ margin: 0, color: 'var(--text2)' }}>The screen beneath an overlay. It is inert while one is up.</p>
        <MmButton label="A button beneath" kind="secondary" onPress={nothing} />
        {kind === 'menuButton' ? (
          <div className="gallery-anchor">
            <MmMenuButton
              icon="more"
              label="More actions for Oats"
              items={[
                { value: 'copy', label: 'Copy to today' },
                { value: 'delete', label: 'Delete' },
              ]}
              onSelect={nothing}
            />
          </div>
        ) : null}
        {kind === 'pickers' ? <Pickers /> : null}
      </div>
      <Opener kind={kind} />
      {kind === 'dialog' ? (
        <MmDialog
          title="A question"
          onDismiss={nothing}
          actions={
            <>
              <MmButton label="Cancel" kind="text" onPress={nothing} />
              <MmButton label="OK" onPress={nothing} />
            </>
          }
        >
          <p>The dialog on its own: a title, a body and its actions, lifted off the canvas.</p>
        </MmDialog>
      ) : null}
      {kind === 'date' ? (
        <MmDateDialog helpText="Date of birth" initial={CalendarDate.of(1996, 1, 1)} first={CalendarDate.of(1926, 1, 1)} last={today} today={today} onDone={nothing} />
      ) : null}
      {kind === 'time' ? <MmTimeOfDayDialog initialMinuteOfDay={7 * 60 + 30} helpText="Weigh-in reminder" first={7 * 60} last={21 * 60 - 1} onDone={nothing} /> : null}
      {kind === 'clock' ? <MmClockTimeDialog title="Set started" initialMs={(12 * 3600 + 2 * 60 + 10) * 1000} onDone={nothing} /> : null}
      {kind === 'sheetBare' ? (
        <MmSheet label="Height" onDismiss={nothing}>
          <div className="gallery-stack" style={{ padding: 'var(--space-16)' }}>
            <p style={{ margin: 0 }}>The sheet on its own.</p>
          </div>
        </MmSheet>
      ) : null}
      {kind === 'menu' ? (
        <MmMenu
          label="More actions"
          anchor={menuAnchor}
          items={[
            { value: 'copy', label: 'Copy to today' },
            { value: 'delete', label: 'Delete' },
          ]}
          onDone={nothing}
        />
      ) : null}
    </MmOverlays>
  );
}
