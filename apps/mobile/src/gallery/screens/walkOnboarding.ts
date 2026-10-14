import { userEvent, within } from 'storybook/test';

/**
 * Walks a new installation's onboarding as a person would, stopping on
 * step `upTo` (1 is biological sex, 7 is the goal).
 */
export async function walkOnboarding(canvas: HTMLElement, upTo: number): Promise<void> {
  const app = within(canvas);
  const press = async (name: string | RegExp) => userEvent.click(await app.findByRole('button', { name }));
  const next = () => press('Next');
  const type = async (label: string, text: string) => userEvent.type(await app.findByRole('textbox', { name: label }), text);

  await press('Get started');
  if (upTo === 1) return;
  await press('Male');
  await next();
  if (upTo === 2) return;
  await press(/Choose a date/);
  await userEvent.click(await within(await app.findByRole('dialog')).findByRole('button', { name: 'OK' }));
  await next();
  if (upTo === 3) return;
  await type('Feet', '5');
  await type('Inches', '11');
  await type('lb', '200');
  await next();
  // Activity, training, health: each has an answer already.
  for (let step = 4; step < upTo; step += 1) await next();
}
