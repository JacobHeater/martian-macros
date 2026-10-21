import type { TargetShapeRepository } from '../domain/repositories/TargetShapeRepository';
import type { TargetShape } from '../domain/TargetShape';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `TargetShapeRepository` held in memory. */
export class InMemoryTargetShapeRepository implements TargetShapeRepository {
  private readonly shapes = new ObservableValue<readonly TargetShape[]>([]);

  watchTargetShapes(): Watched<TargetShape[]> {
    return this.shapes.watchAs((all) => [...all]);
  }

  async saveTargetShape(shape: TargetShape): Promise<void> {
    this.shapes.value = [...this.shapes.value.filter((existing) => existing.since !== shape.since), shape].sort((a, b) =>
      a.since.compareTo(b.since),
    );
  }

  /** Empties the store (used by `InMemoryDataEraser`, and by the app's erase while it is held in memory, MM-486). */
  clear(): void {
    this.shapes.value = [];
  }
}
