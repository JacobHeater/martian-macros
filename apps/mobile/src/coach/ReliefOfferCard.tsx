import { oneWeekBreakText } from '../format/oneWeekBreakText';
import { paceLabel } from '../format/paceLabel';
import { reliefOfferText } from '../format/reliefOfferText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';
import { useOverlays } from '../ui/useOverlays';

/**
 * The offer to ease a deficit (MM-117, MM-135): a two-week break at
 * maintenance now, a slower pace from the next check-in, or carry on. Two
 * things bring it, told apart by the title and icon: recovery is failing
 * (the heart), or the deficit has run twelve unbroken weeks (the calendar);
 * the slower pace is offered with the first only. Short sleep over a
 * fortnight of recorded nights is a recovery signal of its own (MM-252). Never an automatic
 * change. Carrying on is one tap and free of comment, on its own line under
 * the choices (the panel's PD-2: three buttons wrapped by overflow). One
 * week in place of two is a quiet choice on its own line under them, asked
 * once with what a week gives up (MM-432). Empty when no offer is due.
 */
export function ReliefOfferCard() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const offer = useCell(state.reliefOffer);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  if (offer === undefined || setup === undefined) return null;
  const words = reliefOfferText(offer);
  const slower = offer.slowerPace;
  const suggestsBreak = offer.suggestion === 'break';
  const text = [words.body, words.suggestion, words.sleep].filter((part) => part !== undefined && part !== '').join('\n\n');
  // The length chosen is kept with the day (MM-432), so it survives until the break's targets are issued.
  const takeBreak = (breakWeeks: 1 | 2) =>
    services.setup.saveSetup(setup.copyWith({ maintenanceWeekFrom: today, breakWeeks, reliefAnsweredOn: today }));
  const takeOneWeek = async () => {
    if (await overlays.confirm(oneWeekBreakText)) await takeBreak(1);
  };
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
                onPress={() => void takeBreak(2)}
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
            {/* Under the two weeks it shortens, and apart from "Carry on" (MM-432). */}
            <div className="app-row">
              <MmButton label="One week instead" kind="text" onPress={() => void takeOneWeek()} />
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
