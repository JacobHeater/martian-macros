import { useRef, useState } from 'react';
import { MmIconButton } from './MmIconButton';
import type { MmIconName } from './MmIconName';
import type { MmMenuItem } from './MmMenuItem';
import { useOverlays } from './useOverlays';
import './ui.css';

interface MmMenuButtonProps<T> {
  icon: MmIconName;
  /** What a person hears for the button. */
  label: string;
  items: readonly MmMenuItem<T>[];
  onSelect: (value: T) => void;
}

/**
 * An icon that opens a short menu of actions. The menu is drawn by the
 * overlay host at the button's anchor, so a row or a group cannot clip it
 * (MM-268). A choice between values is not a menu: that is `overlays.options`.
 */
export function MmMenuButton<T>({ icon, label, items, onSelect }: MmMenuButtonProps<T>) {
  const overlays = useOverlays();
  const anchor = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  const show = async () => {
    // A second press closes it: the button toggles, as its expanded state says (MM-565).
    if (open) {
      overlays.closeTop();
      return;
    }
    const rect = anchor.current?.getBoundingClientRect() ?? { top: 0, right: 0, bottom: 0, left: 0 };
    setOpen(true);
    const chosen = await overlays.menu({ label, items, anchor: rect });
    setOpen(false);
    if (chosen !== undefined) onSelect(chosen.value);
  };

  return (
    <span ref={anchor} className="mm-menu">
      <MmIconButton icon={icon} label={label} opens="menu" expanded={open} onPress={() => void show()} />
    </span>
  );
}
