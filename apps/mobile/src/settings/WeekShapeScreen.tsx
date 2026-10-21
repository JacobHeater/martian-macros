import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import { TargetShape } from '../domain/TargetShape';
import { WeekShape } from '../domain/WeekShape';
import { shapeWeek } from '../engine/shapeWeek';
import { usualTrainingWeekdays } from '../engine/usualTrainingWeekdays';
import { Fmt } from '../format/Fmt';
import { weekdayLabel } from '../format/weekdayLabel';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { dayTargetsOn } from '../state/dayTargetsOn';
import { nextTargetShape } from '../state/nextTargetShape';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSegmented } from '../ui/MmSegmented';
import { Notice } from '../ui/Notice';
import { StatRow } from '../ui/StatRow';
import { useOverlays } from '../ui/useOverlays';
import './settings.css';

/** Monday first, as a week is read. */
const weekOrder = [1, 2, 3, 4, 5, 6, 0] as const;

const names = (weekdays: Iterable<number>) =>
  weekOrder.filter((day) => [...weekdays].includes(day)).map(weekdayLabel).join(', ');

/**
 * Settings > Coach > Week shape (MM-124): up to three higher days, how much
 * higher, and the week it makes, with the week's budget, what has been eaten
 * and the average so far. Off by default. The app never takes calories back
 * or offers banked ones, so nothing here says what is left for the week.
 * Built like Period days on Progress (chips that wrap, one tap each) and the
 * Training days row of Settings (the control sits in its row).
 */
export function WeekShapeScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const setup = useLoaded(state.setup);
  const shapes = useLoaded(state.targetShapes) ?? [];
  const limits = useCell(state.targetShapeLimits);
  const history = useLoaded(state.targetsHistory) ?? [];
  const intake = useLoaded(state.intakeDays) ?? [];
  const workouts = useLoaded(state.workouts) ?? [];
  const current = useCell(state.currentTargets)?.targets;
  const week = TargetShape.on(shapes, today)?.week ?? WeekShape.flat;
  const training = usualTrainingWeekdays({ workouts, today });

  const save = async (next: WeekShape) => {
    try {
      await services.targetShapes.saveTargetShape(nextTargetShape({ shapes, today, week: next }));
    } catch {
      overlays.snack('Could not save the week shape. Please try again.');
    }
  };
  const toggle = (weekday: number) => {
    const days = new Set(week.higherDays);
    if (days.has(weekday)) days.delete(weekday);
    else if (days.size >= WeekShape.maxHigherDays) {
      overlays.snack(`Up to ${WeekShape.maxHigherDays} higher days. Take one off first.`);
      return;
    } else days.add(weekday);
    void save(new WeekShape({ higherDays: days, raise: week.raise }));
  };

  const targetsAllowed =
    setup !== undefined && CoachingPolicy.derive({ profile: setup.profile, screening: setup.screening, today }).targetsAllowed;
  const shaped = current === undefined || limits === undefined ? undefined : shapeWeek({ flatKcal: current.kcal, floorKcal: limits.floorKcal, week });
  // This week, Monday to Sunday: each day's own target, so a change part way keeps the days before it.
  const monday = today.addDays(-((today.weekday + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => monday.addDays(i));
  const budget = days.reduce((sum, day) => sum + (dayTargetsOn({ history, day, shapes, limits, targetsAllowed })?.kcal ?? 0), 0);
  const eatenDays = intake.filter((d) => !d.date.isBefore(monday) && !d.date.isAfter(today) && d.kcal > 0);
  const eaten = eatenDays.reduce((sum, d) => sum + d.kcal, 0);
  // Today is still being eaten, so the average is of the days before it.
  const before = eatenDays.filter((d) => d.date.isBefore(today));
  const average = before.length === 0 ? undefined : before.reduce((sum, d) => sum + d.kcal, 0) / before.length;

  return (
    <Screen title="Week shape">
      <p className="app-text">
        Give some days more room and the others a little less. The week’s total stays the same, so this is about what suits
        your week, not about your metabolism.
      </p>
      <MmListGroup>
        <MmListRow
          leadingIcon="calendar"
          title="Higher days"
          subtitle={week.isFlat ? 'None: every day has the same target.' : undefined}
          entry={
            <div className="settings-weekdays" role="group" aria-label="Higher days">
              {weekOrder.map((weekday) => (
                <MmChoiceChip
                  key={weekday}
                  label={weekdayLabel(weekday)}
                  selected={week.higherDays.has(weekday)}
                  onSelect={() => toggle(weekday)}
                />
              ))}
            </div>
          }
        />
        <MmListRow
          leadingIcon="trend"
          title="How much higher"
          entry={
            <MmSegmented<number>
              name="How much higher"
              segments={WeekShape.raises.map((raise) => ({ value: raise, label: `${roundHalfAwayFromZero(raise * 100)}%` }))}
              selected={week.raise}
              onChange={(raise) => {
                if (raise !== undefined) void save(new WeekShape({ higherDays: week.higherDays, raise }));
              }}
            />
          }
        />
        {training.length === 0 || names(training) === names(week.higherDays) ? null : (
          <MmListRow
            leadingIcon="train"
            title="Use my training days"
            subtitle={`Makes your usual training days lately the higher days: ${names(training)}.`}
            onPress={() => void save(new WeekShape({ higherDays: training, raise: week.raise }))}
          />
        )}
      </MmListGroup>
      {shaped?.reducedBy === undefined || limits === undefined || current === undefined ? null : (
        <Notice
          kind="caution"
          text={
            shaped.reducedBy === 'floor'
              ? `The other days would go under your calorie floor of ${Fmt.kcal(limits.floorKcal)}, so the higher days are smaller: ${Fmt.kcal(shaped.higherKcal)}.`
              : `No day goes more than ${roundHalfAwayFromZero(WeekShape.maxLowering * 100)}% under your usual ${Fmt.kcal(current.kcal)}, so the higher days are smaller: ${Fmt.kcal(shaped.higherKcal)}.`
          }
        />
      )}
      {shaped === undefined ? null : (
        <MmSection
          icon="calendarCheck"
          title="Your week"
          summary="Protein is the same every day; carbs, then fat, carry the difference."
        >
          {weekOrder.map((weekday) => (
            <StatRow
              key={weekday}
              label={weekdayLabel(weekday)}
              value={Fmt.kcal(week.higherDays.has(weekday) ? shaped.higherKcal : shaped.lowerKcal)}
              detail={week.higherDays.has(weekday) ? 'Higher day' : undefined}
            />
          ))}
        </MmSection>
      )}
      {budget === 0 ? null : (
        <MmSection
          icon="report"
          title="This week"
          summary="Each day keeps its planned target. Going over or under never moves another day."
        >
          <StatRow label="Budget, Monday to Sunday" value={Fmt.kcal(budget)} />
          <StatRow label="Eaten so far" value={Fmt.kcal(eaten)} />
          <StatRow
            label="Average so far"
            value={average === undefined ? 'No day before today yet' : `${Fmt.kcal(average)} a day`}
          />
        </MmSection>
      )}
    </Screen>
  );
}
