import { Entitlement } from '../domain/integration/Entitlement';
import type { EntitlementReader } from '../domain/integration/EntitlementReader';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** An `EntitlementReader` you can set: free by default. */
export class InMemoryEntitlement implements EntitlementReader {
  private readonly entitlement: ObservableValue<Entitlement>;

  constructor(initial: Entitlement = new Entitlement('free')) {
    this.entitlement = new ObservableValue(initial);
  }

  set(entitlement: Entitlement): void {
    this.entitlement.value = entitlement;
  }

  watchEntitlement(): Watched<Entitlement> {
    return this.entitlement.watch();
  }
}
