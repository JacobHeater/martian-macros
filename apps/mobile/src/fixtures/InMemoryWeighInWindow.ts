import { WeighInWindow } from '../healthIngest/WeighInWindow';
import type { WeighInWindowReader } from '../healthIngest/WeighInWindowReader';
import type { WeighInWindowWriter } from '../healthIngest/WeighInWindowWriter';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/**
 * The weigh-in window held in memory (MM-441). Not in the app's services
 * until the preferences table has a place for it: a window that forgot
 * itself on restart is not one the person may move.
 */
export class InMemoryWeighInWindow implements WeighInWindowReader, WeighInWindowWriter {
  private readonly window = new ObservableValue(WeighInWindow.usual);

  watchWeighInWindow(): Watched<WeighInWindow> {
    return this.window.watch();
  }

  async saveWeighInWindow(window: WeighInWindow | undefined): Promise<void> {
    this.window.value = window ?? WeighInWindow.usual;
  }
}
