import { onlineLookupQuestion } from '../../format/onlineLookupQuestion';
import { useApp } from '../../app/useApp';
import { MmButton } from '../../ui/MmButton';
import { Notice } from '../../ui/Notice';
import '../food.css';

interface OnlineLookupAskProps {
  /** What a yes would send. */
  sent: 'barcode' | 'words';
  /** Called once the person has allowed it, always or just this once. */
  onAllowed: () => void;
  /** Called when the person chose never. */
  onNever: () => void;
}

/**
 * The question before the first online lookup (MM-58), in the notice the
 * scan step already uses for what it found, with three answers: Always, Just
 * this once, Never. Always and Never are kept as the setting; once lasts for
 * this run of the app.
 */
export function OnlineLookupAsk({ sent, onAllowed, onNever }: OnlineLookupAskProps) {
  const { state } = useApp();
  const lookup = state.onlineLookup;
  const always = async () => {
    await lookup.choose('always');
    onAllowed();
  };
  const once = () => {
    lookup.allowOnce();
    onAllowed();
  };
  const never = async () => {
    await lookup.choose('never');
    onNever();
  };
  return (
    <div className="food-online-ask" role="group" aria-label="Look this up online?">
      <Notice text={onlineLookupQuestion(sent, lookup.sourceIds)} />
      <div className="app-gap-small" />
      <MmButton label="Just this once" expand onPress={once} />
      <div className="app-gap-small" />
      <div className="food-online-ask-row">
        <MmButton label="Always" kind="secondary" expand onPress={() => void always()} />
        <MmButton label="Never" kind="secondary" expand onPress={() => void never()} />
      </div>
    </div>
  );
}
