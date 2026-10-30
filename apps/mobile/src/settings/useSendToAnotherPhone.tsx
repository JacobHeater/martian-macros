import { useApp } from '../app/useApp';
import { MoveCode } from '../transfer/MoveCode';
import type { MoveParcel } from '../transfer/MoveParcel';
import { useOverlays } from '../ui/useOverlays';
import { SendMoveSheet } from './SendMoveSheet';
import type { SendWhat } from './SendWhat';

/**
 * Sending to the other phone (MM-698, MM-715): the camera reads the code the other phone shows, and the sending
 * sheet sends `parcel` to it; something scanned that is not a move code is said on the sheet, with Scan again.
 * `what` picks the sheet's words: a move of everything, or a copy of foods or water. The parcel is made only once a code is
 * in hand, so nothing is gathered for a scan that is closed.
 */
export function useSendToAnotherPhone() {
  const { services } = useApp();
  const overlays = useOverlays();

  return async ({ parcel, what }: { parcel: () => Promise<MoveParcel>; what: SendWhat }): Promise<void> => {
    for (;;) {
      let text: string | undefined;
      try {
        text = await services.codeScanner.scanCode();
      } catch {
        overlays.snack('The camera could not be opened. Allow Martian Macros to use it in the phone’s settings.');
        return;
      }
      if (text === undefined) return;
      // Not a move code: the sheet says so, with Scan again (the UX guard's F2).
      const code = MoveCode.parse(text);
      const again = await overlays.sheet<'again'>(
        'Sending to your other phone',
        (close) => <SendMoveSheet code={code} parcel={parcel} what={what} onScanAgain={() => close('again')} onClose={() => close()} />,
        { size: 'tall' },
      );
      if (again === undefined) return;
    }
  };
}
