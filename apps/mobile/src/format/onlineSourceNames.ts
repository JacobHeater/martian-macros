import { onlineSourceName } from './onlineSourceName';

/** The services named together: "Open Food Facts and USDA FoodData Central" (MM-58). */
export function onlineSourceNames(ids: readonly string[]): string {
  const names = ids.map(onlineSourceName);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
