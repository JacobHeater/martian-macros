import { MmAppBar } from '../ui/MmAppBar';
import './gallery.css';

/** The app bar, as the shell draws it (the bottom bar is gone, MM-711: the drawer is the one navigation). */
export function BarsCatalog() {
  return (
    <div className="gallery">
      <MmAppBar title="An app bar" />
    </div>
  );
}
