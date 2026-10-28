import { Component, type ErrorInfo, type ReactNode } from 'react';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';

interface CrashBoundaryProps {
  children: ReactNode;
}

interface CrashBoundaryState {
  crashed: boolean;
}

/**
 * A crash while drawing, caught and said in words (MM-679): never a blank
 * screen. The notice is a failed read's shape (MM-334): what happened, that
 * nothing logged has been changed, Try again (which draws again), and what
 * to do if it keeps happening. The error itself goes to the console for
 * whoever debugs it, never to the person (MM-333). A class, since React
 * gives no other way to catch a render error.
 */
export class CrashBoundary extends Component<CrashBoundaryProps, CrashBoundaryState> {
  override state: CrashBoundaryState = { crashed: false };

  static getDerivedStateFromError(): CrashBoundaryState {
    return { crashed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('The app crashed while drawing.', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.crashed) return this.props.children;
    return (
      <div className="app-centered app-centered-page" role="alert">
        <div className="app-stack-item">
          <Notice
            title="Something went wrong while drawing this"
            text="Nothing you logged has been changed. If it keeps happening, close the app and open it again."
            action={<MmButton label="Try again" kind="secondary" onPress={() => this.setState({ crashed: false })} />}
          />
        </div>
      </div>
    );
  }
}
