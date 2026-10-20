const names: Readonly<Record<string, string>> = {
  off: 'Open Food Facts',
  fdc: 'USDA FoodData Central',
};

/** The name of a web service the app may ask for a food (MM-58). */
export const onlineSourceName = (id: string): string => names[id] ?? id;
