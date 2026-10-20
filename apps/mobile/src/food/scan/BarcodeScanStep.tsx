import { useState } from 'react';
import type { CustomFood } from '../../domain/food/custom/CustomFood';
import { normalizeBarcode } from '../../domain/food/normalizeBarcode';
import type { CatalogFood } from '../../foodCatalog/CatalogFood';
import type { ScannedBarcode } from '../../platform/ScannedBarcode';
import { useApp } from '../../app/useApp';
import { useCell } from '../../app/useCell';
import { useLoaded } from '../../app/useLoaded';
import { onlineLookupOffText } from '../../format/onlineLookupOffText';
import { onlineUnreachableText } from '../../format/onlineUnreachableText';
import { MmButton } from '../../ui/MmButton';
import { MmSpinner } from '../../ui/MmSpinner';
import { MmTextField } from '../../ui/MmTextField';
import { Notice } from '../../ui/Notice';
import { OnlineLookupAsk } from '../online/OnlineLookupAsk';
import '../food.css';

interface BarcodeScanStepProps {
  onFound: (food: CatalogFood) => void;
  onFoundCustom: (food: CustomFood) => void;
  /**
   * A product the packs do not have: read its label, to be saved against
   * these digits (MM-44).
   */
  onReadLabel: (gtin: string) => void;
  onManual: () => void;
  onBack: () => void;
}

/**
 * Scan a packaged food's barcode, or type its digits (MM-43). A product
 * found in the installed packs is handed to `onFound`; otherwise, if the
 * person allows it, the code is looked up online (MM-58), and failing that
 * the step says it is not there and offers the label or `onManual`.
 */
export function BarcodeScanStep({ onFound, onFoundCustom, onReadLabel, onManual, onBack }: BarcodeScanStepProps) {
  const { services, state } = useApp();
  // Kept loaded so a scan can look the user's own foods up at once.
  const customFoods = useCell(state.customFoods);
  const catalog = useLoaded(state.foodCatalog);
  const [digits, setDigits] = useState('');
  const [message, setMessage] = useState<string>();
  const [unknownGtin, setUnknownGtin] = useState<string>();
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  // A code the packs do not have, waiting on the person's answer to looking it up online (MM-58).
  const [asking, setAsking] = useState<string>();
  const [lookingUp, setLookingUp] = useState(false);
  // A code no service could be asked about, so Try again is offered (MM-58).
  const [unreachableGtin, setUnreachableGtin] = useState<string>();
  const online = state.onlineLookup;
  // Read so the step is drawn again when the choice changes.
  useCell(online.choice);
  useCell(online.allowedOnce);

  const notOnPhone = (gtin: string, { declined = false }: { declined?: boolean } = {}) => {
    setAsking(undefined);
    setUnknownGtin(gtin);
    setMessage(
      (declined ? `${onlineLookupOffText} ` : '') +
        'This product is not in the food database on this phone. You can read its label or enter it yourself.',
    );
  };

  /** Asks the services for `gtin`, now that it is allowed (MM-58). */
  const lookUpOnline = async (gtin: string) => {
    // The question's buttons stay in place, off, until the answer, so focus is not dropped (the panel's F4).
    setLookingUp(true);
    setUnknownGtin(undefined);
    setUnreachableGtin(undefined);
    setMessage('Looking it up online…');
    const result = await online.byBarcode(gtin);
    setLookingUp(false);
    setAsking(undefined);
    if (result.kind === 'found') {
      onFound(result.food);
      return;
    }
    setUnknownGtin(gtin);
    if (result.kind === 'unavailable') {
      setUnreachableGtin(gtin);
      setMessage(onlineUnreachableText);
    } else {
      setMessage('This product is not in the food database on this phone or online. You can read its label or enter it yourself.');
    }
  };

  const lookup = async (scanned: ScannedBarcode) => {
    const gtin = normalizeBarcode(scanned.digits, {
      symbology: scanned.symbology === 'gtin14' ? undefined : scanned.symbology,
    });
    setUnreachableGtin(undefined);
    if (gtin === undefined) {
      setUnknownGtin(undefined);
      setMessage('Those digits are not a valid barcode. Check them against the package.');
      return;
    }
    const custom = (customFoods.ready ? customFoods.value : []).find((f) => f.barcode === gtin);
    if (custom !== undefined) {
      onFoundCustom(custom);
      return;
    }
    const food = await catalog?.byBarcode(gtin);
    if (food !== undefined) {
      onFound(food);
      return;
    }
    if (online.allowed) {
      await lookUpOnline(gtin);
    } else if (online.mustAsk) {
      // The first unknown code with a service to ask: the status says so, and the question follows (MM-58, the panel's F3).
      setUnknownGtin(undefined);
      setMessage('This product is not in the food database on this phone. A question follows.');
      setAsking(gtin);
    } else {
      notOnPhone(gtin);
    }
  };

  const scan = async () => {
    try {
      const scanned = await services.barcodeScanner.scan();
      if (scanned !== undefined) await lookup(scanned);
    } catch {
      // Said from the status region, and the button stays in place (disabled) while
      // focus moves to the digits, the next useful control (MM-413).
      setCameraUnavailable(true);
      setUnknownGtin(undefined);
      setMessage('The camera is not available. Allow camera access in your phone settings to scan, or type the digits below.');
    }
  };

  return (
    <div className="food-sheet">
      <h2 className="app-headline">Scan a barcode</h2>
      <p className="app-caption">The camera reads the barcode on this phone.</p>
      <div className="app-gap-small" />
      {/* One primary action (MM-337): once a code is unknown, reading its label is the next step. A camera that cannot be used leaves the button in place, off (MM-413). */}
      <MmButton
        label="Scan with the camera"
        icon="barcode"
        kind={unknownGtin === undefined && asking === undefined && !lookingUp && !cameraUnavailable ? 'primary' : 'secondary'}
        expand
        onPress={cameraUnavailable || lookingUp ? undefined : () => void scan()}
      />
      <div className="app-gap-small" />
      <MmTextField
        key={cameraUnavailable ? 'digits-focused' : 'digits'}
        autoFocus={cameraUnavailable}
        label="Or type the digits"
        kind="number"
        value={digits}
        onChange={(text) => {
          setDigits(text);
          setMessage(undefined);
        }}
      />
      <div className="app-gap-small" />
      <MmButton
        label="Look up"
        kind="secondary"
        onPress={digits.trim() === '' || lookingUp ? undefined : () => void lookup({ digits, symbology: 'gtin14' })}
      />
      {asking === undefined ? null : (
        <>
          <div className="app-gap-small" />
          <OnlineLookupAsk
            sent="barcode"
            pending={lookingUp}
            onAllowed={() => void lookUpOnline(asking)}
            onNever={() => notOnPhone(asking, { declined: true })}
          />
        </>
      )}
      {/* A status region that exists before its text, so what a lookup found is announced, politely and without moving focus (MM-351). */}
      <div role="status" aria-live="polite" className={lookingUp ? 'app-row food-online-searching' : undefined}>
        {message === undefined ? null : lookingUp ? (
          <>
            <MmSpinner />
            <span>{message}</span>
          </>
        ) : (
          <>
            <div className="app-gap-small" />
            <Notice text={message} />
          </>
        )}
      </div>
      {message === undefined ? null : (
        <>
          <div className="app-gap-small" />
          {unknownGtin === undefined ? null : (
            <>
              <MmButton label="Read the label" expand onPress={() => onReadLabel(unknownGtin)} />
              <div className="app-gap-small" />
            </>
          )}
          {unreachableGtin === undefined ? null : (
            <>
              <MmButton label="Try again" kind="secondary" expand onPress={() => void lookUpOnline(unreachableGtin)} />
              <div className="app-gap-small" />
            </>
          )}
          <MmButton label="Enter manually" kind="secondary" expand onPress={onManual} />
        </>
      )}
      <MmButton label="Back to search" kind="text" onPress={onBack} />
    </div>
  );
}
