import type { CalendarDate } from '../domain/CalendarDate';
import { Micronutrient } from '../domain/food/micros/Micronutrient';
import { MicronutrientGroup } from '../domain/food/micros/MicronutrientGroup';
import type { MicronutrientTotal } from '../domain/food/micros/MicronutrientTotal';
import { microsDayOf } from '../domain/food/micros/microsDayOf';
import { referenceAmount } from '../domain/food/micros/referenceAmount';
import { ReferenceWithheld } from '../domain/food/micros/ReferenceWithheld';
import { topSourcesOf } from '../domain/food/micros/topSourcesOf';
import type { FoodEntry } from '../domain/FoodEntry';
import type { NutritionGoals } from '../domain/NutritionGoals';
import type { UserSetup } from '../domain/UserSetup';
import { nutrientAmount } from '../format/nutrientAmount';
import { MmNutrientRow } from '../ui/MmNutrientRow';
import { SectionLabel } from '../ui/SectionLabel';
import './food.css';

interface MicrosPanelProps {
  entries: readonly FoodEntry[];
  /** Without a profile there are no reference amounts. */
  setup: UserSetup | undefined;
  today: CalendarDate;
  goals: NutritionGoals;
}

const withheldLine: Readonly<Record<ReferenceWithheld, string>> = {
  careTeam: 'Reference amounts are different in pregnancy and breastfeeding; ask your care team which apply.',
  kidney: 'With kidney disease, some of these amounts may be different for you; ask your care team.',
  surgery: 'After bariatric surgery, your care team sets these amounts; ask them which apply.',
  young: 'Reference amounts are different under 19.',
};

/**
 * What "reference" means, said once above the rows (the panel's UX-6, MN-4,
 * SA-1): a usual daily amount for a healthy adult, averaged over many days.
 */
const referenceLine = (setup: UserSetup) =>
  `Reference: a daily amount for a healthy ${setup.profile.sex === 'male' ? 'man' : 'woman'} of your age, ` +
  'as an average over many days, not one day. If a clinician gave you amounts, use theirs.';

/** "from 4 of 7 foods", when some of the day's foods do not state the nutrient. */
const coverage = (total: MicronutrientTotal) =>
  total.partial ? `from ${total.stated} of ${total.foods} ${total.foods === 1 ? 'food' : 'foods'}` : undefined;

const joined = (...parts: (string | undefined)[]) => {
  const present = parts.filter((p) => p !== undefined);
  return present.length === 0 ? undefined : present.join(' · ');
};

/**
 * The day's micronutrients on the nutrition card (MM-310): minerals,
 * vitamins, then the label's other lines, each with what today's foods
 * state and how many of them state it. A vitamin or mineral is drawn
 * against its reference amount; sodium against the user's limit when one is
 * set (MM-311). Nothing changes colour for being under or over. Each row
 * opens to the five foods that add the most of it (MM-561).
 */
export function MicrosPanel({ entries, setup, today, goals }: MicrosPanelProps) {
  const totals = microsDayOf(entries);
  const withheld = setup === undefined ? undefined : ReferenceWithheld.of(setup, today);
  const reference = (nutrient: Micronutrient) =>
    setup === undefined || withheld !== undefined
      ? undefined
      : referenceAmount(nutrient, { sex: setup.profile.sex, age: setup.profile.ageOn(today) });
  const limit = goals.sodiumLimitMg;

  const row = (total: MicronutrientTotal) => {
    const n = total.nutrient;
    const name = Micronutrient.label(n);
    const sources = topSourcesOf(entries, n).map((s) => ({ name: s.name, figures: nutrientAmount(n, s.amount) }));
    if (n === 'sodium' && limit !== undefined) {
      const over = total.over(limit);
      return (
        <MmNutrientRow
          key={n}
          name={name}
          figures={`${nutrientAmount(n, total.known).replace(/ mg$/, '')} of ${nutrientAmount(n, limit)}`}
          note={joined(
            coverage(total),
            over ? `${nutrientAmount(n, total.known - limit)} over your limit` : 'your limit',
          )}
          amount={total.known}
          reference={limit}
          sources={sources}
        />
      );
    }
    const ref = reference(n);
    return (
      <MmNutrientRow
        key={n}
        name={name}
        figures={nutrientAmount(n, total.known)}
        note={joined(coverage(total), ref === undefined ? undefined : `reference ${nutrientAmount(n, ref)}`)}
        amount={total.known}
        reference={ref}
        sources={sources}
      />
    );
  };

  // With nothing logged there is nothing to list, and the screen already says so (MM-316).
  if (entries.length === 0) return null;
  return (
    <div className="food-micros">
      {withheld !== undefined ? (
        <p className="app-caption app-muted food-micros-line">{withheldLine[withheld]}</p>
      ) : setup !== undefined ? (
        <p className="app-caption app-muted food-micros-line">{referenceLine(setup)}</p>
      ) : null}
      {MicronutrientGroup.values.map((group) => {
        const inGroup = totals.filter((t) => Micronutrient.group(t.nutrient) === group);
        // The nutrients no food states are named once, in a line, not a row each.
        const unstated = inGroup.filter((t) => t.noData).map((t) => Micronutrient.label(t.nutrient));
        return (
          <div key={group} className="food-micros-group">
            <SectionLabel text={MicronutrientGroup.label(group)} />
            {inGroup.filter((t) => !t.noData).map(row)}
            {unstated.length === 0 ? null : (
              <p className="app-caption app-muted food-micros-line">Not stated by any food: {unstated.join(', ')}.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
