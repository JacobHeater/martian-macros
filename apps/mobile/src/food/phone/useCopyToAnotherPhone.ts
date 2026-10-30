import { useApp } from '../../app/useApp';
import type { CalendarDate } from '../../domain/CalendarDate';
import type { CustomFood } from '../../domain/food/custom/CustomFood';
import type { FoodEntry } from '../../domain/FoodEntry';
import type { WaterEntry } from '../../domain/water/WaterEntry';
import { currentValueOf } from '../../lang/currentValueOf';
import { useSendToAnotherPhone } from '../../settings/useSendToAnotherPhone';
import type { FoodCopy } from '../../transfer/FoodCopy';
import { foodCopyBytes } from '../../transfer/foodCopyBytes';
import { entriesCopiedTo } from '../entriesCopiedTo';

/**
 * "Copy to another phone" (MM-715, MM-718): the foods or the water go to the person's other phone by the move's
 * flow (MM-698), the other phone's code scanned here. Foods go as a copy to another day would log them (MM-633):
 * fresh entries for the same day and meal, a logged meal as a new meal (MM-587), each with its time eaten, since it
 * is the same eating and not another (the owner, MM-717), and with them the Library foods they were logged from
 * (origin pack `custom`), so the other phone can keep those too. Water goes as it was had: its day, amount and
 * moment. This phone's log is not touched; the other phone asks before it adds anything.
 */
export function useCopyToAnotherPhone() {
  const { services } = useApp();
  const send = useSendToAnotherPhone();

  /** The Library foods among `entries`' origins, each once, as this phone has them. */
  const libraryFoodsOf = async (entries: readonly FoodEntry[]): Promise<CustomFood[]> => {
    const wanted = new Set(entries.flatMap((entry) => (entry.portion?.origin?.packId === 'custom' ? [entry.portion.origin.foodId] : [])));
    if (wanted.size === 0) return [];
    const library = await currentValueOf(services.customFoods.watchCustomFoods());
    return library.filter((food) => wanted.has(food.id));
  };

  return (day: CalendarDate, { entries = [], water = [] }: { entries?: readonly FoodEntry[]; water?: readonly WaterEntry[] }): Promise<void> =>
    send({
      what: entries.length > 0 ? 'foods' : 'water',
      parcel: async () => {
        const copy: FoodCopy = {
          day,
          entries: entriesCopiedTo(day, entries, { keepTimeEaten: true }),
          water,
          foods: await libraryFoodsOf(entries),
        };
        return { kind: 'foods', foods: foodCopyBytes(copy) };
      },
    });
}
