import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MmButton } from './MmButton';
import { MmClockTimeDialog } from './MmClockTimeDialog';
import { MmDateDialog } from './MmDateDialog';
import { MmDialog } from './MmDialog';
import { MmIcon } from './MmIcon';
import { MmTimeOfDayDialog } from './MmTimeOfDayDialog';
import type { Overlays } from './Overlays';
import { OverlaysContext } from './OverlaysContext';
import './ui.css';

/** How long a short message stays, as Material's snack bar does. */
const snackMs = 4000;

interface Snack {
  readonly id: number;
  readonly message: string;
  readonly action?: { label: string; onAction: () => void } | undefined;
}

/**
 * Gives every screen under it `useOverlays`, and draws whatever question or
 * short message is showing over them. One question at a time: a new one
 * replaces the one showing, which is answered as closed.
 */
export function MmOverlays({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ReactNode>(null);
  const [snack, setSnack] = useState<Snack>();
  const dismissCurrent = useRef<(() => void) | undefined>(undefined);
  const snackCount = useRef(0);

  /** Shows what `render` draws and answers with what it is finished with. */
  const ask = useCallback(<T,>(render: (finish: (answer: T | undefined) => void) => ReactNode): Promise<T | undefined> => {
    dismissCurrent.current?.();
    return new Promise<T | undefined>((resolve) => {
      let answered = false;
      const finish = (answer: T | undefined) => {
        if (answered) return;
        answered = true;
        dismissCurrent.current = undefined;
        setDialog(null);
        resolve(answer);
      };
      dismissCurrent.current = () => finish(undefined);
      setDialog(render(finish));
    });
  }, []);

  const overlays = useMemo<Overlays>(
    () => ({
      async confirm({ title, message, confirmLabel, cancelLabel = 'Cancel' }) {
        const confirmed = await ask<boolean>((finish) => (
          <MmDialog
            title={title}
            onDismiss={() => finish(undefined)}
            actions={
              <>
                <MmButton label={cancelLabel} kind="text" onPress={() => finish(false)} />
                <MmButton label={confirmLabel} onPress={() => finish(true)} />
              </>
            }
          >
            <p>{message}</p>
          </MmDialog>
        ));
        return confirmed === true;
      },

      choice({ title, message, primaryLabel, primary, secondaryLabel, secondary }) {
        return ask((finish) => (
          <MmDialog
            title={title}
            onDismiss={() => finish(undefined)}
            actions={
              <>
                <MmButton label={secondaryLabel} kind="text" onPress={() => finish(secondary)} />
                <MmButton label={primaryLabel} onPress={() => finish(primary)} />
              </>
            }
          >
            <p>{message}</p>
          </MmDialog>
        ));
      },

      options({ title, options, selected }) {
        return ask((finish) => (
          <MmDialog title={title} onDismiss={() => finish(undefined)}>
            <div className="mm-options" role="listbox" aria-label={title}>
              {options.map((option) => {
                const chosen = option.value === selected;
                return (
                  <button
                    key={option.label}
                    type="button"
                    role="option"
                    aria-selected={chosen}
                    className="mm-option"
                    onClick={() => finish(option)}
                  >
                    <span>{option.label}</span>
                    {chosen ? (
                      <span className="mm-option-check">
                        <MmIcon name="check" />
                        <span className="mm-visually-hidden">Chosen</span>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </MmDialog>
        ));
      },

      date({ helpText, initial, first, last }) {
        return ask((finish) => (
          <MmDateDialog helpText={helpText} initial={initial} first={first} last={last} onDone={finish} />
        ));
      },

      timeOfDay({ initialMinuteOfDay, helpText }) {
        return ask((finish) => (
          <MmTimeOfDayDialog initialMinuteOfDay={initialMinuteOfDay} helpText={helpText} onDone={finish} />
        ));
      },

      clockTime({ title, initialMs }) {
        return ask((finish) => <MmClockTimeDialog title={title} initialMs={initialMs} onDone={finish} />);
      },

      snack(message, action) {
        snackCount.current += 1;
        setSnack({ id: snackCount.current, message, action });
      },
    }),
    [ask],
  );

  useEffect(() => {
    if (snack === undefined) return undefined;
    const timer = setTimeout(() => setSnack((current) => (current?.id === snack.id ? undefined : current)), snackMs);
    return () => clearTimeout(timer);
  }, [snack]);

  return (
    <OverlaysContext.Provider value={overlays}>
      {children}
      {dialog}
      <div className="mm-snack-host" role="status" aria-live="polite">
        {snack === undefined ? null : (
          <div className="mm-snack" key={snack.id}>
            <span className="mm-snack-message">{snack.message}</span>
            {snack.action === undefined ? null : (
              <MmButton
                label={snack.action.label}
                kind="text"
                onPress={() => {
                  setSnack(undefined);
                  snack.action?.onAction();
                }}
              />
            )}
          </div>
        )}
      </div>
    </OverlaysContext.Provider>
  );
}
