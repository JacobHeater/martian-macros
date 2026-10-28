import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from './useApp';
import { useCell } from './useCell';
import { useLoaded } from './useLoaded';
import type { CoachNarrationRequest } from '../domain/integration/CoachNarrationRequest';

/**
 * The words for a narration request (MM-673): nothing while the person's
 * own model is asked, so the screen shows the wait; the model's words once
 * it answers; the built-in words (`request.fallbackText`) only once the ask
 * failed, or at once when no model is set up. A pull to refresh asks again
 * rather than the cache (MM-670). `request` undefined is nothing to say.
 * `answerNow` (MM-686) shows the built-in words at once and keeps them: the
 * model's later answer is not shown over them, though the ask is let finish
 * so the cache holds it for next time.
 */
export function useCoachNarration(request: CoachNarrationRequest | undefined): {
  readonly text: string | undefined;
  readonly waiting: boolean;
  readonly answerNow: () => void;
} {
  const { services, state } = useApp();
  const config = useLoaded(state.coachAiConfig);
  const refreshes = useCell(state.coachRefreshes);
  const narratedAt = useRef(refreshes);
  const [answer, setAnswer] = useState<{ readonly key: string; readonly text: string } | undefined>(undefined);
  const [answeredNow, setAnsweredNow] = useState<string | undefined>(undefined);
  const cacheKey = request?.cacheKey;
  const off = config !== undefined && (config.provider === 'none' || config.apiKey.trim() === '');
  useEffect(() => {
    // Nothing is asked until the config is read: off means no request, and unread is not yet on (MM-673).
    if (request === undefined || config === undefined || off) return;
    let cancelled = false;
    const fresh = refreshes !== narratedAt.current;
    narratedAt.current = refreshes;
    if (fresh) {
      setAnswer(undefined);
      setAnsweredNow(undefined);
    }
    void services.coachNarrator.probe(request, { fresh }).then((outcome) => {
      if (!cancelled) setAnswer({ key: request.cacheKey, text: outcome.kind === 'narrated' ? outcome.text : request.fallbackText });
    });
    return () => {
      cancelled = true;
    };
    // The request is rebuilt each render; its key says when it changed.
  }, [cacheKey, config === undefined, off, refreshes, services.coachNarrator]);
  const answerNow = useCallback(() => {
    if (cacheKey !== undefined) setAnsweredNow(cacheKey);
  }, [cacheKey]);
  if (request === undefined) return { text: undefined, waiting: false, answerNow };
  if (off) return { text: request.fallbackText, waiting: false, answerNow };
  // Answered now: the built-in words stand, whatever the model says later (MM-686).
  if (answeredNow !== undefined && answeredNow === cacheKey) return { text: request.fallbackText, waiting: false, answerNow };
  if (answer !== undefined && answer.key === cacheKey) return { text: answer.text, waiting: false, answerNow };
  // The config not read yet counts as waiting too: nothing provisional is shown.
  return { text: undefined, waiting: true, answerNow };
}
