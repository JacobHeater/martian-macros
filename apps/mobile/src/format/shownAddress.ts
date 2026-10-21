/** A web address as a person reads it (MM-454): without the scheme or a trailing slash. */
export function shownAddress(address: string): string {
  return address.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
