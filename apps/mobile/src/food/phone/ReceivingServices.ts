import type { CustomFoodRepository } from '../../domain/repositories/CustomFoodRepository';
import type { DayKindRepository } from '../../domain/repositories/DayKindRepository';
import type { DayMarkRepository } from '../../domain/repositories/DayMarkRepository';
import type { FoodDayReader } from '../../domain/repositories/FoodDayReader';
import type { FoodEntryBatchWriter } from '../../domain/repositories/FoodEntryBatchWriter';
import type { SetupReader } from '../../domain/repositories/SetupReader';
import type { WaterRepository } from '../../domain/repositories/WaterRepository';

/** What the receiving phone writes when a copy or a day arrives from the other phone (MM-715, MM-718, MM-719). */
export interface ReceivingServices {
  readonly food: FoodEntryBatchWriter & FoodDayReader;
  readonly water: WaterRepository;
  readonly customFoods: CustomFoodRepository;
  readonly setup: SetupReader;
  readonly dayKinds: DayKindRepository;
  readonly dayMarks: DayMarkRepository;
}
