import { useEffect, useState } from 'react';

/**
 * What `load` gives, once it has; undefined until then and after it fails.
 * It is asked again whenever `key` changes, and an answer that arrives
 * after a newer question is dropped. With `keep`, the last answer stays
 * while a newer question is pending, so a list does not empty between one
 * question and the next answer (MM-408).
 */
export function useAsync<T>(load: () => Promise<T>, key: string, { keep = false }: { keep?: boolean } = {}): T | undefined {
  const [answer, setAnswer] = useState<{ key: string; value: T }>();
  useEffect(() => {
    let current = true;
    load().then(
      (value) => {
        if (current) setAnswer({ key, value });
      },
      () => undefined,
    );
    return () => {
      current = false;
    };
    // `load` is a new function on every draw; the key says when to ask again.
  }, [key]);
  if (answer === undefined) return undefined;
  return answer.key === key || keep ? answer.value : undefined;
}
