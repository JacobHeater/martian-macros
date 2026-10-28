/**
 * Optional BYOK language-model provider for coaching narration (MM-665).
 *
 * `'none'` uses only the built-in deterministic archetypes and makes no
 * network request.
 */
export type CoachAiProvider = 'none' | 'gemini' | 'openai' | 'anthropic';

export const CoachAiProvider = {
  values: ['none', 'gemini', 'openai', 'anthropic'] as const satisfies readonly CoachAiProvider[],
} as const;
