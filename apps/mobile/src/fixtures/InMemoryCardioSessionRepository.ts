import type { CardioSessionRepository } from '../domain/repositories/CardioSessionRepository';
import type { CardioSession } from '../domain/training/CardioSession';
import { compareStrings } from '../lang/compareStrings';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `CardioSessionRepository` held in memory (MM-677), keyed by the platform's id. */
export class InMemoryCardioSessionRepository implements CardioSessionRepository {
  private readonly byPlatformId = new ObservableValue<ReadonlyMap<string, CardioSession>>(new Map());

  watchCardioSessions(): Watched<CardioSession[]> {
    return this.byPlatformId.watchAs((held) =>
      [...held.values()].sort((a, b) => b.start.getTime() - a.start.getTime() || compareStrings(b.platformId, a.platformId)),
    );
  }

  async saveCardioSessions(sessions: readonly CardioSession[]): Promise<void> {
    if (sessions.length === 0) return;
    const next = new Map(this.byPlatformId.value);
    for (const session of sessions) next.set(session.platformId, session);
    this.byPlatformId.value = next;
  }

  clear(): void {
    this.byPlatformId.value = new Map();
  }
}
