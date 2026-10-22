/**
 * Where onboarding's offer to fill in from Apple Health stands (MM-69):
 * offered, the platform being asked, something filled in, nothing found,
 * or the read failed.
 */
export type HealthFillState = 'offered' | 'asking' | 'filled' | 'nothing' | 'failed';
