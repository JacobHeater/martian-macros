import type { MmIconProps } from './MmIconProps';

/**
 * A protein shaker, drawn for the app where Material has none (the owner,
 * 2026-10-16, MM-335): a capped, slightly tapered bottle with measure marks,
 * in the Outlined set's 2-unit line on its 24-unit grid.
 */
export function ShakerBottleOutlined(props: MmIconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 3V2h3v1" />
        <path d="M8 6.5V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5v2" />
        <path d="M6.5 6.5h11l-1 12.6A2 2 0 0 1 14.5 21h-5a2 2 0 0 1-2-1.9z" />
        <path d="M10 11h4M10 14.5h2.5" />
      </g>
    </svg>
  );
}
