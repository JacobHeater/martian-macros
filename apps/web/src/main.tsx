import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { openAppServices } from './app/openAppServices';
import { Gallery } from './gallery/Gallery';
import { CapacitorSystemBars } from './platform/CapacitorSystemBars';
import './theme/tokens.css';
import './theme/base.css';

const element = document.getElementById('root');
if (element === null) throw new Error('The page has no #root to draw the app in.');
const root = createRoot(element);

// "?gallery" shows every token and component as built.
if (new URLSearchParams(window.location.search).has('gallery')) {
  root.render(
    <StrictMode>
      <Gallery />
    </StrictMode>,
  );
} else {
  const systemBars = new CapacitorSystemBars();
  openAppServices().then(
    (services) =>
      root.render(
        <StrictMode>
          <App services={services} systemBars={systemBars} />
        </StrictMode>,
      ),
    (error: unknown) => {
      element.textContent = `Could not open your data.\n\n${error instanceof Error ? error.message : String(error)}`;
    },
  );
}
