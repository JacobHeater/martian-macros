import type { UsualDay } from './UsualDay';

/** What the usual day had eaten by `minute`, between its 15-minute points (MM-572); undefined until it is drawn. */
export function usualKcalAt(usual: UsualDay, minute: number): number | undefined {
  const curve = usual.curve;
  if (curve === undefined || curve.length === 0) return undefined;
  const after = curve.findIndex(([at]) => at >= minute);
  if (after === -1) return (curve.at(-1) as readonly [number, number])[1];
  if (after === 0) return (curve[0] as readonly [number, number])[1];
  const [m0, k0] = curve[after - 1] as readonly [number, number];
  const [m1, k1] = curve[after] as readonly [number, number];
  return k0 + ((k1 - k0) * (minute - m0)) / (m1 - m0);
}
