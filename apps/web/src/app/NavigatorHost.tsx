import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { CloseScreenContext } from './CloseScreenContext';
import type { Navigator } from './Navigator';
import { NavigatorContext } from './NavigatorContext';

interface Pushed {
  readonly id: number;
  readonly node: ReactNode;
  readonly close: () => void;
}

/**
 * Shows `children`, and over them whatever screens have been pushed. A
 * screen that is covered stays alive, hidden, so it is as it was left when
 * the one over it closes.
 */
export function NavigatorHost({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<readonly Pushed[]>([]);
  const count = useRef(0);

  const push = useCallback(<T,>(screen: (close: (result?: T) => void) => ReactNode): Promise<T | undefined> => {
    return new Promise<T | undefined>((resolve) => {
      count.current += 1;
      const id = count.current;
      let closed = false;
      const close = (result?: T) => {
        if (closed) return;
        closed = true;
        setStack((current) => current.filter((pushed) => pushed.id !== id));
        resolve(result);
      };
      setStack((current) => [...current, { id, node: screen(close), close: () => close() }]);
    });
  }, []);

  const pushed = useRef(stack);
  pushed.current = stack;
  const closeAll = useCallback(() => {
    for (const screen of [...pushed.current].reverse()) screen.close();
  }, []);

  const navigator = useMemo<Navigator>(
    () => ({ push, closeAll, depth: stack.length }),
    [push, closeAll, stack.length],
  );

  return (
    <NavigatorContext.Provider value={navigator}>
      <div className="app-layer" hidden={stack.length > 0}>
        {children}
      </div>
      {stack.map((pushed, i) => (
        <div key={pushed.id} className="app-layer" hidden={i < stack.length - 1}>
          <CloseScreenContext.Provider value={pushed.close}>{pushed.node}</CloseScreenContext.Provider>
        </div>
      ))}
    </NavigatorContext.Provider>
  );
}
