import type { Watched } from '../lang/Watched';

/** Gives `combine(a, b)` whenever either source gives a value, once both have. */
export function combineLatest<A, B, R>(a: Watched<A>, b: Watched<B>, combine: (a: A, b: B) => R): Watched<R> {
  return {
    subscribe(listener, onError) {
      let lastA: A | undefined;
      let lastB: B | undefined;
      let hasA = false;
      let hasB = false;

      const emit = () => {
        if (hasA && hasB) listener(combine(lastA as A, lastB as B));
      };

      const stopA = a.subscribe((value) => {
        lastA = value;
        hasA = true;
        emit();
      }, onError);
      const stopB = b.subscribe((value) => {
        lastB = value;
        hasB = true;
        emit();
      }, onError);
      return () => {
        stopA();
        stopB();
      };
    },
  };
}
