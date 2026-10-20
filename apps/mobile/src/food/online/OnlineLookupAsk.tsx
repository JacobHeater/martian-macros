import { onlineLookupQuestion } from '../../format/onlineLookupQuestion';
import { useApp } from '../../app/useApp';
import { MmButton } from '../../ui/MmButton';
import { Notice } from '../../ui/Notice';
import '../food.css';

interface OnlineLookupAskProps {
  /** What a yes would send. */
  sent: 'barcode' | 'words';
  /** Called once the person has allowed it, always or for now. */
  onAllowed: () => void;
  /** Called when the person chose never. */
  onNever: () => void;
  /** The answers are off while a lookup the person allowed is under way, so the buttons stay where they were. */
  pending?: boolean;
}

/**
 * The question before the first online lookup (MM-58), in the notice the
 * scan step already uses for what it found, with three answers laddered by
 * consequence and stacked like the step's own buttons: "Just for now"
 * (primary; until the app is closed), "Always" (secondary) and "Never"
 * (text). Always and Never are kept as the setting.
 */
export function OnlineLookupAsk({ sent, onAllowed, onNever, pending = false }: OnlineLookupAskProps) {
  const { state } = useApp();
  const lookup = state.onlineLookup;
  const always = async () => {
    await lookup.choose('always');
    onAllowed();
  };
  const now = () => {
    lookup.allowOnce();
    onAllowed();
  };
  const never = async () => {
    await lookup.choose('never');
    onNever();
  };
  return (
    <div className="food-online-ask" role="group" aria-label="Online lookup">
      <Notice text={onlineLookupQuestion(sent, lookup.sourceIds)} />
      <div className="app-gap-small" />
      <MmButton label="Just for now" expand onPress={pending ? undefined : now} />
      <div className="app-gap-small" />
      <MmButton label="Always" kind="secondary" expand onPress={pending ? undefined : () => void always()} />
      <div className="app-gap-small" />
      <MmButton label="Never" kind="text" expand onPress={pending ? undefined : () => void never()} />
    </div>
  );
}
