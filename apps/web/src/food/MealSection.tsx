import { useId, useState } from "react";
import type { CalendarDate } from "../domain/CalendarDate";
import { DetailLevel } from "../domain/food/detail/DetailLevel";
import type { FoodEntry } from "../domain/FoodEntry";
import type { Meal } from "../domain/Meal";
import { mealHasSolidProtein } from "../engine/mealHasSolidProtein";
import { Fmt } from "../format/Fmt";
import { mealLabel } from "../format/mealLabel";
import { useApp } from "../app/useApp";
import { useCell } from "../app/useCell";
import { useLoaded } from "../app/useLoaded";
import { MmIcon } from "../ui/MmIcon";
import { MmIconButton } from "../ui/MmIconButton";
import { MmMenuButton } from "../ui/MmMenuButton";
import { MmSwipeToRemove } from "../ui/MmSwipeToRemove";
import { useOverlays } from "../ui/useOverlays";
import { copyEntries } from "./copyEntries";
import { entriesCopiedTo } from "./entriesCopiedTo";
import { FoodEntryTile } from "./FoodEntryTile";
import { showAddFoodSheet } from "./showAddFoodSheet";
import "./food.css";

interface MealSectionProps {
  meal: Meal;
  day: CalendarDate;
  entries: readonly FoodEntry[];
}

/**
 * One meal: its header with subtotal and an add button, then its entries.
 * A meal with no entries still shows its header, so every meal is an add
 * target and the list never jumps. The header opens and closes the entries;
 * its actions are beside it, not inside it, so pressing one never toggles
 * the meal. Swiping an entry away is an accelerator for deleting it.
 */
export function MealSection({ meal, day, entries }: MealSectionProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const total = entries.reduce((sum, e) => sum + e.kcal, 0);
  const protein = entries.reduce((sum, e) => sum + e.proteinG, 0);
  // Full detail shows the protein of the meal and a quiet marker when it
  // is a solid serving (MM-125). There is no per-meal target.
  const full = DetailLevel.showsExtras(
    useLoaded(state.detailLevel) ?? "standard",
  );
  const weightKg = useCell(state.coach)?.trendWeightKg;
  const solid =
    full &&
    weightKg !== undefined &&
    mealHasSolidProtein({ proteinG: protein, weightKg });
  const label = mealLabel(meal);
  const [expanded, setExpanded] = useState(true);
  const id = useId();

  /** Deletes `entry` and offers to put it back for a few seconds (MM-48). */
  const remove = (entry: FoodEntry) => {
    void services.food.deleteFood(entry.id);
    overlays.snack(`Removed ${entry.name}`, {
      label: "Undo",
      onAction: () => void services.food.addFood(entry),
    });
  };

  return (
    <section className="food-meal" aria-label={label}>
      <div className="food-meal-head">
        <button
          type="button"
          className="food-meal-toggle"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="food-meal-title">
            <span className="food-meal-name">{label}</span>
            {entries.length === 0 ? null : (
              <span className="food-meal-total">
                {full
                  ? `${Fmt.kcal(total)} · ${Fmt.grams(protein)} protein`
                  : Fmt.kcal(total)}
                {solid ? (
                  <span
                    className="food-meal-marker"
                    role="img"
                    aria-label="A solid serving of protein"
                  >
                    <MmIcon name="checkCircle" size={16} />
                  </span>
                ) : null}
              </span>
            )}
          </span>
          <span
            className={`mm-disclosure-chevron${expanded ? " mm-disclosure-chevron-open" : ""}`}
          >
            <MmIcon name="chevronDown" size={16} />
          </span>
        </button>
        {entries.length > 0 && day !== today ? (
          <MmIconButton
            icon="copy"
            label={`Copy ${label.toLowerCase()} to today`}
            onPress={() =>
              void copyEntries(services.food, entriesCopiedTo(today, entries))
            }
          />
        ) : null}
        <MmIconButton
          icon="plus"
          kind="add"
          label={`Add food to ${label.toLowerCase()}`}
          onPress={() => void showAddFoodSheet(overlays, day, { meal })}
        />
      </div>
      <div id={id} hidden={!expanded}>
        {entries.map((entry) => (
          <MmSwipeToRemove key={entry.id} onRemove={() => remove(entry)}>
            <div className="food-meal-entry">
              <button
                type="button"
                className="food-entry-open"
                aria-label={`Edit ${entry.name}`}
                onClick={() => void showAddFoodSheet(overlays, day, { entry })}
              >
                <FoodEntryTile entry={entry} />
              </button>
              <MmMenuButton<string>
                icon="more"
                label={`More actions for ${entry.name}`}
                items={[{ value: "delete", label: "Delete" }]}
                onSelect={(action) => {
                  if (action === "delete") remove(entry);
                }}
              />
            </div>
          </MmSwipeToRemove>
        ))}
      </div>
    </section>
  );
}
