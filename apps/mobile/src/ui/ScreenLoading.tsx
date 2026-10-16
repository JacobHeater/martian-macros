import { MmSpinner } from './MmSpinner';
import './ui.css';

/** A screen waiting on its records (MM-334): the spinner, where the content will be, and no words of internals. */
export function ScreenLoading() {
  return (
    <div className="mm-screen-loading">
      <MmSpinner />
    </div>
  );
}
