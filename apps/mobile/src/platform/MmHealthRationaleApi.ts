/**
 * The health plugin's word on whether Health Connect sent the person here
 * to read why the app asks (MM-731), said once. Apple Health never does.
 */
export interface MmHealthRationaleApi {
  rationaleRequested(): Promise<{ requested: boolean }>;
}
