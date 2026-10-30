import { MmButton } from '../ui/MmButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import './settings.css';

/**
 * Which way a move goes (MM-698), asked on the phone where "Move to another phone" was pressed: send this phone's
 * records, or receive the other phone's here. The receiving side says that it replaces what this phone holds.
 */
export function MoveChoiceSheet({ onChoose, onCancel }: { onChoose: (side: 'send' | 'receive') => void; onCancel: () => void }) {
  return (
    <div className="settings-sheet">
      <h2 className="app-headline">Move to another phone</h2>
      <p className="app-text">Both phones need Martian Macros and the same Wi-Fi.</p>
      <MmListGroup>
        <MmListRow
          leadingIcon="camera"
          title="Send from this phone"
          subtitle="On the phone you are moving to, choose Receive on this phone, then scan its code here. This phone keeps its records."
          onPress={() => onChoose('send')}
        />
        <MmListRow
          leadingIcon="qrCode"
          title="Receive on this phone"
          subtitle="Shows a code for your other phone to scan. Replaces what this phone holds; you are asked first."
          onPress={() => onChoose('receive')}
        />
      </MmListGroup>
      <div className="app-gap" />
      <div className="app-row app-row-end">
        <MmButton label="Cancel" kind="text" onPress={onCancel} />
      </div>
    </div>
  );
}
