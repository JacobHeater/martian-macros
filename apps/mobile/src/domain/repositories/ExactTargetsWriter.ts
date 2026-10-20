/** Turns the exact, unrounded display of targets on or off (MM-123). */
export interface ExactTargetsWriter {
  saveExactTargets(on: boolean): Promise<void>;
}
