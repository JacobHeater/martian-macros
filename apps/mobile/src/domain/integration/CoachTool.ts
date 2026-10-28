/**
 * One tool the coach's model may call (MM-685): its name, what it is for
 * in the model's own terms, and the JSON schema of its input. Each
 * provider is given it in its own form (`HttpCoachNarrator`).
 */
export interface CoachTool {
  readonly name: string;
  readonly description: string;
  /** A JSON schema object (`type: 'object'`, its `properties`, `required`). */
  readonly input: Readonly<Record<string, unknown>>;
}
