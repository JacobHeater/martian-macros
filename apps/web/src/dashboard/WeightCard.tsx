import { TrendSparkline } from '../charts/TrendSparkline';
import { TrendStats } from '../charts/TrendStats';
import type { WeightTrendPoint } from '../engine/WeightTrendPoint';
import type { Fmt } from '../format/Fmt';
import { InfoCard } from '../ui/InfoCard';
import { NumberEntryCard } from '../ui/NumberEntryCard';

interface WeightCardProps {
  trend: readonly WeightTrendPoint[];
  weighedInToday: boolean;
  fmt: Fmt;
  onSaveWeight: (kg: number) => Promise<void>;
  onPress: () => void;
}

/**
 * Trend weight with its 30-day line, or, when there is no weigh-in today, a
 * field to enter one.
 */
export function WeightCard({ trend, weighedInToday, fmt, onSaveWeight, onPress }: WeightCardProps) {
  if (!weighedInToday || trend.length === 0) {
    return (
      <NumberEntryCard
        title="Today’s weigh-in"
        unit={fmt.weightUnit}
        initial={undefined}
        hint="First thing in the morning, after the bathroom."
        onSave={(value) => onSaveWeight(fmt.weightToKg(value))}
      />
    );
  }
  return (
    <InfoCard title="Weight" onPress={onPress}>
      <TrendStats trend={trend} fmt={fmt} />
      <div className="app-gap-small" />
      <TrendSparkline trend={trend} />
    </InfoCard>
  );
}
