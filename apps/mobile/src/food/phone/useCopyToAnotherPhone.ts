import { useApp } from '../../app/useApp';
import type { CalendarDate } from '../../domain/CalendarDate';
import type { CustomFood } from '../../domain/food/custom/CustomFood';
import type { FoodEntry } from '../../domain/FoodEntry';
import { currentValueOf } from '../../lang/currentValueOf';
import { useSendToAnotherPhone } from '../../settings/useSendToAnotherPhone';
import type { FoodCopy } from '../../transfer/FoodCopy';
import { foodCopyBytes } from '../../transfer/foodCopyBytes';
import { entriesCopiedTo } from '../entriesCopiedTo';

/**
 * "Copy to another phone" (MM-715): the foods go to the person's other phone by the move's flow (MM-698), the
 * other phone's code scanned here. What goes is what a copy to another day would log (MM-633): fresh entries for
 * the same day and meal, a logged meal as a new meal (MM-587), each with its time eaten, since it is the same
 * eating and not another (the owner, MM-717), and with them the Library foods
 * they were logged from (origin pack `custom`), so the other phone can keep those too. This phone's log is not
 * touched; the other phone asks before it adds anything.
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

  return (entries: readonly FoodEntry[], day: CalendarDate): Promise<void> =>
    send({
      what: 'foods',
      parcel: async () => {
        const copy: FoodCopy = { day, entries: entriesCopiedTo(day, entries, { keepTimeEaten: true }), foods: await libraryFoodsOf(entries) };
        return { kind: 'foods', foods: foodCopyBytes(copy) };
      },
    });
}
