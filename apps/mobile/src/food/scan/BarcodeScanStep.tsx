import { useState } from 'react';
import type { CustomFood } from '../../domain/food/custom/CustomFood';
import { normalizeBarcode } from '../../domain/food/normalizeBarcode';
import type { CatalogFood } from '../../foodCatalog/CatalogFood';
import type { ScannedBarcode } from '../../platform/ScannedBarcode';
import { useApp } from '../../app/useApp';
import { useCell } from '../../app/useCell';
import { useLoaded } from '../../app/useLoaded';
import { MmButton } from '../../ui/MmButton';
import { MmTextField } from '../../ui/MmTextField';
import { Notice } from '../../ui/Notice';
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
 * found in the installed packs is handed to `onFound`; otherwise the step
 * says it is not there and offers `onManual`.
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

  const lookup = async (scanned: ScannedBarcode) => {
    const gtin = normalizeBarcode(scanned.digits, {
      symbology: scanned.symbology === 'gtin14' ? undefined : scanned.symbology,
    });
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
    if (food === undefined) {
      setUnknownGtin(gtin);
      setMessage(
        'This product is not in the food database on this phone. You can read its label or enter it yourself.',
      );
      return;
    }
    onFound(food);
  };

  const scan = async () => {
    try {
      const scanned = await services.barcodeScanner.scan();
      if (scanned !== undefined) await lookup(scanned);
    } catch {
      setCameraUnavailable(true);
    }
  };

  return (
    <div className="food-sheet">
      <h2 className="app-headline">Scan a barcode</h2>
      <p className="app-caption">The camera reads the barcode on this phone. Nothing is uploaded.</p>
      <div className="app-gap-small" />
      {cameraUnavailable ? (
        <Notice
          text={
            'The camera is not available. Allow camera access in ' +
            'your phone settings to scan, or type the digits below.'
          }
        />
      ) : (
        // One primary action (MM-337): once a code is unknown, reading its label is the next step.
        <MmButton
          label="Scan with the camera"
          icon="barcode"
          kind={unknownGtin === undefined ? 'primary' : 'secondary'}
          expand
          onPress={() => void scan()}
        />
      )}
      <div className="app-gap-small" />
      <MmTextField
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
        onPress={digits.trim() === '' ? undefined : () => void lookup({ digits, symbology: 'gtin14' })}
      />
      {/* A status region that exists before its text, so what a lookup found is announced, politely and without moving focus (MM-351). */}
      <div role="status" aria-live="polite">
        {message === undefined ? null : (
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
          <MmButton label="Enter manually" kind="secondary" expand onPress={onManual} />
        </>
      )}
      <MmButton label="Back to search" kind="text" onPress={onBack} />
    </div>
  );
}
