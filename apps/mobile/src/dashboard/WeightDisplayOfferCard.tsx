import { CalendarDate } from '../domain/CalendarDate';
import { weighsOftenEnoughToOffer } from '../engine/weighsOftenEnoughToOffer';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { Loadable } from '../state/Loadable';
import { useWeightDisplaySheet } from '../settings/useWeightDisplaySheet';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';

/**
 * The weight display offered once (MM-118): when more than one weigh-in a
 * day was recorded on five or more of the last fourteen days, and no
 * display has been chosen. Offered as a choice with no comment on the
 * behavior; either answer is remembered and it is never offered again.
 * Built as the relief offer above it is (rule 9): a notice with its
 * choices under it.
 */
export function WeightDisplayOfferCard() {
  const { services, state } = useApp();
  const today = useCell(state.today);
  const offered = Loadable.valueOf(useCell(state.weightDisplayOffered));
  const chosen = useCell(state.chosenWeightDisplay);
  const imported = Loadable.valueOf(useCell(state.importedWeighIns)) ?? [];
  const choose = useWeightDisplaySheet();
  if (offered !== false || !chosen.ready || Loadable.valueOf(chosen) !== undefined) return null;
  const days = imported.map((weighIn) => ({ date: CalendarDate.fromDate(weighIn.day), readings: weighIn.readings }));
  if (!weighsOftenEnoughToOffer({ days, today })) return null;
  const answered = () => services.preferences.markWeightDisplayOffered();
  return (
    <div className="app-stack-item">
      <Notice
        icon="scale"
        title="How much of your weight to show"
        text={
          'You can see every weigh-in, only the trend, or no weight at all, with progress said in words. ' +
          'The coach works the same whichever you choose.'
        }
        action={
          <div className="app-row">
            <MmButton
              label="Choose"
              kind="secondary"
              onPress={() =>
                void (async () => {
                  await choose();
                  await answered();
                })()
              }
            />
            <MmButton label="Not now" kind="text" onPress={() => void answered()} />
          </div>
        }
      />
    </div>
  );
}
