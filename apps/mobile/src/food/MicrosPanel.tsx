import type { CalendarDate } from '../domain/CalendarDate';
import { Micronutrient } from '../domain/food/micros/Micronutrient';
import { MicronutrientGroup } from '../domain/food/micros/MicronutrientGroup';
import type { MicronutrientTotal } from '../domain/food/micros/MicronutrientTotal';
import { microsDayOf } from '../domain/food/micros/microsDayOf';
import { referenceAmount } from '../domain/food/micros/referenceAmount';
import { ReferenceWithheld } from '../domain/food/micros/ReferenceWithheld';
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
  careTeam: 'Reference amounts are different in pregnancy and breastfeeding; your care team can say which apply.',
  kidney: 'With kidney disease, your care team sets these amounts.',
  young: 'Reference amounts are different under 19.',
};

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
 * set (MM-311). Nothing changes colour for being under or over.
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
    if (total.noData) return <MmNutrientRow key={n} name={name} figures="No data yet" />;
    if (n === 'sodium' && limit !== undefined) {
      const over = total.over(limit);
      return (
        <MmNutrientRow
          key={n}
          name={name}
          figures={
            over
              ? `Over your limit by ${nutrientAmount(n, total.known - limit)}`
              : `${nutrientAmount(n, total.known).replace(/ mg$/, '')} of ${nutrientAmount(n, limit)}`
          }
          note={joined(coverage(total), 'your limit')}
          amount={total.known}
          reference={limit}
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
      />
    );
  };

  return (
    <div className="food-micros">
      {entries.length === 0 ? <p className="app-text app-muted">Nothing logged yet today.</p> : null}
      {withheld === undefined ? null : <p className="app-text app-muted food-micros-withheld">{withheldLine[withheld]}</p>}
      {entries.length === 0
        ? null
        : MicronutrientGroup.values.map((group) => (
            <div key={group} className="food-micros-group">
              <SectionLabel text={MicronutrientGroup.label(group)} />
              {totals.filter((t) => Micronutrient.group(t.nutrient) === group).map(row)}
            </div>
          ))}
    </div>
  );
}
