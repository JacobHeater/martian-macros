/**
 * Why to back up before a move replaces this phone (MM-698): its records were never backed up, or some were logged
 * since the last backup. Said on the Receive screen before the code, and from My QR Code once a move arrives (MM-716).
 */
export function unbackedWords(reason: 'since' | 'never'): string {
  return reason === 'never'
    ? 'This phone has never been backed up. Moving replaces its records, and only a backup could bring them back.'
    : 'This phone has records logged since its last backup. Moving replaces them, and only a backup could bring them back.';
}
