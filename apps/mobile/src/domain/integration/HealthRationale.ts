/**
 * Whether the phone's health platform sent the person into the app to read
 * why it asks for its permissions (MM-731). Health Connect links to the app
 * from its permission sheet; the app then opens on its privacy policy.
 */
export interface HealthRationale {
  /** Whether the person was sent here to read why; said once, then forgotten. */
  requested(): Promise<boolean>;
}
