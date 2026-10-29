import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { CrashBoundary } from './app/CrashBoundary';
import { openAppServices } from './app/openAppServices';
import { seedDemo } from './app/seedDemo';
import { startApp } from './app/startApp';
import { CapacitorSystemBars } from './platform/CapacitorSystemBars';
import { runningNatively } from './platform/runningNatively';
import './theme/tokens.css';
import './theme/base.css';

const element = document.getElementById('root');
if (element === null) throw new Error('The page has no #root to draw the app in.');
const root = createRoot(element);

const systemBars = new CapacitorSystemBars();
// The services are opened and the app drawn by `startApp`, which says an opening that failed, with Try again (MM-694).
void startApp({
  render: (node) => root.render(node),
  open: openAppServices,
  draw: async (services) => {
    // A build made by `mm demo --seed` starts from the demo scenario every
    // time, and says so on every screen (MM-177). Only the demo identity
    // may: the build refuses the flag on any other (MM-8), and so does this.
    const demo = await seedDemo({ services, asked: __MM_DEMO_SEED__ && __MM_IDENTITY__ === 'demo', native: runningNatively() });
    // A crash in the app's own root is said too (MM-679), unthemed rather than blank; the app's own boundary keeps the theme.
    return (
      <StrictMode>
        <CrashBoundary>
          <App services={services} systemBars={systemBars} demo={demo} />
        </CrashBoundary>
      </StrictMode>
    );
  },
});
