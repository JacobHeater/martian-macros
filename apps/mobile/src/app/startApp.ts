import { createElement, type ReactNode } from 'react';
import type { AppServices } from '../state/AppServices';
import { OpeningFailed } from './OpeningFailed';

/**
 * Starts the app: opens the services, then renders what `draw` makes of them.
 * An opening that fails is said in the app's own words with Try again, which
 * opens again (MM-694); what went wrong goes to the console, for whoever
 * debugs it (MM-333). Runs on every start of the web app: the first, and each
 * one the shell makes when iOS drops the web view's process.
 */
export function startApp({
  render,
  open,
  draw,
}: {
  render: (node: ReactNode) => void;
  open: () => Promise<AppServices>;
  draw: (services: AppServices) => Promise<ReactNode>;
}): Promise<void> {
  const start = async (): Promise<void> => {
    try {
      render(await draw(await open()));
    } catch (error) {
      console.error(error);
      render(createElement(OpeningFailed, { onRetry: start }));
    }
  };
  return start();
}
