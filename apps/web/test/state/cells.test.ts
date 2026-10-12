import { describe, expect, it } from 'vitest';
import { ObservableValue } from '../../src/fixtures/ObservableValue';
import { DerivedCell } from '../../src/state/DerivedCell';
import { Loadable } from '../../src/state/Loadable';
import { StreamCell } from '../../src/state/StreamCell';
import { ValueCell } from '../../src/state/ValueCell';

/** MM-232: the cells the app's state is made of. */
describe('a value cell', () => {
  it('tells a new watcher its value at once, then each change, and not the same value twice', () => {
    const cell = new ValueCell(1);
    const seen: number[] = [];
    const stop = cell.subscribe((value) => seen.push(value));
    cell.put(2);
    cell.put(2);
    cell.put(3);
    stop();
    cell.put(4);
    expect(seen).toEqual([1, 2, 3]);
    expect(cell.value).toBe(4);
  });
});

describe('a derived cell', () => {
  it('follows the cells it read', () => {
    const a = new ValueCell(2);
    const b = new ValueCell(3);
    const sum = new DerivedCell(() => a.value + b.value);
    const seen: number[] = [];
    const stop = sum.subscribe((value) => seen.push(value));
    a.put(10);
    b.put(1);
    stop();
    expect(seen).toEqual([5, 13, 11]);
  });

  it('starts watching a cell it only begins to read later, and stops watching one it no longer reads', () => {
    const useB = new ValueCell(false);
    const a = new ValueCell('a');
    const b = new ValueCell('b');
    let computed = 0;
    const picked = new DerivedCell(() => {
      computed++;
      return useB.value ? b.value : a.value;
    });
    const seen: string[] = [];
    const stop = picked.subscribe((value) => seen.push(value));
    b.put('b2'); // not read yet: nothing is worked out again
    const before = computed;
    useB.put(true);
    a.put('a2'); // no longer read
    b.put('b3');
    stop();
    expect(seen).toEqual(['a', 'b2', 'b3']);
    expect(before).toBe(2); // once when made, once when first watched
    expect(a.watched).toBe(false);
  });

  it('does no work while nothing watches it, and catches up when watched again', () => {
    const a = new ValueCell(1);
    let computed = 0;
    const doubled = new DerivedCell(() => {
      computed++;
      return a.value * 2;
    });
    const stop = doubled.subscribe(() => undefined);
    stop();
    const idle = computed;
    a.put(2);
    a.put(3);
    expect(computed).toBe(idle);
    expect(a.watched).toBe(false);

    const seen: number[] = [];
    doubled.subscribe((value) => seen.push(value))();
    expect(seen[seen.length - 1]).toBe(6);
  });

  it('follows through a chain of derived cells', () => {
    const a = new ValueCell(1);
    const plusOne = new DerivedCell(() => a.value + 1);
    const timesTen = new DerivedCell(() => plusOne.value * 10);
    const seen: number[] = [];
    const stop = timesTen.subscribe((value) => seen.push(value));
    a.put(2);
    stop();
    expect(seen).toEqual([20, 30]);
    expect(plusOne.watched).toBe(false);
  });
});

describe('MM-233: a derived cell is never worked out from one new value and one old', () => {
  it('reads a sibling that has not been told of the change yet as it is now', () => {
    const base = new ValueCell(1);
    const doubled = new DerivedCell(() => base.value * 2);
    // Reads the base first, so it starts watching the base before `doubled` does
    // and is told of a change first.
    const pair = new DerivedCell(() => [base.value, doubled.value] as const);
    const seen: (readonly [number, number])[] = [];
    const stop = pair.subscribe((value) => seen.push(value));
    base.put(2);
    base.put(5);
    stop();
    expect(seen).toEqual([
      [1, 2],
      [2, 4],
      [5, 10],
    ]);
  });

  it('works a value out once for one change, however many of its sources that change reached', () => {
    const base = new ValueCell(1);
    const doubled = new DerivedCell(() => base.value * 2);
    let worked = 0;
    const sum = new DerivedCell(() => {
      worked += 1;
      return base.value + doubled.value;
    });
    const stop = sum.subscribe(() => undefined);
    worked = 0;
    base.put(3);
    stop();
    expect(sum.peek()).toBe(9);
    expect(worked).toBe(1);
  });

  it('is brought up to date by being read, before it has been told', () => {
    const base = new ValueCell(1);
    const doubled = new DerivedCell(() => base.value * 2);
    const read: number[] = [];
    // Watches the base before `doubled` does, and reads `doubled` as soon as it is told.
    const stopReader = base.subscribe(() => read.push(doubled.peek()));
    const stop = doubled.subscribe(() => undefined);
    base.put(4);
    stop();
    stopReader();
    expect(read[read.length - 1]).toBe(8);
  });
});

describe('a cell over something a repository watches', () => {
  it('is not ready until watched, then holds the first value and follows it', () => {
    const store = new ObservableValue(1);
    const cell = new StreamCell(() => store.watch());
    expect(cell.value).toEqual(Loadable.loading);
    const seen: (number | undefined)[] = [];
    const stop = cell.subscribe((value) => seen.push(Loadable.valueOf(value)));
    store.value = 2;
    stop();
    store.value = 3;
    expect(seen).toEqual([1, 2]);
  });

  it('asks again when a cell its question read changes', () => {
    const which = new ValueCell('a');
    const stores = { a: new ObservableValue('from a'), b: new ObservableValue('from b') } as const;
    const cell = new StreamCell(() => stores[which.value as 'a' | 'b'].watch());
    const seen: (string | undefined)[] = [];
    const stop = cell.subscribe((value) => seen.push(Loadable.valueOf(value)));
    which.put('b');
    stores.a.value = 'a changed'; // no longer asked
    stores.b.value = 'b changed';
    stop();
    expect(seen).toEqual(['from a', 'from b', 'b changed']);
  });

  it('says what went wrong, and can be asked again', () => {
    const failure = new Error('the store is gone');
    const cell = new StreamCell<number>(() => ({
      subscribe: (_, onError) => {
        onError?.(failure);
        return () => undefined;
      },
    }));
    cell.subscribe(() => undefined)();
    expect(cell.value).toEqual({ ready: false, error: failure });
    expect(Loadable.hasFailed(cell.value)).toBe(true);
  });
});
