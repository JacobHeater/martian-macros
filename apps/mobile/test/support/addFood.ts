import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** The add-food sheet, or the edit-food one. */
export const foodSheet = (name: 'Add food' | 'Edit food' = 'Add food') => screen.findByRole('dialog', { name });

/** Opens the add-food sheet from the action showing (the Dashboard's, or the Food screen's). */
export async function openAddFood(): Promise<HTMLElement> {
  await userEvent.click(await screen.findByRole('button', { name: 'Add food' }));
  return foodSheet();
}

/** Leaves the food choices for the form a food is typed in. */
export async function enterManually(sheet: HTMLElement): Promise<void> {
  await userEvent.click(within(sheet).getByRole('button', { name: 'Enter manually' }));
}

/** Types `text` in the field called `label`, replacing what is there. */
export async function typeIn(sheet: HTMLElement, label: string | RegExp, text: string): Promise<void> {
  const field = within(sheet).getByRole('textbox', { name: label });
  await userEvent.clear(field);
  if (text !== '') await userEvent.type(field, text);
}

/** Presses the button called `label` in the sheet. */
export async function press(sheet: HTMLElement, label: string | RegExp): Promise<void> {
  await userEvent.click(within(sheet).getByRole('button', { name: label }));
}
