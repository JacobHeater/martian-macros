import type { MmIconName } from './MmIconName';

const PATHS: Record<MmIconName, string> = {
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  food: 'M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M16 3c-2 2-2 7 0 9v9',
  train: 'M4 9l11 11M9 4l11 11M6 6l3 3M15 15l3 3M3 12l3-3M18 15l3-3',
  trend: 'M3 17l6-6 4 4 8-8',
  coach: 'M3 18l5-5 4 3 6-7M19 3v4M17 5h4M6 4v2M5 5h2',
  settings:
    'M12 9a3 3 0 100 6 3 3 0 000-6zM10.3 3h3.4l.5 2.6 1.7 1 2.5-.9 1.7 3-2 1.7v2l2 1.7-1.7 3-2.5-.9-1.7 1-.5 2.6h-3.4l-.5-2.6-1.7-1-2.5.9-1.7-3 2-1.7v-2l-2-1.7 1.7-3 2.5.9 1.7-1z',
  back: 'M20 12H5M11 6l-6 6 6 6',
};

/** A decorative icon. Whatever carries it supplies the name a person hears. */
export function MmIcon({ name }: { name: MmIconName }) {
  return (
    <svg className="mm-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
