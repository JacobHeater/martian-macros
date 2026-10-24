import { Fragment, useEffect, useState } from 'react';
import type { CalendarDate } from '../../domain/CalendarDate';
import { MealPortionEaten } from '../../domain/food/meal/MealPortionEaten';
import type { CapturedPhoto } from '../../domain/integration/CapturedPhoto';
import type { MealDraft } from '../../domain/food/meal/MealDraft';
import type { MealItemDraft } from '../../domain/food/meal/MealItemDraft';
import { mealItemProblems } from '../../domain/food/meal/mealItemProblems';
import { parseMealAnalysis } from '../../domain/food/meal/parseMealAnalysis';
import type { Meal } from '../../domain/Meal';
import { gradeOfMeal } from '../../engine/gradeOfMeal';
import { gradeOfMealItem } from '../../engine/gradeOfMealItem';
import { Fmt } from '../../format/Fmt';
import { mealAnalysisPromptWith } from '../../format/mealAnalysisPromptWith';
import { mealPortionEatenLabel } from '../../format/mealPortionEatenLabel';
import { mealFixMessage } from '../../format/mealFixMessage';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { useApp } from '../../app/useApp';
import { useCell } from '../../app/useCell';
import { useLoaded } from '../../app/useLoaded';
import { DayStepper } from '../../ui/DayStepper';
import { MmButton } from '../../ui/MmButton';
import { MmCheckRow } from '../../ui/MmCheckRow';
import { MmChoiceChip } from '../../ui/MmChoiceChip';
import { MmIconButton } from '../../ui/MmIconButton';
import { MmPhoto } from '../../ui/MmPhoto';
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
import { MealPhotoCamera } from './MealPhotoCamera';
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

/** The most photos one meal is sent with (MM-599). */
const maxPhotos = 6;

/**
 * AI meal analysis (MM-586): the person answers the questions about the
 * meal here and adds its photos (MM-599), and the app hands the prompt with
 * those answers and the photos to their own AI assistant through the share
 * sheet, or copies the prompt when there are no photos. The photos are held
 * only while they are sent, and none is kept. The assistant's answer is
 * pasted back and the meal reviewed before it is logged. Each food says
 * where its numbers came from; a problem is said on its food, and the fixes
 * can be copied back to the assistant.
 */
export function AnalyzeMealStep({ day: firstDay, meal: firstMeal, onBack, onDone }: AnalyzeMealStepProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const catalog = useLoaded(state.foodCatalog);
  const [answer, setAnswer] = useState('');
  const [unreadable, setUnreadable] = useState<string>();
  // The questions the assistant used to ask, answered here (MM-599).
  const [name, setName] = useState('');
  const [eaten, setEaten] = useState<MealPortionEaten>('all');
  const [notEaten, setNotEaten] = useState('');
  const [from, setFrom] = useState('');
  const [photos, setPhotos] = useState<readonly CapturedPhoto[]>([]);
  const [camera, setCamera] = useState(false);
  const [triedToSend, setTriedToSend] = useState(false);
  // The share sheet could not be opened: the prompt was copied instead (MM-599).
  const [shareFailed, setShareFailed] = useState(false);
  // What was last copied or sent, shown on its own button (MM-586); and whether the phone refused the last copy.
  const [copied, setCopied] = useState<'prompt' | 'fixes' | 'sent'>();
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

  // Whatever the phone was handed to share is deleted when the sheet that holds it closes (MM-599).
  useEffect(() => () => void services.mealShare.clear(), [services]);

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
      ? photos.length === 0
        ? 'Copied. Paste it into your assistant, then send your photos.'
        : 'Copied. Paste it into your assistant with your photos.'
      : copied === 'fixes'
        ? 'Copied. Paste it into your assistant, then paste its answer here.'
        : copied === 'sent'
          ? 'Sent. When your assistant answers, copy its whole answer and paste it here.'
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
    // The name the person gave here, when the answer leaves it empty (MM-599).
    setDraft({ name: result.draft.name.trim() === '' ? name.trim() : result.draft.name, items });
  };

  const named = name.trim() !== '';
  /** The prompt with the answers given here (MM-599). */
  const prompt = (photosAttached: boolean) =>
    mealAnalysisPromptWith({ name, eaten, notEaten, from, day, eatenAt, photosAttached }, today);
  const canShare = photos.length > 0 && services.mealShare.available;

  /** The photos and the prompt to the share sheet; the prompt is copied too, as some assistants keep only the photos. */
  const send = async () => {
    if (!named) {
      setTriedToSend(true);
      return;
    }
    if (!canShare) {
      await copy(prompt(false), 'prompt');
      return;
    }
    const text = prompt(true);
    // Before any await: copying needs the press that asked for it (MM-589).
    const copying = services.clipboard.write(text);
    const outcome = await services.mealShare.send({ text, photos });
    await copying;
    setCopyRefused(false);
    setShareFailed(outcome === 'unavailable');
    if (outcome === 'sent') setCopied('sent');
    else if (outcome === 'unavailable') setCopied('prompt');
  };

  const choose = async () => {
    const chosen = await services.photoLibrary.pick(maxPhotos - photos.length);
    setPhotos([...photos, ...chosen].slice(0, maxPhotos));
    setCopied(undefined);
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

  if (draft === undefined && camera) {
    return (
      <MealPhotoCamera
        count={photos.length}
        max={maxPhotos}
        onTake={(photo) => {
          setPhotos((taken) => [...taken, photo].slice(0, maxPhotos));
          setCopied(undefined);
        }}
        onDone={() => setCamera(false)}
      />
    );
  }

  if (draft === undefined) {
    const full = photos.length >= maxPhotos;
    return (
      <div className="food-sheet">
        <h2 className="app-headline">AI meal analysis</h2>
        <p className="app-caption">
          Tell the app about the meal and add photos of it. It hands both to your own AI assistant, such as ChatGPT,
          Claude or Gemini. The photos are only passed on, never kept, and you review every food before it is logged.
        </p>
        <div className="app-gap-small" />
        <MmTextField
          label="Meal name"
          value={name}
          onChange={setName}
          error={triedToSend && !named ? 'The meal needs a name.' : undefined}
        />
        <p className="food-label food-label-spaced">How much did you eat?</p>
        <div className="app-row" role="group" aria-label="How much did you eat?">
          {MealPortionEaten.values.map((choice) => (
            <MmChoiceChip key={choice} label={mealPortionEatenLabel(choice)} selected={eaten === choice} onSelect={() => setEaten(choice)} />
          ))}
        </div>
        <MmTextField label="Anything you didn’t eat?" hint="Optional: the fries, the crust" value={notEaten} onChange={setNotEaten} />
        <MmTextField label="Brand or restaurant" hint="Optional" value={from} onChange={setFrom} />
        <div className="app-gap-small" />
        <MealChips meal={meal} onChange={setMeal} />
        <TimeEatenRow eatenAt={eatenAt} meal={meal} onChange={setEatenAt} />
        <div className="app-gap-small" />
        <DayStepper
          name="Eaten on"
          label={Fmt.day(day, today)}
          onPrevious={() => setDay(day.addDays(-1))}
          onNext={day.isBefore(today) ? () => setDay(day.addDays(1)) : undefined}
          onLabelPress={undefined}
        />
        <p className="food-label food-label-spaced">
          {photos.length === 0 ? 'Photos' : `Photos · ${photos.length} of ${maxPhotos}`}
        </p>
        {photos.length === 0 ? null : (
          <div className="food-meal-photos">
            {photos.map((photo, at) => (
              <figure key={at} className="food-meal-photo">
                <MmPhoto jpeg={photo.jpeg} label={`Photo ${at + 1} of the meal`} thumbnail />
                <MmIconButton
                  icon="close"
                  label={`Remove photo ${at + 1}`}
                  onPress={() => {
                    setPhotos(photos.filter((_, i) => i !== at));
                    setCopied(undefined);
                  }}
                />
              </figure>
            ))}
          </div>
        )}
        <div className="app-row food-chips">
          <MmButton label="Take a photo" kind="secondary" icon="camera" onPress={full ? undefined : () => setCamera(true)} />
          {services.photoLibrary.available ? (
            <MmButton label="Choose photos" kind="secondary" icon="photos" onPress={full ? undefined : () => void choose()} />
          ) : null}
        </div>
        {photos.length > 0 && !services.mealShare.available ? (
          <Notice text="This phone cannot hand photos to another app. Copy the prompt, then attach the photos in your assistant." />
        ) : null}
        <div className="app-gap" />
        {/* Sent or copied, the button says so itself, with a check (MM-586). */}
        {canShare ? (
          <MmButton
            label={copied === 'sent' ? 'Sent' : 'Send to assistant'}
            icon={copied === 'sent' ? 'check' : 'assistant'}
            expand
            onPress={() => void send()}
          />
        ) : (
          <MmButton
            label={copied === 'prompt' ? 'Prompt copied' : 'Copy prompt'}
            icon={copied === 'prompt' ? 'check' : 'copy'}
            expand
            onPress={() => void send()}
          />
        )}
        {shareFailed ? (
          <Notice icon="warning" text="The share sheet could not be opened. The prompt is copied: paste it into your assistant and attach the photos there." />
        ) : null}
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
  const draftNamed = draft.name.trim() !== '';
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
  const blocked = !draftNamed
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
        error={draftNamed ? undefined : 'The meal needs a name.'}
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
