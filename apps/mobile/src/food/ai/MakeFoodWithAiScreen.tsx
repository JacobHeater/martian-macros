import { Fragment, useEffect, useState } from 'react';
import { Screen } from '../../app/Screen';
import { useApp } from '../../app/useApp';
import { useCell } from '../../app/useCell';
import { useLoaded } from '../../app/useLoaded';
import { CustomFood } from '../../domain/food/custom/CustomFood';
import { customFoodOfDraft } from '../../domain/food/custom/customFoodOfDraft';
import type { FoodDraft } from '../../domain/food/custom/FoodDraft';
import { foodDraftProblems } from '../../domain/food/custom/foodDraftProblems';
import { parseFoodAnalysis } from '../../domain/food/custom/parseFoodAnalysis';
import { normalizeBarcode } from '../../domain/food/normalizeBarcode';
import type { CapturedPhoto } from '../../domain/integration/CapturedPhoto';
import { foodFixMessage } from '../../format/foodFixMessage';
import { foodPromptWith } from '../../format/foodPromptWith';
import { parseNumber } from '../../format/parseNumber';
import { MmButton } from '../../ui/MmButton';
import { MmIconButton } from '../../ui/MmIconButton';
import { MmListRow } from '../../ui/MmListRow';
import { MmPhoto } from '../../ui/MmPhoto';
import { MmSwitchRow } from '../../ui/MmSwitchRow';
import { MmTextField } from '../../ui/MmTextField';
import { Notice } from '../../ui/Notice';
import { useOverlays } from '../../ui/useOverlays';
import { MealPhotoCamera } from '../meal/MealPhotoCamera';
import { FoodDraftForm } from './FoodDraftForm';
import { FoodDraftRow } from './FoodDraftRow';
import { resolveFoodDrafts } from './resolveFoodDrafts';
import '../food.css';

interface MakeFoodWithAiScreenProps {
  /** Called once the ticked foods are saved, with them as saved. */
  onDone: (saved: readonly CustomFood[]) => void;
}

/** The most photos a food is sent with, as a meal (MM-599). */
const maxPhotos = 6;

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Make a food with the person's own AI (MM-708), as a meal is analysed
 * (MM-586): the person says what they know about the food and adds its
 * photos, and the app hands the prompt with those answers and the photos
 * to their assistant through the share sheet, or copies the prompt when
 * there are no photos. The photos are held only while they are sent, and
 * none is kept. The assistant's answer is pasted back and each food
 * reviewed before it is saved; each says where its numbers came from, a
 * problem is said on its food, and the fixes can be copied back to the
 * assistant. Nothing is logged from here.
 */
export function MakeFoodWithAiScreen({ onDone }: MakeFoodWithAiScreenProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const catalog = useLoaded(state.foodCatalog);
  const customFoods = useLoaded(state.customFoods) ?? [];
  const today = useCell(state.today);
  // What the person knows about the food, put in the prompt (MM-708).
  const [name, setName] = useState('');
  const [homemade, setHomemade] = useState(false);
  const [from, setFrom] = useState('');
  const [serving, setServing] = useState('');
  const [servingGrams, setServingGrams] = useState('');
  const [barcode, setBarcode] = useState<string>();
  const [scanNote, setScanNote] = useState<string>();
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<readonly CapturedPhoto[]>([]);
  const [camera, setCamera] = useState(false);
  // The share sheet could not be opened: the prompt was copied instead (MM-599).
  const [shareFailed, setShareFailed] = useState(false);
  // What was last copied or sent, shown on its own button (MM-586); and whether the phone refused the last copy.
  const [copied, setCopied] = useState<'prompt' | 'fixes' | 'sent'>();
  const [copyRefused, setCopyRefused] = useState(false);
  const [answer, setAnswer] = useState('');
  const [unreadable, setUnreadable] = useState<string>();
  const [reading, setReading] = useState(false);
  const [foods, setFoods] = useState<readonly FoodDraft[]>();
  const [editing, setEditing] = useState<number>();
  const [triedToSave, setTriedToSave] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Whatever the phone was handed to share is deleted when the screen closes (MM-599).
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

  /** The saved food a draft would replace: one of the same name, not a recipe (MM-708). */
  const existingOf = (draft: FoodDraft): CustomFood | undefined => customFoods.find((f) => f.kind === 'food' && sameName(f.name, draft.name));

  /** Reads `text` as the assistant's answer: the foods it holds, each with the best numbers there are. */
  const read = async (text: string) => {
    const result = parseFoodAnalysis(text);
    if (result.kind === 'unreadable') {
      setUnreadable(result.reason);
      return;
    }
    setReading(true);
    const resolved = await resolveFoodDrafts(result.foods, catalog);
    setReading(false);
    setUnreadable(undefined);
    setAnswer('');
    setEditing(undefined);
    setTriedToSave(false);
    setCopied(undefined);
    setCopyRefused(false);
    setFoods(
      resolved.map((draft) => ({
        ...draft,
        // The barcode scanned here goes on the one food of the answer; with several, on none (MM-708).
        barcode: draft.barcode ?? (resolved.length === 1 ? barcode : undefined),
        // A food of a name already saved updates that food unless the person says to keep both.
        replaces: existingOf(draft)?.id,
      })),
    );
  };

  /** The prompt with the answers given here (MM-709). */
  const prompt = (photosAttached: boolean) =>
    foodPromptWith({ name, homemade, from, serving, servingGrams: parseNumber(servingGrams), barcode, notes, photosAttached }, today);
  const canShare = photos.length > 0 && services.mealShare.available;

  /** The photos and the prompt to the share sheet; the prompt is copied too, as some assistants keep only the photos. */
  const send = async () => {
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

  /** Reads the product's barcode with the camera (MM-43), to tie the saved food to it (MM-45). */
  const scan = async () => {
    try {
      const scanned = await services.barcodeScanner.scan();
      if (scanned === undefined) return;
      const gtin = normalizeBarcode(scanned.digits, { symbology: scanned.symbology === 'gtin14' ? undefined : scanned.symbology });
      if (gtin === undefined) {
        setScanNote('Those digits are not a valid barcode. Try the scan again.');
        return;
      }
      setBarcode(gtin);
      setScanNote(undefined);
      setCopied(undefined);
    } catch {
      setScanNote('The camera is not available. Allow camera access in your phone settings to scan.');
    }
  };

  const paste = async () => {
    const text = await services.clipboard.read();
    if (text === undefined) {
      setUnreadable('The phone did not hand over the clipboard. Press and hold the field below, then Paste.');
      return;
    }
    await read(text);
  };

  /** Pasting the answer, by the button or into the field: the same in the first part and after a fix. */
  const pasteControls = (fieldLabel: string) => (
    <>
      <MmButton label="Paste from clipboard" kind="secondary" icon="document" expand onPress={() => void paste()} />
      <MmTextField label={fieldLabel} value={answer} onChange={setAnswer} hint="Paste the whole answer" />
      {unreadable === undefined ? null : <Notice text={unreadable} />}
      {answer.trim() === '' ? null : <MmButton label="Read the answer" kind="secondary" expand onPress={() => void read(answer)} />}
    </>
  );

  if (foods === undefined && camera) {
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

  if (foods === undefined) {
    const full = photos.length >= maxPhotos;
    return (
      <Screen title="With my AI">
        <h2 className="app-headline">About the food</h2>
        <p className="app-caption">
          Tell the app what you know and add photos. It hands both to your own AI assistant, such as ChatGPT, Claude or
          Gemini, which works the food out in the app’s own format. The photos are only passed on, never kept, and you
          review every number before the food is saved.
        </p>
        <div className="app-gap-small" />
        <MmTextField label="Food name" hint="Leave blank and the assistant names it" value={name} onChange={setName} />
        <MmSwitchRow
          title="Homemade"
          subtitle={homemade ? 'Your assistant lists what likely went into it; you correct the list.' : 'On for a food you made, with no label.'}
          value={homemade}
          onChange={(on) => {
            setHomemade(on);
            setCopied(undefined);
          }}
        />
        {homemade ? null : <MmTextField label="Brand or restaurant" hint="Optional" value={from} onChange={setFrom} />}
        <div className="food-fields">
          <div className="food-field-wide">
            <MmTextField label="One serving is" hint="Optional: 1 biscuit, 1 scoop" value={serving} onChange={setServing} />
          </div>
          <MmTextField label="Weighs g" kind="number" hint="Optional" value={servingGrams} onChange={setServingGrams} />
        </div>
        {/* The product's barcode, when it has one (MM-43), so the next scan finds the saved food (MM-45). */}
        <MmListRow
          flush
          leadingIcon="barcode"
          title="Barcode"
          subtitle={barcode === undefined ? 'Optional: scan the package, if it has one.' : `Scanned: ${barcode}`}
          trailingAction={
            barcode === undefined ? (
              <MmIconButton icon="camera" label="Scan the barcode" onPress={() => void scan()} />
            ) : (
              <MmIconButton icon="close" label="Remove the barcode" onPress={() => setBarcode(undefined)} />
            )
          }
        />
        {scanNote === undefined ? null : <Notice icon="warning" text={scanNote} />}
        {/* Anything else the person thinks will help their assistant, put in the prompt in their words (MM-602). */}
        <MmTextField
          label="Anything else that would help your assistant?"
          hint="Optional: extra flaky, from the bakery on Main Street"
          lines={3}
          value={notes}
          onChange={setNotes}
        />
        <p className="food-label food-label-spaced">{photos.length === 0 ? 'Photos' : `Photos · ${photos.length} of ${maxPhotos}`}</p>
        {photos.length === 0 ? null : (
          <div className="food-meal-photos">
            {photos.map((photo, at) => (
              <figure key={at} className="food-meal-photo">
                <MmPhoto jpeg={photo.jpeg} label={`Photo ${at + 1} of the food`} thumbnail />
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
          <MmButton label={copied === 'sent' ? 'Sent' : 'Send to my assistant'} icon={copied === 'sent' ? 'check' : 'assistant'} expand onPress={() => void send()} />
        ) : (
          <MmButton label={copied === 'prompt' ? 'Prompt copied' : 'Copy prompt'} icon={copied === 'prompt' ? 'check' : 'copy'} expand onPress={() => void send()} />
        )}
        {shareFailed ? (
          <Notice icon="warning" text="The share sheet could not be opened. The prompt is copied: paste it into your assistant and attach the photos there." />
        ) : null}
        {refusal}
        {heard}
        <div className="app-gap" />
        {pasteControls('Or paste the answer here')}
      </Screen>
    );
  }

  const ticked = foods.filter((food) => food.keep);
  const troubled = ticked.filter((food) => foodDraftProblems(food).length > 0).length;
  const problemCount = foods.filter((food) => foodDraftProblems(food).length > 0).length;
  // What still keeps the foods from being saved, said once Save has been pressed (MM-220).
  const blocked =
    ticked.length === 0
      ? 'Tick at least one food to save it.'
      : troubled > 0
        ? `${troubled === 1 ? 'One ticked food needs' : `${troubled} ticked foods need`} fixing or unticking before saving.`
        : undefined;
  const setFood = (at: number, next: FoodDraft) => setFoods(foods.map((old, i) => (i === at ? next : old)));

  const remove = async (at: number) => {
    if (foods.length === 1) {
      const sure = await overlays.confirm({
        title: 'Remove the last food?',
        message: 'Removing it starts over, with nothing saved.',
        confirmLabel: 'Remove',
      });
      if (sure) setFoods(undefined);
      return;
    }
    setFoods(foods.filter((_, i) => i !== at));
  };

  const save = async () => {
    if (blocked !== undefined) {
      setTriedToSave(true);
      return;
    }
    setSaving(true);
    const saved: CustomFood[] = [];
    // A failure is said, never swallowed (MM-624): what was saved before it stays saved, and the review stays to try again.
    try {
      for (const draft of ticked) {
        const made = customFoodOfDraft(draft, draft.replaces ?? 0);
        const id = await services.customFoods.saveCustomFood(made);
        saved.push(new CustomFood({ ...made, id }));
      }
    } catch {
      setSaving(false);
      setSaveFailed(true);
      if (saved.length > 0) setFoods(foods.filter((food) => !saved.some((s) => sameName(s.name, food.name))));
      return;
    }
    setSaving(false);
    setSaveFailed(false);
    overlays.snack(saved.length === 1 ? `Saved ${saved[0]?.name ?? 'the food'}` : `Saved ${saved.length} foods`);
    onDone(saved);
  };

  return (
    <Screen title="With my AI">
      <h2 className="app-headline">Review the foods</h2>
      <p className="app-caption">Check each food before it is saved. Change anything that looks wrong. Nothing is logged from here.</p>
      {barcode !== undefined && foods.length > 1 ? (
        <p className="app-caption">{`The scanned barcode was put on no food: the answer has ${foods.length} foods. Add it to the right one later, under Edit.`}</p>
      ) : null}
      <p className="food-label food-label-spaced">{foods.length === 1 ? '1 food' : `${foods.length} foods`}</p>
      {foods.map((food, i) => (
        <Fragment key={`${i}-${food.name}`}>
          <FoodDraftRow
            food={food}
            existing={existingOf(food)}
            onChange={(next) => setFood(i, next)}
            onEdit={() => setEditing(i)}
            onRemove={() => void remove(i)}
          />
          {editing === i ? (
            <FoodDraftForm
              food={food}
              onSave={(changed) => {
                setFood(i, { ...changed, replaces: existingOf(changed)?.id === undefined ? undefined : changed.replaces });
                setEditing(undefined);
              }}
              onCancel={() => setEditing(undefined)}
            />
          ) : null}
        </Fragment>
      ))}
      {problemCount === 0 ? null : (
        <>
          <Notice
            text={
              `${problemCount === 1 ? 'One food has' : `${problemCount} foods have`} a problem, said under it. ` +
              'Fix it here, untick it, or copy the fixes to your assistant and paste its corrected answer.'
            }
          />
          <div className="app-gap-small" />
          <MmButton
            label={copied === 'fixes' ? 'Fixes copied' : 'Copy fixes for AI'}
            kind="secondary"
            icon={copied === 'fixes' ? 'check' : 'copy'}
            expand
            onPress={() => void copy(foodFixMessage(foods), 'fixes')}
          />
          {refusal}
          {heard}
          <div className="app-gap" />
          {pasteControls('Or paste the corrected answer here')}
        </>
      )}
      <div className="app-gap" />
      {saveFailed ? <Notice icon="warning" text="The foods could not be saved. Press Save to try again." /> : null}
      <MmButton label={saving ? 'Saving…' : ticked.length === 1 ? 'Save 1 food' : `Save ${ticked.length} foods`} expand onPress={saving ? undefined : () => void save()} />
      {!triedToSave || blocked === undefined ? null : (
        <p className="app-caption food-still-needed" role="alert">
          {blocked}
        </p>
      )}
      <MmButton label="Start again" kind="text" onPress={() => setFoods(undefined)} />
    </Screen>
  );
}
