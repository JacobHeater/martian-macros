import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodGroup } from '../../src/domain/food/FoodGroup';
import { foodPrompt } from '../../src/format/foodPrompt';
import { foodPromptWith } from '../../src/format/foodPromptWith';

/** MM-709: the fixed prompt, and the person's answers put in its place (MM-708). */
const today = CalendarDate.of(2026, 10, 30);
const answers = { name: '', homemade: false, from: '', serving: '', servingGrams: undefined, barcode: undefined, notes: '', photosAttached: false };

it('the fixed prompt names every group and every field, and holds nothing about the person', () => {
  for (const group of FoodGroup.values) expect(foodPrompt).toContain(group);
  for (const field of ['vitamin_d_ug', 'sugar_alcohols_g', 'alcohol_g', 'cholesterol_mg', '"ingredients"', '"barcode"']) expect(foodPrompt).toContain(field);
  expect(foodPrompt).not.toMatch(/target|goal|weight|diet/i);
});

it('the answers take the place of what the assistant would ask', () => {
  const prompt = foodPromptWith(
    { ...answers, name: 'Buttermilk biscuit', homemade: true, serving: '1 biscuit', servingGrams: 60, notes: 'extra flaky', photosAttached: true },
    today,
  );
  expect(prompt).toContain('- It is called "Buttermilk biscuit". Use it exactly as the food\'s "name".');
  expect(prompt).toContain('- It is homemade. Set "brand" to "Homemade", list what likely went into one serving of it as "ingredients"');
  expect(prompt).toContain('- One serving is "1 biscuit", and it weighs 60 g. Use that as the "serving".');
  expect(prompt).toContain('- I have not scanned a barcode.');
  expect(prompt).toContain('- Something else that may help: extra flaky');
  expect(prompt).toContain('- Today is Friday, October 30, 2026.');
  expect(prompt).toContain('- My photos are attached to this message.');
  expect(prompt, 'the fixed words it replaces are gone').not.toContain('I will tell you its name, where it is from');
  expect(prompt, 'the rules stay').toContain('Rules for the JSON:');
});

it('a brand, a barcode, no name and no serving are each said in their own way', () => {
  const prompt = foodPromptWith({ ...answers, from: 'Pillsbury', barcode: '00012345678905' }, today);
  expect(prompt).toContain('- I have not named it: name it from the photos, as a food database would.');
  expect(prompt).toContain('- It is from Pillsbury. Use that as the "brand". Leave "ingredients" as an empty list.');
  expect(prompt).toContain('- I have not said what one serving is: propose one as someone would usually eat or log it, and give its grams.');
  expect(prompt).toContain('- Its barcode is 00012345678905. Use it as the "barcode".');
  expect(prompt).toContain('- I will send my photos in my next message, if I have any.');
  const weighed = foodPromptWith({ ...answers, serving: '1 scoop' }, today);
  expect(weighed).toContain('- One serving is "1 scoop"; work out its grams. Use that as the "serving".');
  expect(foodPromptWith(answers, today)).toContain('- It is not from a brand or a restaurant that I know of.');
});
