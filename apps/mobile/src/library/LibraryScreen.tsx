import { useContext, useState } from 'react';
import type { CustomFood } from '../domain/food/custom/CustomFood';
import type { SavedFoodUsage } from '../domain/food/custom/SavedFoodUsage';
import { usualFoodsIn } from '../domain/food/custom/usualFoodsIn';
import type { SavedMeal } from '../domain/food/meal/SavedMeal';
import type { Exercise } from '../domain/training/Exercise';
import type { Workout } from '../domain/training/Workout';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { CustomFoodForm } from '../food/custom/CustomFoodForm';
import { customFoodOfEntry } from '../food/custom/customFoodOfEntry';
import { RecipeForm } from '../food/custom/RecipeForm';
import { CustomExerciseScreen } from '../train/CustomExerciseScreen';
import { MmButton } from '../ui/MmButton';
import { MmFoldsContext } from '../ui/MmFoldsContext';
import { MmListGroup } from '../ui/MmListGroup';
import { MmSection } from '../ui/MmSection';
import { ScreenLoading } from '../ui/ScreenLoading';
import { useOverlays } from '../ui/useOverlays';
import { LibraryEmptyRow } from './LibraryEmptyRow';
import { LibraryExerciseRow } from './LibraryExerciseRow';
import type { LibraryFoldId } from './LibraryFoldId';
import { LibraryFoodRow } from './LibraryFoodRow';
import { LibraryMealRow } from './LibraryMealRow';
import { LibraryUsualRow } from './LibraryUsualRow';
import type { NewFoodRoute } from './NewFoodRoute';
import { NewFoodSheet } from './NewFoodSheet';

/** What a save just showed: its fold is drawn anew so it opens, and the new row takes focus (MM-706). */
interface Revealed {
  readonly fold: LibraryFoldId;
  readonly id: number | string;
  readonly revision: number;
}

/** The workouts an exercise was trained in, as a usage: how many, and the last (MM-706). */
function workoutUsageOf(workouts: readonly Workout[]): ReadonlyMap<string, SavedFoodUsage> {
  const usage = new Map<string, SavedFoodUsage>();
  for (const workout of workouts) {
    for (const id of new Set(workout.exercises.map((exercise) => exercise.exerciseId))) {
      const before = usage.get(id);
      usage.set(id, {
        times: (before?.times ?? 0) + 1,
        lastDay: before === undefined || before.lastDay.epochDay < workout.date.epochDay ? workout.date : before.lastDay,
      });
    }
  }
  return usage;
}

/**
 * The Library (MM-706): everything the person made, in folds closed at
 * first, in the order Foods, Recipes, Meals, Usual foods, Exercises, with
 * "New food" above them. Each row says what the thing is and how often it
 * is logged. The folds and the scroll are kept across visits (MM-286). A
 * form opens as a sheet over the Library, the sibling of the Saved step's
 * forms (MM-45), and a save opens its fold on the new row.
 */
export function LibraryScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const navigator = useNavigator();
  const folds = useContext(MmFoldsContext);
  const today = useCell(state.today);
  const foods = useLoaded(state.customFoods);
  const meals = useLoaded(state.savedMeals);
  const exercises = useLoaded(state.customExercises);
  const usage = useLoaded(state.savedFoodUsage) ?? new Map<number, SavedFoodUsage>();
  const workouts = useLoaded(state.workouts) ?? [];
  const log = useLoaded(state.foodBefore(today.addDays(1))) ?? [];
  const [revealed, setRevealed] = useState<Revealed>();

  if (foods === undefined || meals === undefined || exercises === undefined) {
    return (
      <Screen title="Library">
        <ScreenLoading />
      </Screen>
    );
  }

  const reveal = (fold: LibraryFoldId, id: number | string, said: string) => {
    folds?.set(`library.${fold}`, true);
    setRevealed({ fold, id, revision: (revealed?.revision ?? 0) + 1 });
    overlays.snack(said);
  };
  /** A fold of the Library: closed at first, kept as left (MM-286), drawn anew when a save opens it. */
  const foldKey = (id: LibraryFoldId) => `${id}-${revealed?.fold === id ? revealed.revision : 0}`;
  const fold = (id: LibraryFoldId) => ({
    collapsible: true,
    initiallyExpanded: revealed?.fold === id,
    maintainState: true,
    remember: `library.${id}`,
  });
  const count = (title: string, n: number) => (n === 0 ? title : `${title} · ${n}`);

  const saveFood = async (route: Exclude<NewFoodRoute, 'recipe'>) => {
    const saved = await overlays.sheet<CustomFood>(
      'Save your own food',
      (close) => <CustomFoodForm readLabelAtStart={route === 'label'} onDone={close} />,
      { size: 'tall' },
    );
    if (saved !== undefined) reveal('foods', saved.id, `Saved ${saved.name}`);
  };
  const saveRecipe = async () => {
    const saved = await overlays.sheet<CustomFood>('New recipe', (close) => <RecipeForm onDone={close} />, { size: 'tall' });
    if (saved !== undefined) reveal('recipes', saved.id, `Saved ${saved.name}`);
  };
  const newFood = async () => {
    const route = await overlays.sheet<NewFoodRoute>('New food', (close) => <NewFoodSheet onChoose={close} />);
    if (route === 'recipe') await saveRecipe();
    else if (route !== undefined) await saveFood(route);
  };
  const editFood = (food: CustomFood) =>
    food.kind === 'recipe'
      ? overlays.sheet<CustomFood>('Edit recipe', (close) => <RecipeForm recipe={food} onDone={close} />, { size: 'tall' })
      : overlays.sheet<CustomFood>('Edit your food', (close) => <CustomFoodForm food={food} onDone={close} />, { size: 'tall' });
  const deleteFood = async (food: CustomFood) => {
    const ok = await overlays.confirm({
      title: `Delete ${food.name}?`,
      message: 'Entries you already logged from it stay as they are. This only removes it from your saved foods.',
      confirmLabel: 'Delete',
    });
    if (ok) await services.customFoods.deleteCustomFood(food.id);
  };
  const deleteMeal = async (meal: SavedMeal) => {
    const ok = await overlays.confirm({
      title: `Delete ${meal.name}?`,
      message: 'What you already logged from it stays as it is. This only removes it from your saved meals.',
      confirmLabel: 'Delete',
    });
    if (ok) await services.savedMeals.deleteSavedMeal(meal.id);
  };
  const saveUsual = async (entry: CustomFood) => {
    const saved = await overlays.sheet<CustomFood>(
      'Save as a food',
      (close) => <CustomFoodForm draft={entry} draftFrom="log" onDone={close} />,
      { size: 'tall' },
    );
    if (saved !== undefined) reveal('foods', saved.id, `Saved ${saved.name}`);
  };
  const editExercise = async (exercise?: Exercise) => {
    const id = await navigator.push<string>((close) => <CustomExerciseScreen exercise={exercise} onSaved={close} />);
    if (id !== undefined) reveal('exercises', id, `Saved ${exercises.find((e) => e.id === id)?.name ?? exercise?.name ?? 'exercise'}`);
  };
  const deleteExercise = async (exercise: Exercise) => {
    const ok = await overlays.confirm({
      title: `Delete ${exercise.name}?`,
      message: 'Sets you already logged with it stay as they are. This only removes it from your exercises.',
      confirmLabel: 'Delete',
    });
    if (ok) await services.customExercises.deleteCustomExercise(exercise.id);
  };

  // Most logged first; never logged last, by name (MM-706).
  const byUse = (a: CustomFood, b: CustomFood) => (usage.get(b.id)?.times ?? 0) - (usage.get(a.id)?.times ?? 0) || a.name.localeCompare(b.name);
  const savedFoods = foods.filter((food) => food.kind === 'food').sort(byUse);
  const recipes = foods.filter((food) => food.kind === 'recipe').sort(byUse);
  const usual = usualFoodsIn(log, { except: foods.map((food) => food.name) });
  const trained = workoutUsageOf(workouts);
  const foodRow = (food: CustomFood) => (
    <LibraryFoodRow
      key={food.id}
      food={food}
      usage={usage.get(food.id)}
      today={today}
      autoFocus={revealed?.id === food.id && revealed.fold === (food.kind === 'recipe' ? 'recipes' : 'foods')}
      onEdit={() => void editFood(food)}
      onDelete={() => void deleteFood(food)}
    />
  );

  return (
    <Screen title="Library">
      <MmButton label="New food" kind="secondary" icon="plus" expand onPress={() => void newFood()} />
      <MmSection icon="food" title={count('Foods', savedFoods.length)} key={foldKey('foods')} {...fold('foods')}>
        <MmListGroup>{savedFoods.length === 0 ? <LibraryEmptyRow text="Nothing saved yet. New food makes one." /> : savedFoods.map(foodRow)}</MmListGroup>
      </MmSection>
      <MmSection icon="serving" title={count('Recipes', recipes.length)} key={foldKey('recipes')} {...fold('recipes')}>
        <MmListGroup>{recipes.length === 0 ? <LibraryEmptyRow text="No recipes yet. New food makes one." /> : recipes.map(foodRow)}</MmListGroup>
      </MmSection>
      <MmSection icon="lunch" title={count('Meals', meals.length)} key={foldKey('meals')} {...fold('meals')}>
        <MmListGroup>
          {meals.length === 0 ? (
            <LibraryEmptyRow text="No meals yet. Save one from a day’s foods on Food." />
          ) : (
            meals.map((meal) => <LibraryMealRow key={meal.id} meal={meal} onDelete={() => void deleteMeal(meal)} />)
          )}
        </MmListGroup>
      </MmSection>
      <MmSection icon="history" title="Usual foods" key={foldKey('usual')} {...fold('usual')}>
        <MmListGroup>
          {usual.length === 0 ? (
            <LibraryEmptyRow text="Log a few days and your usual foods show here." />
          ) : (
            usual.map((food) => <LibraryUsualRow key={food.name.toLowerCase()} usual={food} onSave={() => void saveUsual(customFoodOfEntry(food.latest))} />)
          )}
        </MmListGroup>
      </MmSection>
      <MmSection icon="train" title={count('Exercises', exercises.length)} key={foldKey('exercises')} {...fold('exercises')}>
        <MmListGroup>
          {exercises.length === 0 ? (
            <LibraryEmptyRow text="Add an exercise from a workout, and it shows here." />
          ) : (
            exercises.map((exercise) => (
              <LibraryExerciseRow
                key={exercise.id}
                exercise={exercise}
                usage={trained.get(exercise.id)}
                today={today}
                autoFocus={revealed?.fold === 'exercises' && revealed.id === exercise.id}
                onEdit={() => void editExercise(exercise)}
                onDelete={() => void deleteExercise(exercise)}
              />
            ))
          )}
        </MmListGroup>
      </MmSection>
    </Screen>
  );
}
