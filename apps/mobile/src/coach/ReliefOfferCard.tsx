import type { UserSetup } from '../domain/UserSetup';
import { DietBreakRule } from '../engine/DietBreakRule';
import { Fmt } from '../format/Fmt';
import { paceLabel } from '../format/paceLabel';
import { reliefOfferText } from '../format/reliefOfferText';
import { reliefPaceText } from '../format/reliefPaceText';
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
 * the choices (the panel's PD-2: three buttons wrapped by overflow). Empty
 * when no offer is due.
 *
 * Both choices are secondary (the panel's MM-117 review): the offer sits on
 * the Dashboard above the day's own action, and an Ember fill would make it
 * the screen's one primary. The coach's suggestion comes first, is said in
 * the text, and is heard as the suggestion. A choice is confirmed by a snack
 * with Undo, which puts the setup and that day's targets back as they were,
 * on that day only.
 */
export function ReliefOfferCard() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const offer = useCell(state.reliefOffer);
  const setup = useLoaded(state.setup);
  const history = useLoaded(state.targetsHistory);
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

  /** Saves `changed`, then offers to put back the setup and the day's targets as they were. */
  const choose = async (changed: UserSetup, done: string) => {
    const before = setup;
    const todays = history?.find((record) => record.effectiveFrom === today);
    await services.setup.saveSetup(changed);
    overlays.snack(done, {
      label: 'Undo',
      onAction: () =>
        void (async () => {
          // For that day only: by tomorrow the choice has run a day.
          if (state.today.value !== today) return;
          await services.setup.saveSetup(before);
          // The targets the choice issued go, and any the day had before come back.
          if (todays === undefined) await services.targets.removeTargets(today);
          else await services.targets.saveTargets(todays);
        })(),
    });
  };

  const breakButton = (
    <MmButton
      key="break"
      label="Take a two-week break"
      name={suggestsBreak ? 'Take a two-week break, the coach’s suggestion' : undefined}
      kind="secondary"
      onPress={() =>
        void choose(
          setup.copyWith({ maintenanceWeekFrom: today, reliefAnsweredOn: today }),
          // Until the day the next check-in comes, as the Dashboard says it.
          `Break started: maintenance until ${Fmt.shortDay(today.addDays(DietBreakRule.breakWeeks * 7))}`,
        )
      }
    />
  );
  const slowButton =
    slower === undefined ? null : (
      <MmButton
        key="slow"
        label={`Slow to ${paceLabel(slower)}`}
        name={suggestsBreak ? undefined : `Slow to ${paceLabel(slower)}, the coach’s suggestion`}
        kind="secondary"
        onPress={() =>
          void choose(
            // A pace change acts at once (MM-128), and a slower pace only raises the target.
            setup.copyWith({ requestedLossFraction: slower, reliefAnsweredOn: today, paceChangedOn: today }),
            `Pace slowed to ${paceLabel(slower)}`,
          )
        }
      />
    );
  return (
    <div className="app-stack-item">
      <Notice
        icon={offer.reason === 'longDeficit' ? 'calendar' : 'heart'}
        title={words.title}
        text={text}
        action={
          <>
            {/* The coach's suggestion first. */}
            <div className="app-row">{suggestsBreak ? [breakButton, slowButton] : [slowButton, breakButton]}</div>
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
