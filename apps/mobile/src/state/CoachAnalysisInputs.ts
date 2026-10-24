import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import type { Pause } from '../domain/Pause';
import type { FoodRangeReader } from '../domain/repositories/FoodRangeReader';
import type { IntakeReader } from '../domain/repositories/IntakeReader';
import type { WaterReader } from '../domain/repositories/WaterReader';
import type { FoodAnalysisInput } from '../engine/analysis/food/FoodAnalysisInput';
import type { TrainingAnalysisInput } from '../engine/analysis/TrainingAnalysisInput';
import type { TrendLogRepository } from '../engine/trends/TrendLogRepository';
import type { CatalogFoodLookup } from '../foodCatalog/CatalogFoodLookup';
import type { CatalogSearch } from '../foodCatalog/CatalogSearch';
import type { CatalogServingLookup } from '../foodCatalog/CatalogServingLookup';
import type { Cell } from './Cell';

/**
 * What the Coach tab's analysis reads (MM-610). Each function is read
 * inside a derived cell, so the cells it reads are followed: undefined
 * while what it rests on is still being read.
 */
export interface CoachAnalysisInputs {
  readonly today: Cell<CalendarDate>;
  readonly food: FoodRangeReader;
  readonly intake: IntakeReader;
  readonly water: Pick<WaterReader, 'watchWaterSince'>;
  readonly trendLog: TrendLogRepository;
  /** The installed catalog, for a trade's catalog food (MM-607); undefined until it is read. */
  readonly catalog: () => (CatalogSearch & CatalogFoodLookup & CatalogServingLookup) | undefined;
  /** The food analysis's input but its days (entries and intake) and the catalog. */
  readonly foodInput: () => Omit<FoodAnalysisInput, 'entries' | 'intake' | 'catalog'> | undefined;
  /** The training analysis's input but the water and the whole days. */
  readonly trainingInput: () => Omit<TrainingAnalysisInput, 'water' | 'wholeDays'> | undefined;
  readonly pauses: () => readonly Pause[] | undefined;
  readonly plannedShare: () => (date: CalendarDate) => number;
  /** The whole days of eating the training signals read (`usableIntakeDays` of the judged intake). */
  readonly wholeDays: () => readonly IntakeDay[] | undefined;
  /** The under-eating finding holds, and whether its notice is shown (not put off). */
  readonly underEating: () => { readonly holds: boolean; readonly noticeShown: boolean };
}
