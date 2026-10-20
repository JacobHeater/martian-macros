import { paceLabel } from '../format/paceLabel';
import { reliefOfferText } from '../format/reliefOfferText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';

/**
 * The offer to ease a deficit when recovery is failing (MM-117), or sleep has
 * run short for a fortnight (MM-252): a maintenance week now, a slower pace
 * from the next check-in, or carry on. Never an automatic change. Carrying on
 * is one tap and free of comment. Empty when no offer is due.
 */
export function ReliefOfferCard() {
  const { services, state } = useApp();
  const offer = useCell(state.reliefOffer);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  if (offer === undefined || setup === undefined) return null;
  const words = reliefOfferText(offer);
  const slower = offer.slowerPace;
  const suggestsBreak = offer.suggestion === 'maintenanceWeek';
  const text = [words.body, words.suggestion, words.sleep].filter((part) => part !== undefined && part !== '').join('\n\n');
  return (
    <div className="app-stack-item">
      <Notice
        icon="heart"
        title={words.title}
        text={text}
        action={
          <div className="app-row">
            <MmButton
              label="Take a maintenance week"
              kind={suggestsBreak ? 'primary' : 'secondary'}
              onPress={() =>
                void services.setup.saveSetup(setup.copyWith({ maintenanceWeekFrom: today, reliefAnsweredOn: today }))
              }
            />
            {slower === undefined ? null : (
              <MmButton
                label={`Slow to ${paceLabel(slower)}`}
                kind={suggestsBreak ? 'secondary' : 'primary'}
                onPress={() =>
                  void services.setup.saveSetup(
                    // A pace change acts at once (MM-128), and a slower pace only raises the target.
                    setup.copyWith({ requestedLossFraction: slower, reliefAnsweredOn: today, paceChangedOn: today }),
                  )
                }
              />
            )}
            <MmButton
              label="Carry on"
              kind="text"
              onPress={() => void services.setup.saveSetup(setup.copyWith({ reliefAnsweredOn: today }))}
            />
          </div>
        }
      />
    </div>
  );
}
