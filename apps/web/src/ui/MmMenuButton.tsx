import { useEffect, useId, useRef, useState } from 'react';
import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import type { MmMenuItem } from './MmMenuItem';
import './ui.css';

interface MmMenuButtonProps<T> {
  icon: MmIconName;
  /** What a person hears for the button. */
  label: string;
  items: readonly MmMenuItem<T>[];
  onSelect: (value: T) => void;
}

/** An icon that opens a short menu of choices. */
export function MmMenuButton<T>({ icon, label, items, onSelect }: MmMenuButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="mm-menu" ref={root}>
      <button
        type="button"
        className="mm-icon-button mm-icon-button-standard"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)}
      >
        <MmIcon name={icon} />
      </button>
      {open ? (
        <div id={id} className="mm-menu-list" role="menu" aria-label={label}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="mm-menu-item"
              onClick={() => {
                setOpen(false);
                onSelect(item.value);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
