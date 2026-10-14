import { type KeyboardEvent, useEffect, useRef } from 'react';
import './ui.css';

interface MmDrumProps {
  /** What a person hears ("Hour"). */
  name: string;
  /** The values offered, in order. */
  options: readonly number[];
  value: number;
  onChange: (value: number) => void;
  /** How a value is written ("05"); the number itself unless given. */
  text?: ((value: number) => string) | undefined;
}

/** The height of one value in the drum, and so one step of its scroll. */
const itemPx = 48;
/** How long after the last scroll the drum is taken to have settled. */
const settleMs = 150;
/** Digits typed this close together make one number. */
const typingMs = 1500;

/**
 * One drum of a time picker (MM-264): a scrolling column that snaps, with
 * the chosen value large in the middle. Drawn by the design system; to the
 * keyboard and a screen reader it is a spinbutton: the arrows move it one
 * value, Page Up and Down five, Home and End to the ends, and typed digits
 * set it.
 */
export function MmDrum({ name, options, value, onChange, text = String }: MmDrumProps) {
  const drum = useRef<HTMLDivElement>(null);
  const settling = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const typed = useRef('');
  const typedAt = useRef(0);
  const index = Math.max(0, options.indexOf(value));

  // The first paint lands on the value at once; a later change glides to it.
  const painted = useRef(false);
  useEffect(() => {
    const behavior: ScrollBehavior = painted.current ? 'smooth' : 'instant';
    painted.current = true;
    const element = drum.current;
    if (element === null || Math.round(element.scrollTop / itemPx) === index) return;
    const top = index * itemPx;
    if (typeof element.scrollTo === 'function') element.scrollTo({ top, behavior });
    else element.scrollTop = top;
  }, [index]);

  useEffect(() => () => clearTimeout(settling.current), []);

  const pick = (at: number) => {
    const next = options[Math.min(options.length - 1, Math.max(0, at))];
    if (next !== undefined && next !== value) onChange(next);
  };

  const onScroll = () => {
    clearTimeout(settling.current);
    settling.current = setTimeout(() => {
      const element = drum.current;
      if (element !== null) pick(Math.round(element.scrollTop / itemPx));
    }, settleMs);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5 };
    const step = steps[event.key];
    if (step !== undefined) {
      event.preventDefault();
      pick(index + step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      pick(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      pick(options.length - 1);
    } else if (/^\d$/.test(event.key)) {
      event.preventDefault();
      const now = Date.now();
      const buffer = now - typedAt.current < typingMs ? typed.current + event.key : event.key;
      typedAt.current = now;
      const whole = options.indexOf(Number(buffer));
      if (whole >= 0) {
        typed.current = buffer;
        pick(whole);
        return;
      }
      typed.current = event.key;
      const single = options.indexOf(Number(event.key));
      if (single >= 0) pick(single);
    }
  };

  return (
    <div
      ref={drum}
      className="mm-drum"
      role="spinbutton"
      tabIndex={0}
      aria-label={name}
      aria-valuenow={value}
      aria-valuemin={options[0]}
      aria-valuemax={options[options.length - 1]}
      aria-valuetext={text(value)}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
    >
      <div className="mm-drum-items" aria-hidden="true">
        {options.map((option, at) => (
          <div key={option} className={`mm-drum-item${option === value ? ' mm-drum-item-chosen' : ''}`} onClick={() => pick(at)}>
            {text(option)}
          </div>
        ))}
      </div>
    </div>
  );
}
