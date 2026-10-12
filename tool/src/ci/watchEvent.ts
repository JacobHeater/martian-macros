/**
 * One meaningful change seen by a watch. Events are stored before anything
 * is told about them, and their ids only ever go up within a watch. The
 * types are `watchStarted`, `headChanged`, `checkChanged`,
 * `ciSummaryChanged`, `requiredSummaryChanged`, `requiredDiscoveryChanged`,
 * `prStateChanged`, `monitorError`, `monitorRecovered`,
 * `ownershipTransferred` and `watchStopped`.
 */
export interface WatchEvent {
  /** 0 until the store assigns one. */
  readonly id: number;
  readonly type: string;

  /** When it was observed, UTC, ISO 8601. */
  readonly at: string;

  /** The head commit the event is about. */
  readonly headSha?: string | undefined;

  /** The check's key, for `checkChanged`. */
  readonly check?: string | undefined;

  /** The old and new state, in the vocabulary of the event's type. */
  readonly from?: string | undefined;
  readonly to?: string | undefined;
  readonly detail: Readonly<Record<string, unknown>>;
}

/** The same change observed twice has the same key, so a poll repeated after a crash does not store it again. */
export const dedupeKey = (event: WatchEvent): string => `${event.type}|${event.headSha}|${event.check}|${event.from}|${event.to}`;

export const watchEventWithId = (event: WatchEvent, id: number): WatchEvent => ({ ...event, id });

export function watchEventFromJson(json: Record<string, unknown>): WatchEvent {
  return {
    id: json['id'] as number,
    type: json['type'] as string,
    at: json['at'] as string,
    headSha: (json['headSha'] as string | null | undefined) ?? undefined,
    check: (json['check'] as string | null | undefined) ?? undefined,
    from: (json['from'] as string | null | undefined) ?? undefined,
    to: (json['to'] as string | null | undefined) ?? undefined,
    detail: (json['detail'] as Record<string, unknown> | undefined) ?? {},
  };
}

export function watchEventToJson(event: WatchEvent): Record<string, unknown> {
  return {
    id: event.id,
    type: event.type,
    at: event.at,
    headSha: event.headSha ?? null,
    check: event.check ?? null,
    from: event.from ?? null,
    to: event.to ?? null,
    ...(Object.keys(event.detail).length > 0 ? { detail: event.detail } : {}),
  };
}
