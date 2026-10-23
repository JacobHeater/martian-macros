import { Fragment, useState } from 'react';
import type { CalendarDate } from '../../domain/CalendarDate';
import type { MealDraft } from '../../domain/food/meal/MealDraft';
import type { MealItemDraft } from '../../domain/food/meal/MealItemDraft';
import { mealItemProblems } from '../../domain/food/meal/mealItemProblems';
import { parseMealAnalysis } from '../../domain/food/meal/parseMealAnalysis';
import type { Meal } from '../../domain/Meal';
import { gradeOfMeal } from '../../engine/gradeOfMeal';
import { gradeOfMealItem } from '../../engine/gradeOfMealItem';
import { Fmt } from '../../format/Fmt';
import { mealAnalysisPrompt } from '../../format/mealAnalysisPrompt';
import { mealFixMessage } from '../../format/mealFixMessage';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { useApp } from '../../app/useApp';
import { useCell } from '../../app/useCell';
import { useLoaded } from '../../app/useLoaded';
import { DayStepper } from '../../ui/DayStepper';
import { MmButton } from '../../ui/MmButton';
import { MmCheckRow } from '../../ui/MmCheckRow';
import { MmTextField } from '../../ui/MmTextField';
import { Notice } from '../../ui/Notice';
import { useOverlays } from '../../ui/useOverlays';
import { eatenAtWhenLogged } from '../eatenAtWhenLogged';
import { MealChips } from '../MealChips';
import { TimeEatenRow } from '../TimeEatenRow';
import { logMeal } from './logMeal';
import { MealGradeRow } from './MealGradeRow';
import { MealItemForm } from './MealItemForm';
import { MealItemRow } from './MealItemRow';
import { recipeOfMeal } from './recipeOfMeal';
import { resolveMealItems } from './resolveMealItems';
import '../food.css';

interface AnalyzeMealStepProps {
  day: CalendarDate;
  meal: Meal;
  onBack: () => void;
  /** Called once the meal is logged. */
  onDone: () => void;
}

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/**
 * AI meal analysis (MM-586): the person copies a fixed prompt to their own
 * AI assistant with photos of what they ate, pastes its answer back, and
 * reviews the meal before it is logged. The app sends nothing anywhere and
 * never sees the photos. Each food says where its numbers came from; a
 * problem is said on its food, and the fixes can be copied back to the
 * assistant.
 */
export function AnalyzeMealStep({ day: firstDay, meal: firstMeal, onBack, onDone }: AnalyzeMealStepProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const catalog = useLoaded(state.foodCatalog);
  const [answer, setAnswer] = useState('');
  const [unreadable, setUnreadable] = useState<string>();
  // What was last copied, shown on its own button (MM-586); and whether the phone refused the last copy.
  const [copied, setCopied] = useState<'prompt' | 'fixes'>();
  const [copyRefused, setCopyRefused] = useState(false);
  const [reading, setReading] = useState(false);
  const [draft, setDraft] = useState<MealDraft>();
  const [editing, setEditing] = useState<number | 'new'>();
  const [meal, setMeal] = useState(firstMeal);
  const today = useCell(state.today);
  const [day, setDay] = useState(firstDay);
  const [eatenAt, setEatenAt] = useState<number | undefined>(() => eatenAtWhenLogged(firstDay, services.clock));
  const [saveToSaved, setSaveToSaved] = useState(false);
  const [triedToLog, setTriedToLog] = useState(false);
  const [logFailed, setLogFailed] = useState(false);

  const copy = async (text: string, what: 'prompt' | 'fixes') => {
    const done = await services.clipboard.write(text);
    setCopied(done ? what : undefined);
    setCopyRefused(!done);
  };

  /** A copy refused, said where it cannot be missed, with its icon. */
  const refusal = copyRefused ? <Notice icon="warning" text="The phone did not allow copying. Press the button again." /> : null;

  /** What a screen reader hears as it happens: the words the button's check and the review stand for. */
  const said = reading
    ? 'Looking up foods…'
    : copied === 'prompt'
      ? 'Copied. Paste it into your assistant with your photos.'
      : copied === 'fixes'
        ? 'Copied. Paste it into your assistant, then paste its answer here.'
        : '';
  const heard = (
    <p className="mm-visually-hidden" role="status">
      {said}
    </p>
  );

  /** Reads `text` as the assistant's answer: the meal it holds, each food with the best numbers there are. */
  const read = async (text: string) => {
    const result = parseMealAnalysis(text);
    if (result.kind === 'unreadable') {
      setUnreadable(result.reason);
      return;
    }
    setReading(true);
    const items = await resolveMealItems(result.draft.items, catalog);
    setReading(false);
    setUnreadable(undefined);
    setAnswer('');
    setEditing(undefined);
    setTriedToLog(false);
    setCopied(undefined);
    setCopyRefused(false);
    // The day and time the person told the assistant, when they told it (MM-594); otherwise those already shown.
    // A day after today cannot be logged, so it is left as it was.
    const { eatenOn, eatenAt: told } = result.draft;
    if (eatenOn !== undefined && !eatenOn.isAfter(today)) setDay(eatenOn);
    if (told !== undefined) setEatenAt(told);
    setDraft({ name: result.draft.name, items });
  };

  const paste = async () => {
    const text = await services.clipboard.read();
    if (text === undefined) {
      setUnreadable('The phone did not hand over the clipboard. Press and hold the field below, then Paste.');
      return;
    }
    await read(text);
  };

  /** Pasting the answer, by the button or into the field: the same in the first step and after a fix. */
  const pasteControls = (fieldLabel: string) => (
    <>
      <MmButton label="Paste from clipboard" kind="secondary" icon="document" expand onPress={() => void paste()} />
      <MmTextField label={fieldLabel} value={answer} onChange={setAnswer} hint="Paste the whole answer" />
      {unreadable === undefined ? null : <Notice text={unreadable} />}
      {answer.trim() === '' ? null : <MmButton label="Read the answer" kind="secondary" expand onPress={() => void read(answer)} />}
    </>
  );

  if (draft === undefined) {
    return (
      <div className="food-sheet">
        <h2 className="app-headline">AI meal analysis</h2>
        <p className="app-caption">
          Use your own AI assistant, such as ChatGPT, Claude or Gemini, to work out what is on your plate. The app
          sends nothing anywhere and never sees your photos; you review every food before it is logged.
        </p>
        <ol className="food-meal-steps">
          <li>Copy the prompt, and paste it into your assistant with photos of everything you ate.</li>
          <li>Answer its questions: what to call the meal, how much you ate, and where it came from.</li>
          <li>Copy its whole answer and paste it here.</li>
        </ol>
        <div className="app-gap-small" />
        {/* Copied, the button says so itself, with a check (MM-586). */}
        <MmButton
          label={copied === 'prompt' ? 'Prompt copied' : 'Copy prompt'}
          icon={copied === 'prompt' ? 'check' : 'copy'}
          expand
          onPress={() => void copy(mealAnalysisPrompt, 'prompt')}
        />
        {refusal}
        {heard}
        <div className="app-gap" />
        {pasteControls('Or paste the answer here')}
        <MmButton label="Back" kind="text" onPress={onBack} />
      </div>
    );
  }

  const items = draft.items;
  const problemCount = items.filter((item) => mealItemProblems(item).length > 0).length;
  const named = draft.name.trim() !== '';
  const kcal = items.reduce((sum, item) => sum + (item.kcal ?? 0), 0);
  const protein = items.reduce((sum, item) => sum + (item.proteinG ?? 0), 0);
  const carbs = items.reduce((sum, item) => sum + (item.carbsG ?? 0), 0);
  const fat = items.reduce((sum, item) => sum + (item.fatG ?? 0), 0);
  const grades = items.flatMap((item) => {
    const grade = gradeOfMealItem(item);
    return grade === undefined ? [] : [{ kcal: item.kcal ?? 0, grade }];
  });
  const mealGrade = problemCount > 0 ? undefined : gradeOfMeal(grades, 'meal');
  // What still keeps the meal from being logged, said once Log meal has been pressed (MM-220).
  const blocked = !named
    ? 'Give the meal a name to log it.'
    : problemCount > 0
      ? `${problemCount === 1 ? 'One food needs' : `${problemCount} foods need`} fixing or removing before the meal can be logged.`
      : undefined;
  const setItems = (next: readonly MealItemDraft[]) => setDraft({ ...draft, items: next });

  const remove = async (at: number) => {
    if (items.length === 1) {
      const sure = await overlays.confirm({
        title: 'Remove the last food?',
        message: 'A meal needs at least one food. Removing it starts the analysis again.',
        confirmLabel: 'Remove',
      });
      if (sure) setDraft(undefined);
      return;
    }
    setItems(items.filter((_, i) => i !== at));
  };

  const log = async () => {
    if (blocked !== undefined) {
      setTriedToLog(true);
      return;
    }
    // A failure is said, never swallowed (MM-591): nothing is logged, and the review stays to try again.
    try {
      await logMeal(services.food, draft, { date: day, meal, eatenAt });
    } catch {
      setLogFailed(true);
      return;
    }
    setLogFailed(false);
    if (saveToSaved) {
      await services.customFoods.saveCustomFood(recipeOfMeal(draft)).catch(() => overlays.snack(`${draft.name.trim()} could not be saved to Saved`));
    }
    overlays.snack(`Logged ${draft.name.trim()}`);
    onDone();
  };

  return (
    <div className="food-sheet">
      <h2 className="app-headline">Review the meal</h2>
      <p className="app-caption">Check each food before it is logged. Change anything that looks wrong.</p>
      <MmTextField
        label="Meal name"
        value={draft.name}
        onChange={(name) => setDraft({ ...draft, name })}
        error={named ? undefined : 'The meal needs a name.'}
      />
      <div className="app-gap-small" />
      <MealChips meal={meal} onChange={setMeal} />
      <TimeEatenRow eatenAt={eatenAt} meal={meal} onChange={setEatenAt} />
      {/* The day it was eaten, as Add food's "Logged on" (MM-594): told by the answer, or the one Add food was opened for. */}
      <div className="app-gap-small" />
      <DayStepper
        name="Logged on"
        label={Fmt.day(day, today)}
        onPrevious={() => setDay(day.addDays(-1))}
        onNext={day.isBefore(today) ? () => setDay(day.addDays(1)) : undefined}
        onLabelPress={undefined}
      />
      <p className="food-label food-label-spaced">
        {items.length === 1 ? '1 food' : `${items.length} foods`}
      </p>
      {items.map((item, i) => (
        <Fragment key={`${i}-${item.name}`}>
          <MealItemRow item={item} onChange={() => setEditing(i)} onRemove={() => void remove(i)} />
          {editing === i ? (
            <MealItemForm
              item={item}
              onSave={(changed) => {
                setItems(items.map((old, at) => (at === i ? changed : old)));
                setEditing(undefined);
              }}
              onCancel={() => setEditing(undefined)}
            />
          ) : null}
        </Fragment>
      ))}
      {editing === 'new' ? (
        <MealItemForm
          onSave={(added) => {
            setItems([...items, added]);
            setEditing(undefined);
          }}
          onCancel={() => setEditing(undefined)}
        />
      ) : (
        <MmButton label="Add a food" kind="text" icon="plus" onPress={() => setEditing('new')} />
      )}
      <p className="app-subhead food-totals">
        {`Logs about ${Fmt.whole(kcal)} kcal · ${whole(protein)} g protein · ${whole(carbs)} g carbs · ${whole(fat)} g fat`}
      </p>
      {mealGrade === undefined ? null : <MealGradeRow grade={mealGrade} subject={draft.name.trim() || 'This meal'} />}
      {problemCount === 0 ? null : (
        <>
          <Notice
            text={
              `${problemCount === 1 ? 'One food has' : `${problemCount} foods have`} a problem, said under it. ` +
              'Fix it here, or copy the fixes to your assistant and paste its corrected answer.'
            }
          />
          <div className="app-gap-small" />
          <MmButton
            label={copied === 'fixes' ? 'Fixes copied' : 'Copy fixes for AI'}
            kind="secondary"
            icon={copied === 'fixes' ? 'check' : 'copy'}
            expand
            onPress={() => void copy(mealFixMessage({ ...draft, eatenOn: day, eatenAt }), 'fixes')}
          />
          {refusal}
          {heard}
          <div className="app-gap" />
          {pasteControls('Or paste the corrected answer here')}
        </>
      )}
      <MmCheckRow title="Also save to Saved" value={saveToSaved} onChange={setSaveToSaved} />
      <div className="app-gap" />
      {logFailed ? <Notice icon="warning" text="The meal could not be logged, so nothing was. Press Log meal to try again." /> : null}
      <MmButton label="Log meal" expand onPress={() => void log()} />
      {!triedToLog || blocked === undefined ? null : (
        <p className="app-caption food-still-needed" role="alert">
          {blocked}
        </p>
      )}
      <MmButton label="Start again" kind="text" onPress={() => setDraft(undefined)} />
    </div>
  );
}
