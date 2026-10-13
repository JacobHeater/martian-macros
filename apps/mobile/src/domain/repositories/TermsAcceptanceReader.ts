import type { Watched } from '../../lang/Watched';
import type { TermsAcceptance } from '../TermsAcceptance';

/** Reads whether the terms of use were agreed to (MM-242). */
export interface TermsAcceptanceReader {
  /** The latest agreement, then each change; undefined if the terms were never agreed to. */
  watchTermsAcceptance(): Watched<TermsAcceptance | undefined>;
}
