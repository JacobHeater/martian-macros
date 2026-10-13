import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { openAppServices } from './app/openAppServices';
import { seedDemo } from './app/seedDemo';
import { CapacitorSystemBars } from './platform/CapacitorSystemBars';
import { runningNatively } from './platform/runningNatively';
import './theme/tokens.css';
import './theme/base.css';

const element = document.getElementById('root');
if (element === null) throw new Error('The page has no #root to draw the app in.');
const root = createRoot(element);

const systemBars = new CapacitorSystemBars();
openAppServices()
  .then(async (services) => {
    // A build made by `mm demo --seed` starts from the demo scenario every
    // time, and says so on every screen (MM-177).
    const demo = await seedDemo({ services, asked: __MM_DEMO_SEED__, native: runningNatively() });
    root.render(
      <StrictMode>
        <App services={services} systemBars={systemBars} demo={demo} />
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    element.textContent = `Could not open your data.\n\n${error instanceof Error ? error.message : String(error)}`;
  });
