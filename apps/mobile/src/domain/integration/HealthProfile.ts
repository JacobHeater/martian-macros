import type { BiologicalSex } from '../BiologicalSex';
import type { CalendarDate } from '../CalendarDate';

/**
 * What a health platform holds about the person that onboarding asks too
 * (MM-69): each only where the platform has an answer the app can use. A
 * sex other than female or male, or none, is no answer.
 */
export interface HealthProfile {
  readonly sex: BiologicalSex | undefined;
  readonly birthDate: CalendarDate | undefined;
  /** The latest height recorded, in centimetres. */
  readonly heightCm: number | undefined;
}
