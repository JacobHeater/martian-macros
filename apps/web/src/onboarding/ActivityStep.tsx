import { DailyActivity } from '../domain/DailyActivity';
import { dailyActivityDetail } from '../format/dailyActivityDetail';
import { dailyActivityLabel } from '../format/dailyActivityLabel';
import { ChoiceCard } from '../ui/ChoiceCard';

interface ActivityStepProps {
  activity: DailyActivity;
  onActivity: (activity: DailyActivity) => void;
}

/**
 * Step 4: how active the day is outside workouts. With training days, this
 * sets the starting calorie estimate until the app has measured the user's
 * own.
 */
export function ActivityStep({ activity, onActivity }: ActivityStepProps) {
  return (
    <>
      <h1 className="app-headline">Your day</h1>
      <p className="app-text app-muted">
        Outside of workouts, how much are you on your feet? This sets your starting calorie estimate until the app has
        measured your own.
      </p>
      <div className="app-gap-small" />
      {DailyActivity.values.map((option) => (
        <ChoiceCard
          key={option}
          label={dailyActivityLabel(option)}
          detail={dailyActivityDetail(option)}
          selected={activity === option}
          onPress={() => onActivity(option)}
        />
      ))}
    </>
  );
}
