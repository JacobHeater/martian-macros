import { screen } from '@testing-library/react';

/**
 * Waits for the Dashboard to have arrived: its last tier, "History" ("More
 * about this week" until MM-176), is drawn once the day's records are loaded (MM-254). Tests that
 * went on from "Logging coverage" before the history moved one tap down
 * wait on this instead.
 */
export const dashboardLoaded = (): Promise<HTMLElement> => screen.findByRole('button', { name: /^History/ });

/** Opens the history under the Dashboard (the tertiary tier). */
export async function openDashboardHistory(): Promise<void> {
  const { default: userEvent } = await import('@testing-library/user-event');
  await userEvent.click(await dashboardLoaded());
}
