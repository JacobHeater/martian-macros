import type { HealthSample } from '../healthIngest/HealthSample';
import { healthSourceName } from '../healthIngest/healthSourceName';
import { primaryWeightSource } from '../healthIngest/primaryWeightSource';
import { compareStrings } from '../lang/compareStrings';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';

/** The option that goes back to choosing by the most weigh-ins; no source id is empty. */
const automatic = '';

/**
 * The scale whose weigh-ins count first (MM-71), laid out as Appearance is
 * (rule 9): one row with the scale in force, which opens the chooser. Until
 * the person names one, the source with the most weigh-ins in thirty days
 * counts, and "Automatic" goes back to that. Shown only when weigh-ins come
 * from more than one source; a source the platform did not name is never
 * offered by its package id (MM-395).
 */
export function PrimaryScaleRow({ weighIns }: { weighIns: readonly HealthSample[] }) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const chosen = useLoaded(state.primaryScale);
  const names = new Map<string, string>();
  for (const sample of weighIns) {
    const name = healthSourceName(sample);
    if (name !== undefined) names.set(sample.sourceId, name);
  }
  const sources = new Set(weighIns.map((sample) => sample.sourceId));
  if (sources.size < 2 || names.size === 0) return null;

  const counting = primaryWeightSource(weighIns, { asOf: services.clock.now() });
  const countingName = counting === undefined ? undefined : names.get(counting);
  const chosenName = chosen === undefined ? undefined : names.get(chosen);
  const subtitle =
    chosen === undefined
      ? countingName === undefined
        ? 'Automatic: the source with the most weigh-ins in 30 days.'
        : `Automatic: ${countingName}, with the most weigh-ins in 30 days.`
      : chosenName === undefined
        ? 'A scale with no weigh-ins kept. Every source’s readings count alike.'
        : `${chosenName}. Its weigh-ins count before any other source’s.`;

  const choose = async () => {
    const picked = await overlays.options<string>({
      title: 'Primary scale',
      options: [
        { value: automatic, label: 'Automatic' },
        ...[...names].sort(([, a], [, b]) => compareStrings(a, b)).map(([value, label]) => ({ value, label })),
      ],
      selected: chosen ?? automatic,
    });
    if (picked === undefined) return;
    await save(picked.value === automatic ? undefined : picked.value);
  };

  // A failed change is said as Settings says one, in a snack outside the rows (MM-347).
  const save = async (sourceId: string | undefined): Promise<void> => {
    try {
      await services.preferences.savePrimaryScale(sourceId);
    } catch {
      overlays.snack('Your primary scale could not be saved. Nothing was changed.', {
        label: 'Try again',
        onAction: () => void save(sourceId),
      });
    }
  };

  return (
    <MmListRow
      leadingIcon="star"
      title="Primary scale"
      subtitle={subtitle}
      trailingAction={<MmIconButton icon="edit" label="Change primary scale" opens="listbox" onPress={() => void choose()} />}
    />
  );
}
