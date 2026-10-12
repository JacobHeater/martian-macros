import type { CatalogFood } from '../foodCatalog';

/** Where a food's numbers came from, in words (MM-153). Never "verified". */
export function foodSourceLabel(food: CatalogFood): string {
  switch (food.source) {
    case 'usda_foundation':
    case 'usda_sr_legacy':
      return 'USDA, lab-analyzed';
    case 'usda_branded':
      return 'Manufacturer label (USDA)';
    case 'off':
      return 'Community label (Open Food Facts)';
    case 'user_scan':
      return 'Your label scan';
    case 'user':
      return 'Your food';
    case 'estimate':
      return 'Estimate';
    default:
      return 'Food database';
  }
}
