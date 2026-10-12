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
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  chevronDown: 'M6 9l6 6 6-6',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  check: 'M5 12l5 5 9-10',
  checkCircle: 'M12 3a9 9 0 100 18 9 9 0 000-18zM8 12l3 3 5-6',
  info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v6M12 7.5v.5',
  warning: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  shield: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z',
  more: 'M12 5v.5M12 12v.5M12 19v.5',
  close: 'M6 6l12 12M18 6L6 18',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  delete: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM16 16l5 5',
  barcode: 'M4 6v12M7 6v12M11 6v12M14 6v12M17 6v12M20 6v12',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10a3.5 3.5 0 100 7 3.5 3.5 0 000-7z',
  play: 'M7 5l12 7-12 7z',
  pause: 'M8 5v14M16 5v14',
  timer: 'M12 7a7 7 0 100 14 7 7 0 000-14zM12 10v4l3 2M9 3h6',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  history: 'M4 12a8 8 0 108-8 8 8 0 00-6 3M4 4v4h4M12 8v4l3 2',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.500-7 10-7 10z',
  bell: 'M6 17V11a6 6 0 0112 0v6l2 2H4zM10 21h4',
  person: 'M12 4a4 4 0 100 8 4 4 0 000-8zM4 21c0-4 4-6 8-6s8 2 8 6',
};

/** A decorative icon. Whatever carries it supplies the name a person hears. */
export function MmIcon({ name, size = 24 }: { name: MmIconName; size?: number }) {
  return (
    <svg className="mm-icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
