import { Fragment, type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MmButton } from './MmButton';
import { MmClockTimeDialog } from './MmClockTimeDialog';
import { MmDateDialog } from './MmDateDialog';
import { MmDialog } from './MmDialog';
import { MmIconButton } from './MmIconButton';
import { MmMenu } from './MmMenu';
import { MmOption } from './MmOption';
import { MmSheet } from './MmSheet';
import { MmTimeOfDayDialog } from './MmTimeOfDayDialog';
import type { Overlays } from './Overlays';
import { OverlaysContext } from './OverlaysContext';
import './ui.css';

/** How long a short message with nothing to press stays, as Material's snack bar does. */
const snackMs = 4000;

interface Snack {
  readonly id: number;
  readonly message: string;
  readonly action?: { label: string; onAction: () => void } | undefined;
}

/**
 * Gives every screen under it `useOverlays`, and draws whatever questions
 * and short message are showing over them. A question asked while another
 * is showing goes over it, and the one underneath is as it was left when
 * the one over it is answered. While a question is up, the app beneath is
 * inert: the keyboard, a switch and a screen reader stay in the question
 * (MM-271).
 */
export function MmOverlays({ children }: { children: ReactNode }) {
  const [dialogs, setDialogs] = useState<readonly { id: number; node: ReactNode; dismiss: () => boolean }[]>([]);
  const dialogCount = useRef(0);
  const [snack, setSnack] = useState<Snack>();
  const snackCount = useRef(0);
  // A snack being read or pointed at does not go away under the person.
  const [held, setHeld] = useState(false);

  /** Shows what `render` draws and answers with what it is finished with. */
  const ask = useCallback(<T,>(render: (finish: (answer: T | undefined) => void) => ReactNode): Promise<T | undefined> => {
    return new Promise<T | undefined>((resolve) => {
      dialogCount.current += 1;
      const id = dialogCount.current;
      let answered = false;
      const finish = (answer: T | undefined) => {
        if (answered) return;
        answered = true;
        setDialogs((current) => current.filter((dialog) => dialog.id !== id));
        resolve(answer);
      };
      const dismiss = () => {
        if (answered) return false;
        finish(undefined);
        return true;
      };
      setDialogs((current) => [...current, { id, node: render(finish), dismiss }]);
    });
  }, []);

  const showing = useRef(dialogs);
  showing.current = dialogs;
  const snackShowing = useRef(snack);
  snackShowing.current = snack;

  const overlays = useMemo<Overlays>(
    () => ({
      async confirm({ title, message, confirmLabel, cancelLabel = 'Cancel' }) {
        const confirmed = await ask<boolean>((finish) => (
          <MmDialog
            title={title}
            onDismiss={() => finish(undefined)}
            actions={
              <>
                <MmButton label={cancelLabel} kind="secondary" onPress={() => finish(false)} />
                <MmButton label={confirmLabel} kind="destructive" onPress={() => finish(true)} />
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
          <MmDialog
            title={title}
            onDismiss={() => finish(undefined)}
            actions={<MmButton label="Cancel" kind="text" onPress={() => finish(undefined)} />}
          >
            <div className="mm-options" role="listbox" aria-label={title}>
              {options.map((option) => (
                <MmOption
                  key={option.label}
                  label={option.label}
                  chosen={option.value === selected}
                  onSelect={() => finish(option)}
                />
              ))}
            </div>
          </MmDialog>
        ));
      },

      date({ helpText, initial, first, last, today }) {
        return ask((finish) => (
          <MmDateDialog helpText={helpText} initial={initial} first={first} last={last} today={today} onDone={finish} />
        ));
      },

      timeOfDay({ initialMinuteOfDay, helpText, first, last, everyMinute }) {
        return ask((finish) => (
          <MmTimeOfDayDialog
            initialMinuteOfDay={initialMinuteOfDay}
            helpText={helpText}
            first={first}
            last={last}
            everyMinute={everyMinute ?? false}
            onDone={finish}
          />
        ));
      },

      clockTime({ title, initialMs }) {
        return ask((finish) => <MmClockTimeDialog title={title} initialMs={initialMs} onDone={finish} />);
      },

      sheet(label, content) {
        return ask((finish) => (
          <MmSheet label={label} onDismiss={() => finish(undefined)}>
            {content(finish)}
          </MmSheet>
        ));
      },

      menu({ label, items, anchor }) {
        return ask((finish) => <MmMenu label={label} items={items} anchor={anchor} onDone={finish} />);
      },

      snack(message, action) {
        snackCount.current += 1;
        setHeld(false);
        setSnack({ id: snackCount.current, message, action });
      },

      closeTop() {
        // From the top down, past any already answered just now.
        for (let at = showing.current.length - 1; at >= 0; at -= 1) {
          if (showing.current[at]?.dismiss() === true) return true;
        }
        if (snackShowing.current?.action !== undefined) {
          setSnack(undefined);
          return true;
        }
        return false;
      },
    }),
    [ask],
  );

  // While a snack shows, a floating action stands above it, as Material lifts its FAB (MM-302).
  const snackBox = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = snackBox.current;
    const root = document.documentElement.style;
    if (element === null) {
      root.removeProperty('--mm-snack-clearance');
      return undefined;
    }
    const publish = () => root.setProperty('--mm-snack-clearance', `${element.getBoundingClientRect().height + 16}px`);
    publish();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(publish);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      root.removeProperty('--mm-snack-clearance');
    };
  }, [snack]);

  useEffect(() => {
    if (snack === undefined || snack.action !== undefined || held) return undefined;
    const timer = setTimeout(() => setSnack((current) => (current?.id === snack.id ? undefined : current)), snackMs);
    return () => clearTimeout(timer);
  }, [snack, held]);

  return (
    <OverlaysContext.Provider value={overlays}>
      <div className="mm-app-root" inert={dialogs.length > 0}>
        {children}
      </div>
      {dialogs.map((dialog) => (
        <Fragment key={dialog.id}>{dialog.node}</Fragment>
      ))}
      <div className="mm-snack-host" role="status" aria-live="polite">
        {snack === undefined ? null : (
          <div
            ref={snackBox}
            className="mm-snack"
            key={snack.id}
            tabIndex={snack.action === undefined ? 0 : -1}
            onFocusCapture={() => setHeld(true)}
            onBlurCapture={() => setHeld(false)}
            onPointerEnter={() => setHeld(true)}
            onPointerLeave={() => setHeld(false)}
          >
            <span className="mm-snack-message">{snack.message}</span>
            {snack.action === undefined ? null : (
              <>
                <MmButton
                  label={snack.action.label}
                  kind="text"
                  onPress={() => {
                    setSnack(undefined);
                    snack.action?.onAction();
                  }}
                />
                <MmIconButton icon="close" label="Dismiss" onPress={() => setSnack(undefined)} />
              </>
            )}
          </div>
        )}
      </div>
    </OverlaysContext.Provider>
  );
}
