import type { Watched } from '../../lang/Watched';
import type { MeasurementSettings } from '../measurements/MeasurementSettings';

/** Keeps which sites the user measures, the limb side and the suggestion's answer (MM-156). */
export interface MeasurementSettingsRepository {
  /** The settings, `MeasurementSettings.none` until saved, then after each change. */
  watchMeasurementSettings(): Watched<MeasurementSettings>;

  /** Replaces the settings. */
  saveMeasurementSettings(settings: MeasurementSettings): Promise<void>;
}
