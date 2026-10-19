import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';

/** Whether carbs are shown net of fiber and sugar alcohols (MM-396): on until switched off, and while it loads. */
export function useNetCarbs(): boolean {
  const { state } = useApp();
  return useLoaded(state.netCarbs) ?? true;
}
