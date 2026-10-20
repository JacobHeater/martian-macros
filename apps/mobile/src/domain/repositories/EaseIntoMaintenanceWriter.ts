/** Turns the two-step way into maintenance on or off (MM-130). */
export interface EaseIntoMaintenanceWriter {
  saveEaseIntoMaintenance(on: boolean): Promise<void>;
}
