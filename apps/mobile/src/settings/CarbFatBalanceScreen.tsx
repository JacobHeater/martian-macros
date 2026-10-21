import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { CarbFatBalance } from '../domain/CarbFatBalance';
import { TargetShape } from '../domain/TargetShape';
import { splitCarbsAndFat } from '../engine/splitCarbsAndFat';
import { Fmt } from '../format/Fmt';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { nextTargetShape } from '../state/nextTargetShape';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSegmented } from '../ui/MmSegmented';
import { MmSlider } from '../ui/MmSlider';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { Notice } from '../ui/Notice';
import { StatRow } from '../ui/StatRow';
import { useOverlays } from '../ui/useOverlays';

const positions = [
  { value: CarbFatBalance.moreCarbsFatShare, label: 'More carbs' },
  { value: CarbFatBalance.balancedFatShare, label: 'Balanced' },
  { value: CarbFatBalance.moreFatFatShare, label: 'More fat' },
] as const;

const percent = (share: number) => `${roundHalfAwayFromZero(share * 100)}%`;

/**
 * Settings > Coach > Carbs and fat balance (MM-122): after protein, how the
 * rest of the calories are split, as three named positions and a slider
 * between them that stops at the fat minimum. Protein and calories never
 * move. Built like the Training days row of Settings: the control sits in
 * its row, and the day it makes is said under it.
 */
export function CarbFatBalanceScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const shapes = useLoaded(state.targetShapes) ?? [];
  const limits = useCell(state.targetShapeLimits);
  const current = useCell(state.currentTargets)?.targets;
  const chosen = TargetShape.on(shapes, today)?.balance;
  // Until one is chosen, the day is Balanced (MM-486).
  const balance = chosen ?? CarbFatBalance.balanced;
  const save = async (next: CarbFatBalance) => {
    try {
      await services.targetShapes.saveTargetShape(nextTargetShape({ shapes, today, balance: next }));
    } catch {
      overlays.snack('Could not save the balance. Please try again.');
    }
  };
  // The fat minimum as a share of today's calories: the slider does not go under it (MM-28).
  const minimumShare =
    current === undefined || limits === undefined
      ? CarbFatBalance.moreCarbsFatShare
      : Math.min(CarbFatBalance.moreFatFatShare, (9 * limits.fatMinimumG(current.kcal)) / current.kcal);
  const lowest = Math.ceil(minimumShare * 100) / 100;
  const split =
    current === undefined || limits === undefined
      ? undefined
      : splitCarbsAndFat({ kcal: current.kcal, proteinG: current.proteinG, fatMinimumG: limits.fatMinimumG(current.kcal), balance });
  const shareGiven = split === undefined || current === undefined ? undefined : (9 * split.fatG) / current.kcal;
  // Fat gave way to the carbohydrate floor at these calories.
  const heldByFloor = shareGiven !== undefined && shareGiven < balance.fatShare - 0.005;

  return (
    <Screen title="Carbs and fat balance">
      <p className="app-text">
        For fat loss and muscle, this balance matters much less than calories and protein. Pick what you like eating.
      </p>
      <MmListGroup>
        <MmListRow
          leadingIcon="percent"
          title={`Fat: ${percent(Math.max(balance.fatShare, lowest))} of calories`}
          subtitle={chosen === undefined ? 'As the app set it until you choose: Balanced.' : undefined}
          entry={
            <>
              <MmSegmented<number>
                name="Carbs and fat balance"
                segments={positions}
                selected={chosen === undefined ? undefined : positions.find((p) => Math.abs(p.value - balance.fatShare) < 0.001)?.value}
                onChange={(share) => {
                  if (share !== undefined) void save(new CarbFatBalance({ fatShare: share, carbFloorOff: balance.carbFloorOff }));
                }}
              />
              <MmSlider
                name="Fat share of calories"
                value={Math.max(balance.fatShare, lowest)}
                min={lowest}
                max={CarbFatBalance.moreFatFatShare}
                divisions={Math.max(1, roundHalfAwayFromZero((CarbFatBalance.moreFatFatShare - lowest) * 100))}
                label={`Fat ${percent(Math.max(balance.fatShare, lowest))} of calories`}
                onChange={(share) =>
                  void save(new CarbFatBalance({ fatShare: roundHalfAwayFromZero(share * 100) / 100, carbFloorOff: balance.carbFloorOff }))
                }
              />
            </>
          }
        />
        <MmSwitchRow
          leadingIcon="food"
          title="I eat very low carb on purpose"
          subtitle={`Off, carbs stay at ${CarbFatBalance.carbFloorG} g or more, and fat gives way to them first. On, fat keeps its share even if carbs fall under ${CarbFatBalance.carbFloorG} g.`}
          value={balance.carbFloorOff}
          onChange={(off) => void save(new CarbFatBalance({ fatShare: balance.fatShare, carbFloorOff: off }))}
        />
      </MmListGroup>
      {heldByFloor ? (
        <Notice
          text={`At these calories, fat is ${percent(shareGiven ?? 0)} so carbs can stay at ${CarbFatBalance.carbFloorG} g. Turn on very low carb to keep fat at the share you chose.`}
        />
      ) : null}
      {current === undefined || split === undefined || limits === undefined ? null : (
        <MmSection icon="food" title="Your usual day">
          <StatRow label="Calories" value={Fmt.kcal(current.kcal)} />
          <StatRow label="Protein" value={Fmt.grams(current.proteinG)} />
          <StatRow label="Fat" value={Fmt.grams(split.fatG)} detail={`Never under your minimum of ${Fmt.grams(limits.fatMinimumG(current.kcal))}.`} />
          <StatRow label="Carbs" value={Fmt.grams(split.carbsG)} />
        </MmSection>
      )}
    </Screen>
  );
}
