import type { CoachAiProvider } from '../domain/integration/CoachAiProvider';

const names: Readonly<Record<CoachAiProvider, string>> = {
  none: 'The built-in coach',
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

/** A provider's name alone, to start a sentence with ("Google Gemini refused the request", MM-671). */
export function coachAiProviderName(provider: CoachAiProvider): string {
  return names[provider];
}
