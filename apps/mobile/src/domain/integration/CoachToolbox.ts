import type { CoachTool } from './CoachTool';
import type { CoachToolAnswer } from './CoachToolAnswer';

/**
 * The tools a narration request offers the model (MM-685), and how the app
 * answers a call: from its own state and engine, never the network. A call
 * of an unknown tool, or one that fails, answers with an error the model
 * reads; it never throws out of the loop.
 */
export interface CoachToolbox {
  readonly tools: readonly CoachTool[];
  call(name: string, input: unknown): Promise<CoachToolAnswer>;
}
