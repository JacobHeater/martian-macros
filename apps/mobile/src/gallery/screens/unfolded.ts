import type { HomeDestination } from '../../state/HomeDestination';
import type { AppState } from '../../state/AppState';

/**
 * Opens `tab` with every fold on it open (MM-676): the folds start closed
 * for the person, and the register draws what is inside them (MM-321). The
 * tab's own story, drawn as the person first sees it, opens the tab plainly.
 */
export function unfolded(state: AppState, tab: HomeDestination): void {
  state.foldsAllOpen.put(true);
  state.homeTab.put(tab);
}
