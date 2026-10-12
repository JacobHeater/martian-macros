import { useState } from 'react';
import { MmAppBar } from '../ui/MmAppBar';
import { MmIconButton } from '../ui/MmIconButton';
import { MmNavigationBar } from '../ui/MmNavigationBar';
import { MmSurface } from '../ui/MmSurface';
import type { DestinationId } from './DestinationId';
import { destinationTitle } from './destinationTitle';
import { destinations } from './destinations';
import './app.css';

interface HomeShellProps {
  onOpenSettings: () => void;
}

/**
 * The frame every destination sits in (MM-90, MM-99): its name and the way
 * to Settings above, the five destinations below. The destinations
 * themselves are empty until each is rebuilt (MM-228).
 */
export function HomeShell({ onOpenSettings }: HomeShellProps) {
  const [current, setCurrent] = useState<DestinationId>('dashboard');
  const label = destinations.find((d) => d.id === current)?.label ?? '';
  return (
    <div className="app-frame">
      <MmAppBar
        title={destinationTitle(current)}
        actions={<MmIconButton icon="settings" label="Settings" onPress={onOpenSettings} />}
      />
      <main className="app-body">
        <MmSurface>
          <p className="app-empty">{label} is not rebuilt yet.</p>
        </MmSurface>
      </main>
      <MmNavigationBar destinations={destinations} current={current} onSelect={setCurrent} />
    </div>
  );
}
