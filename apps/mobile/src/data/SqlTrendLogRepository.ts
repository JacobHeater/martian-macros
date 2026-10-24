import type { CalendarDate } from '../domain/CalendarDate';
import type { FindingDismissal } from '../engine/trends/FindingDismissal';
import type { TrendAnnouncement } from '../engine/trends/TrendAnnouncement';
import type { TrendLogRepository } from '../engine/trends/TrendLogRepository';
import { TrendSpan } from '../engine/trends/TrendSpan';
import { TrendTier } from '../engine/trends/TrendTier';
import { TrendTransition } from '../engine/trends/TrendTransition';
import { FormatError } from '../lang/FormatError';
import type { Watched } from '../lang/Watched';
import type { SqlRow } from '../sql/SqlRow';
import type { AppDatabase } from './AppDatabase';
import { day, integer, named, number, optionalDay, orNull, text } from './columns';
import { insert } from './insert';

const said = TrendTransition.values.filter((t): t is TrendAnnouncement['transition'] => t !== 'none');

const directions = ['down', 'up'] as const;

const spanOf = (row: SqlRow): TrendSpan => {
  const days = integer(row, 'span_days');
  const span = TrendSpan.values.find((s) => s === days);
  if (span === undefined) throw new FormatError(`The stored span_days ${days} is not a span.`);
  return span;
};

/**
 * `TrendLogRepository` kept in the database (MM-605): the announcement log
 * in `trend_announcements`, a row for each entry with its figures as
 * columns, and the dismissals in `finding_dismissals`, a row for each
 * finding and day.
 */
export class SqlTrendLogRepository implements TrendLogRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchTrendAnnouncements(): Watched<TrendAnnouncement[]> {
    return this.db.watch(['trend_announcements'], async (db) =>
      (await db.select('SELECT * FROM trend_announcements ORDER BY on_epoch_day, id')).map((r) => ({
        key: text(r, 'trend_key'),
        transition: named(said, r, 'transition'),
        on: day(r, 'on_epoch_day'),
        direction: named(directions, r, 'direction'),
        onsetDate: optionalDay(r, 'onset_epoch_day'),
        figures: {
          effect: number(r, 'effect'),
          unit: text(r, 'unit'),
          n: number(r, 'n'),
          k: number(r, 'k'),
          span: spanOf(r),
          coverage: number(r, 'coverage'),
        },
        tier: named(TrendTier.values, r, 'tier'),
        rulesVersion: integer(r, 'rules_version'),
      })),
    );
  }

  watchFindingDismissals(): Watched<FindingDismissal[]> {
    return this.db.watch(['finding_dismissals'], async (db) =>
      (await db.select('SELECT * FROM finding_dismissals ORDER BY dismissed_epoch_day, rowid')).map((r) => ({
        findingId: text(r, 'finding_id'),
        dismissedOn: day(r, 'dismissed_epoch_day'),
      })),
    );
  }

  async appendTrendAnnouncements(entries: readonly TrendAnnouncement[]): Promise<void> {
    if (entries.length === 0) return;
    await this.db.write(['trend_announcements'], async (db) => {
      for (const entry of entries) {
        await insert(db, 'trend_announcements', {
          trend_key: entry.key,
          transition: entry.transition,
          on_epoch_day: entry.on.epochDay,
          direction: entry.direction,
          onset_epoch_day: orNull(entry.onsetDate?.epochDay),
          effect: entry.figures.effect,
          unit: entry.figures.unit,
          n: entry.figures.n,
          k: entry.figures.k,
          span_days: entry.figures.span,
          coverage: entry.figures.coverage,
          tier: entry.tier,
          rules_version: entry.rulesVersion,
        });
      }
    });
  }

  dismissFinding(findingId: string, dismissedOn: CalendarDate): Promise<void> {
    return this.db.write(['finding_dismissals'], (db) =>
      db.execute('INSERT OR IGNORE INTO finding_dismissals (finding_id, dismissed_epoch_day) VALUES (?, ?)', [
        findingId,
        dismissedOn.epochDay,
      ]),
    );
  }
}
