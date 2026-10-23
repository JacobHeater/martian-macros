import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { CloseScreenContext } from './CloseScreenContext';
import type { Navigator } from './Navigator';
import { NavigatorContext } from './NavigatorContext';
import { useEdgeSwipe } from '../ui/useEdgeSwipe';

interface Pushed {
  readonly id: number;
  readonly node: ReactNode;
  /** Closes as simply left. False when it had already closed. */
  readonly close: () => boolean;
}

/**
 * Shows `children`, and over them whatever screens have been pushed. A
 * screen that is covered stays alive, hidden, so it is as it was left when
 * the one over it closes. A swipe in from either side closes the one on top
 * (MM-578).
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
      const tryClose = () => {
        if (closed) return false;
        close();
        return true;
      };
      setStack((current) => [...current, { id, node: screen(close), close: tryClose }]);
    });
  }, []);

  const pushed = useRef(stack);
  pushed.current = stack;
  const closeAll = useCallback(() => {
    for (const screen of [...pushed.current].reverse()) screen.close();
  }, []);

  const closeTop = useCallback(() => {
    // From the top down, past any already closed just now.
    for (let at = pushed.current.length - 1; at >= 0; at -= 1) {
      if (pushed.current[at]?.close() === true) return true;
    }
    return false;
  }, []);

  const top = useRef<HTMLDivElement>(null);
  const swipeBack = useEdgeSwipe(top, () => true, () => void closeTop());

  const navigator = useMemo<Navigator>(
    () => ({ push, closeAll, closeTop, depth: stack.length }),
    [push, closeAll, closeTop, stack.length],
  );

  return (
    <NavigatorContext.Provider value={navigator}>
      <div className="app-layer" hidden={stack.length > 0}>
        {children}
      </div>
      {stack.map((pushed, i) => {
        const onTop = i === stack.length - 1;
        return (
          <div key={pushed.id} ref={onTop ? top : undefined} className="app-layer" hidden={!onTop} {...(onTop ? swipeBack : {})}>
            <CloseScreenContext.Provider value={pushed.close}>{pushed.node}</CloseScreenContext.Provider>
          </div>
        );
      })}
    </NavigatorContext.Provider>
  );
}
