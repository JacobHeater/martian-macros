/** Which overlay an Overlays story opens. */
export type OverlayKind =
  | 'dialog'
  | 'confirm'
  | 'choice'
  | 'options'
  | 'date'
  | 'dateRefused'
  | 'time'
  | 'timeRefused'
  | 'clock'
  | 'pickers'
  | 'sheet'
  | 'sheetBare'
  | 'snack'
  | 'snackUndo'
  | 'menu'
  | 'menuButton'
  | 'popover';
