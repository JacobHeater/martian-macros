/** The downloaded bytes could not be written to the pack's unfinished file: the phone is full, or the file cannot be opened. */
export class PackWriteFailed extends Error {
  override readonly name = 'PackWriteFailed';
}
