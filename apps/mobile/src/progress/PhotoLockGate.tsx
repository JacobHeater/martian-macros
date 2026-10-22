import { Screen } from '../app/Screen';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';
import { ScreenLoading } from '../ui/ScreenLoading';

interface PhotoLockGateProps {
  /** The title of the screen the photos are on. */
  title: string;
  /** Whether the lock is being asked or was not passed. */
  status: 'asking' | 'locked';
  /** Asks for the lock again. */
  onUnlock: () => void;
}

/**
 * What a screen of progress photos shows in place of them (MM-157) until
 * the phone's lock is passed: nothing while it is asked, and the way to
 * ask again when it was not passed. The photos, the camera and the
 * comparison all show this one, so a locked state reads the same on each.
 */
export function PhotoLockGate({ title, status, onUnlock }: PhotoLockGateProps) {
  if (status === 'asking') return <Screen title={title}>{<ScreenLoading />}</Screen>;
  return (
    <Screen title={title}>
      <Notice
        icon="lock"
        title="Locked"
        text="Your progress photos open only after your phone’s lock: face, fingerprint or passcode."
        action={<MmButton label="Unlock" kind="secondary" onPress={onUnlock} />}
      />
    </Screen>
  );
}
