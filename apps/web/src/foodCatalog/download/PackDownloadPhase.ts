/** Where a pack download is, in the words the app shows. */
export type PackDownloadPhase = 'downloading' | 'checking' | 'installing';

export const PackDownloadPhase = {
  values: ['downloading', 'checking', 'installing'],
} as const satisfies { values: readonly PackDownloadPhase[] };
