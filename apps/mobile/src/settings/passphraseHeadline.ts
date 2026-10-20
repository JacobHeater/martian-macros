/** The headline of the passphrase sheet for each purpose; the sheet is labelled with it too (MM-63). */
export const passphraseHeadline = (purpose: 'set' | 'open'): string =>
  purpose === 'set' ? 'A passphrase for this backup' : 'The backup’s passphrase';
