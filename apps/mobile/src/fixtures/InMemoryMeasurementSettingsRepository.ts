import { MeasurementSettings } from '../domain/measurements/MeasurementSettings';
import type { MeasurementSettingsRepository } from '../domain/repositories/MeasurementSettingsRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `MeasurementSettingsRepository` held in memory (MM-156). */
export class InMemoryMeasurementSettingsRepository implements MeasurementSettingsRepository {
  private readonly settings = new ObservableValue<MeasurementSettings>(MeasurementSettings.none);

  watchMeasurementSettings(): Watched<MeasurementSettings> {
    return this.settings.watch();
  }

  async saveMeasurementSettings(settings: MeasurementSettings): Promise<void> {
    this.settings.value = settings;
  }

  clear(): void {
    this.settings.value = MeasurementSettings.none;
  }
}
