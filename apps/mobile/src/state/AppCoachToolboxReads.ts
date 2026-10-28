import type { ExecutiveBrief } from '../engine/analysis/ExecutiveBrief';
import type { FoodAnalysisInput } from '../engine/analysis/food/FoodAnalysisInput';
import type { CatalogSearch } from '../foodCatalog/CatalogSearch';
import type { CatalogServingLookup } from '../foodCatalog/CatalogServingLookup';

/** What the toolbox reads of the app, each at the moment a tool is called. */
export interface AppCoachToolboxReads {
  readonly foodInput: () => FoodAnalysisInput | undefined;
  readonly brief: () => ExecutiveBrief | undefined;
  readonly catalog: () => (CatalogSearch & CatalogServingLookup) | undefined;
}

