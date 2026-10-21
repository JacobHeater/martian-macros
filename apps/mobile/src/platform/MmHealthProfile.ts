/**
 * The health plugin's answer for onboarding (MM-69), each field only when
 * the platform has it: `sex` as HealthKit names it (female, male, other),
 * the date of birth as its parts with January as 1, and the latest height
 * in metres, as Health Connect's units.
 */
export interface MmHealthProfile {
  sex?: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  heightM?: number;
}
