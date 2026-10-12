import { destinations } from '../app/destinations';
import { MmAppBar } from '../ui/MmAppBar';
import { MmNavigationBar } from '../ui/MmNavigationBar';
import './gallery.css';

/** The app bar and the navigation bar, as the shell draws them. */
export function BarsCatalog() {
  return (
    <div className="gallery">
      <MmAppBar title="An app bar" />
      <MmNavigationBar destinations={destinations} current="progress" onSelect={() => undefined} />
    </div>
  );
}
