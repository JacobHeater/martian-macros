import type { PackDownloadProblem } from '../foodCatalog';

const texts: Readonly<Record<PackDownloadProblem, string>> = {
  connection: 'The connection dropped. What arrived is kept, so you can pick up where it stopped.',
  serverError: 'The host could not send the file right now. Try again later.',
  checksumMismatch: 'The file arrived damaged, so it was thrown away. Nothing on your phone changed.',
  unreadablePack:
    'The file is not a food database this version of the app can read. Nothing on your phone changed.',
  noSpace: 'There was not enough room on the phone to store it. Free some space and try again.',
};

/**
 * What went wrong with a food download, and what it means for the pack
 * already on the phone, in plain words.
 */
export const packDownloadProblemText = (problem: PackDownloadProblem): string => texts[problem];
