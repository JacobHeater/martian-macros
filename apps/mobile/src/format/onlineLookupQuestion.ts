import { onlineSourceNames } from './onlineSourceNames';

/**
 * The question asked before the first online lookup (MM-58), saying exactly
 * what would be sent and to whom: the barcode number, or the words typed.
 */
export function onlineLookupQuestion(sent: 'barcode' | 'words', sources: readonly string[]): string {
  const what = sent === 'barcode' ? 'Only the barcode number is sent' : 'Only the words you typed are sent';
  return `Look this up online? ${what} to ${onlineSourceNames(sources)}, nothing about you. You can change this in Settings.`;
}
