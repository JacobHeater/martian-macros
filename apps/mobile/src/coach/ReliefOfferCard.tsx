import { paceLabel } from '../format/paceLabel';
import { reliefOfferText } from '../format/reliefOfferText';
import { reliefPaceText } from '../format/reliefPaceText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';

/**
 * The offer to ease a deficit (MM-117, MM-135): a two-week break at
 * maintenance now, a slower pace from the next check-in, or carry on. Two
 * things bring it, told apart by the title and icon: recovery is failing
 * (the heart), or the deficit has run twelve unbroken weeks (the calendar);
 * the slower pace is offered with the first only. Short sleep over a
 * fortnight of recorded nights is a recovery signal of its own (MM-252). Never an automatic
 * change. Carrying on is one tap and free of comment, on its own line under
 * the choices (the panel's PD-2: three buttons wrapped by overflow). Empty
 * when no offer is due.
 */
export function ReliefOfferCard() {
  const { services, state } = useApp();
  const offer = useCell(state.reliefOffer);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  const paces = useCell(state.paceOptions);
  if (offer === undefined || setup === undefined) return null;
  const words = reliefOfferText(offer);
  const slower = offer.slowerPace;
  const suggestsBreak = offer.suggestion === 'break';
  // The slower pace by its name and what it costs, as the pace choice says it (MM-128).
  const slowerOption = slower === undefined ? undefined : paces?.find((option) => Math.abs(option.fraction - slower) < 1e-9);
  const paceText = slowerOption === undefined ? undefined : reliefPaceText(slowerOption);
  const text = [words.body, words.suggestion, paceText, words.sleep].filter((part) => part !== undefined && part !== '').join('\n\n');
  return (
    <div className="app-stack-item">
      <Notice
        icon={offer.reason === 'longDeficit' ? 'calendar' : 'heart'}
        title={words.title}
        text={text}
        action={
          <>
            <div className="app-row">
              <MmButton
                label="Take a two-week break"
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
            </div>
            <div className="app-row">
              <MmButton
                label="Carry on"
                kind="text"
                onPress={() => void services.setup.saveSetup(setup.copyWith({ reliefAnsweredOn: today }))}
              />
            </div>
          </>
        }
      />
    </div>
  );
}
