import { type KeyboardEvent, useEffect, useRef } from 'react';
import type { MmAnchor } from './MmAnchor';
import type { MmMenuItem } from './MmMenuItem';
import { MmMenuItemRow } from './MmMenuItemRow';
import './ui.css';

interface MmMenuProps<T> {
  /** What a person hears for the menu. */
  label: string;
  items: readonly MmMenuItem<T>[];
  /** The trigger's edges; the list hangs under its end, or over it near the bottom of the screen. */
  anchor: MmAnchor;
  /** Called with the item chosen, or undefined when closed without one. */
  onDone: (item: MmMenuItem<T> | undefined) => void;
}

const itemPx = 48;
const edgePx = 16;

/**
 * A short menu of actions, drawn by the overlay host at the trigger's
 * anchor so no ancestor can clip it (MM-268). It opens with focus on its
 * first item, the arrows move between items, Escape, Tab and a press
 * outside close it, and focus returns to the trigger.
 */
export function MmMenu<T>({ label, items, anchor, onDone }: MmMenuProps<T>) {
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const before = document.activeElement;
    list.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);

  const height = items.length * itemPx + 2 * 8;
  const below = anchor.bottom + height <= window.innerHeight - edgePx;
  const right = Math.max(edgePx, window.innerWidth - anchor.right);
  const place = below ? { top: anchor.bottom, right } : { bottom: Math.max(edgePx, window.innerHeight - anchor.top), right };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rows = [...(list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const at = rows.indexOf(document.activeElement as HTMLElement);
    const focus = (index: number) => rows[(index + rows.length) % rows.length]?.focus();
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      onDone(undefined);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focus(at + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focus(at - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focus(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focus(rows.length - 1);
    }
  };

  return (
    <>
      <div className="mm-menu-scrim" onPointerDown={() => onDone(undefined)} />
      <div ref={list} className="mm-menu-list" role="menu" aria-label={label} style={place} onKeyDown={onKeyDown}>
        {items.map((item) => (
          <MmMenuItemRow key={item.label} label={item.label} onSelect={() => onDone(item)} />
        ))}
      </div>
    </>
  );
}
