import type { CalendarDate } from '../domain/CalendarDate';
import type { MealPortionEaten } from '../domain/food/meal/MealPortionEaten';
import type { MealQuestionAnswers } from '../domain/food/meal/MealQuestionAnswers';
import { clockTimeText } from './clockTimeText';
import { Fmt } from './Fmt';
import { mealAnalysisPrompt } from './mealAnalysisPrompt';

/** Where the fixed prompt's questions start, and the line after which they end. */
const questionsStart = 'Before you answer, ask me, in one message:';
const questionsEnd = "If I already answered any of these, don't ask again.\n\n";

const eatenText: Readonly<Record<MealPortionEaten, string>> = {
  all: 'all of what is shown',
  most: 'most of what is shown',
  half: 'about half of what is shown',
  little: 'a little of what is shown',
};

const two = (value: number) => String(value).padStart(2, '0');
const weekday = (day: CalendarDate) =>
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(day.year, day.month - 1, day.day).getDay()];
const said = (day: CalendarDate) => `${weekday(day)}, ${Fmt.longDate(day)}`;

/**
 * The fixed prompt (MM-586) with the person's answers in place of the
 * questions it has the assistant ask (MM-599), so the assistant answers at
 * once. Only the answers are added, and today's date for reading them:
 * nothing else about the person.
 */
export function mealAnalysisPromptWith(answers: MealQuestionAnswers, today: CalendarDate): string {
  const start = mealAnalysisPrompt.indexOf(questionsStart);
  const end = mealAnalysisPrompt.indexOf(questionsEnd);
  if (start < 0 || end < start) throw new Error('The meal analysis prompt no longer has its questions.');
  const notEaten = answers.notEaten.trim();
  const from = answers.from.trim();
  const when =
    answers.eatenAt === undefined
      ? `${said(answers.day)}; I did not give a time, so leave "eaten_at" out.`
      : `${said(answers.day)} at ${clockTimeText(new Date(2000, 0, 1, Math.trunc(answers.eatenAt / 60), answers.eatenAt % 60))}. ` +
        `Use "eaten_at": "${answers.day.toString()}T${two(Math.trunc(answers.eatenAt / 60))}:${two(answers.eatenAt % 60)}".`;
  const told = [
    "I have already answered the questions you would ask, so don't ask me anything. Answer straight away.",
    `- The meal is called ${JSON.stringify(answers.name.trim())}. Use it exactly as the meal's "name".`,
    `- I ate ${eatenText[answers.eaten]}${notEaten === '' ? '' : `, except ${notEaten}`}.`,
    `- ${from === '' ? 'It is not from a brand or a restaurant.' : `It is from ${from}.`}`,
    `- I ate it on ${when}`,
    `- Today is ${said(today)}.`,
    answers.photosAttached
      ? 'My photos are attached to this message.'
      : 'I will send my photos in my next message. Wait for them before you answer.',
  ].join('\n');
  return `${mealAnalysisPrompt.slice(0, start)}${told}\n\n${mealAnalysisPrompt.slice(end + questionsEnd.length)}`;
}
