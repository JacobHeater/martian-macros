import { MmButton } from './MmButton';
import { Notice } from './Notice';

interface ReadFailedNoticeProps {
  /** What could not be read, in a person's words: "Could not read your weigh-ins". */
  title: string;
  /** What that changes, said before the reassurance, if anything. */
  consequence?: string;
  /** Said after the reassurance: what to do if trying again does not help. */
  otherwise?: string;
  onRetry: () => void;
}

/**
 * A read that went wrong (MM-334), as screen-direction's Error state: a
 * neutral notice headed with what failed, that nothing logged was changed,
 * and a retry. Announced when it appears. Only for a read: a failed save
 * says what was not saved instead.
 */
export function ReadFailedNotice({ title, consequence, otherwise, onRetry }: ReadFailedNoticeProps) {
  const body = [consequence, 'Nothing you logged has been changed.', otherwise].filter((part) => part !== undefined);
  return (
    <div className="app-stack-item" role="alert">
      <Notice
        title={title}
        text={body.join(' ')}
        action={<MmButton label="Try again" kind="secondary" onPress={onRetry} />}
      />
    </div>
  );
}
