import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodQuestionAnswers } from '../domain/food/custom/FoodQuestionAnswers';
import { Fmt } from './Fmt';
import { foodPrompt } from './foodPrompt';

/** Where the fixed prompt says what it will be told, and the line after which that ends. */
const toldStart = 'What I know about the food:';
const toldEnd = 'Otherwise leave "ingredients" as an empty list.\n\n';

const weekday = (day: CalendarDate) =>
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(day.year, day.month - 1, day.day).getDay()];

/**
 * The fixed prompt (MM-709) with the person's answers in place of what it
 * says it will be told (MM-708), so the assistant answers at once. Only the
 * answers are added, and today's date: nothing else about the person.
 */
export function foodPromptWith(answers: FoodQuestionAnswers, today: CalendarDate): string {
  const start = foodPrompt.indexOf(toldStart);
  const end = foodPrompt.indexOf(toldEnd);
  if (start < 0 || end < start) throw new Error('The food prompt no longer says what it is told.');
  const name = answers.name.trim();
  const from = answers.from.trim();
  const serving = answers.serving.trim();
  const notes = answers.notes.trim();
  const grams = answers.servingGrams;
  const told = [
    'What I know about the food:',
    name === '' ? '- I have not named it: name it from the photos, as a food database would.' : `- It is called ${JSON.stringify(name)}. Use it exactly as the food's "name".`,
    answers.homemade
      ? '- It is homemade. Set "brand" to "Homemade", list what likely went into one serving of it as "ingredients", each with its grams, and work the nutrition out from them and the photos. I will correct the list.'
      : from === ''
        ? '- It is not from a brand or a restaurant that I know of. Leave "ingredients" as an empty list.'
        : `- It is from ${from}. Use that as the "brand". Leave "ingredients" as an empty list.`,
    serving === ''
      ? '- I have not said what one serving is: propose one as someone would usually eat or log it, and give its grams.'
      : `- One serving is ${JSON.stringify(serving)}${grams === undefined ? '; work out its grams.' : `, and it weighs ${grams} g.`} Use that as the "serving".`,
    answers.barcode === undefined ? '- I have not scanned a barcode.' : `- Its barcode is ${answers.barcode}. Use it as the "barcode".`,
    ...(notes === '' ? [] : [`- Something else that may help: ${notes}`]),
    `- Today is ${weekday(today)}, ${Fmt.longDate(today)}.`,
    answers.photosAttached ? '- My photos are attached to this message.' : '- I will send my photos in my next message, if I have any. If none come, work from what I said.',
  ].join('\n');
  return `${foodPrompt.slice(0, start)}${told}\n\n${foodPrompt.slice(end + toldEnd.length)}`;
}
