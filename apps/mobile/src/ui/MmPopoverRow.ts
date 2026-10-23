/** One line of a popover's list (MM-562): what it is, its figure, and a word of status beside it as a chip. */
export interface MmPopoverRow {
  readonly label: string;
  readonly figures: string;
  readonly tag?: string | undefined;
}
