import type { CalendarDate } from '../domain/CalendarDate';
import { combineLatest } from '../domain/combineLatest';
import { intakeDaysFrom } from '../domain/intakeDaysFrom';
import type { IntakeDay } from '../domain/IntakeDay';
import type { IntakeReader } from '../domain/repositories/IntakeReader';
import type { Watched } from '../lang/Watched';
import type { InMemoryDayMarkRepository } from './InMemoryDayMarkRepository';
import type { InMemoryFoodRepository } from './InMemoryFoodRepository';

/** `IntakeReader` derived from an in-memory food log and day marks. */
export class InMemoryIntakeReader implements IntakeReader {
  private readonly food: InMemoryFoodRepository;
  private readonly marks: InMemoryDayMarkRepository;

  constructor(food: InMemoryFoodRepository, marks: InMemoryDayMarkRepository) {
    this.food = food;
    this.marks = marks;
  }

  watchIntakeDays({ since }: { since: CalendarDate }): Watched<IntakeDay[]> {
    return combineLatest(this.food.watchAll(), this.marks.watchAll(), (food, marks) =>
      intakeDaysFrom(
        food.filter((e) => !e.date.isBefore(since)),
        marks,
      ),
    );
  }
}
