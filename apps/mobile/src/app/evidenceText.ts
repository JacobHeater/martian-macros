import text from '../../../../docs/evidence.md?raw';

/**
 * The evidence register (MM-143), as it is written in `docs/evidence.md`.
 * It is put in the app when the app is built, so there is one copy of it
 * and the app never fetches it.
 */
export const evidenceText: string = text;
