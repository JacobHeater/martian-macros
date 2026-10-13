import type { Navigator } from '../../app/Navigator';
import type { CalendarDate } from '../../domain/CalendarDate';
import type { AppServices } from '../../state/AppServices';
import type { AppState } from '../../state/AppState';
import type { Overlays } from '../../ui/Overlays';

/** What a story has in hand once the app is up, to bring it to the screen it is about. */
export interface StoryStage {
  readonly services: AppServices;
  readonly state: AppState;
  readonly navigator: Navigator;
  readonly overlays: Overlays;
  readonly today: CalendarDate;
}
