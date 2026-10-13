import type { TermsAcceptance } from '../TermsAcceptance';

/**
 * Records that the terms of use were agreed to (MM-242). A later agreement
 * replaces the earlier one; nothing records a refusal.
 */
export interface TermsAcceptanceWriter {
  saveTermsAcceptance(acceptance: TermsAcceptance): Promise<void>;
}
