import './ui.css';

interface MmMenuItemRowProps {
  label: string;
  onSelect: () => void;
}

/** One action of a menu, inside a `role="menu"`: the one way a menu writes an item (MM-278). */
export function MmMenuItemRow({ label, onSelect }: MmMenuItemRowProps) {
  return (
    <button type="button" role="menuitem" className="mm-menu-item" tabIndex={-1} onClick={onSelect}>
      {label}
    </button>
  );
}
