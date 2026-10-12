/** How much weight a notice carries (design/screen-direction.md, "Notice family"). */
export type NoticeKind =
  /** An explanation: calibration, settling. */
  | 'info'
  /** Health or safety guidance. */
  | 'caution'
  /** A required safeguard: never suppressed, always with an action. */
  | 'safeguard';
