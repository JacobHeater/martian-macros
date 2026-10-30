import appIcon from '../assets/brand/app-icon.png';
import { encodeQr } from '../lang/encodeQr';
import { qrLogoArea } from '../lang/qrLogoArea';
import './ui.css';

/** The light margin a reader needs around a QR code, in modules. */
const quiet = 4;

interface MmQrCodeProps {
  /** What the code holds: digits, capital letters and ` $%*+-./:` (the alphanumeric mode). */
  text: string;
  /** What a screen reader hears for it. */
  label: string;
}

/**
 * A QR code with the app's icon in its middle (MM-698): drawn by the app, dark on light in every palette so any
 * camera reads it, at error-correction level H, which restores what the icon covers. The icon sits on a light square
 * of its own (`qrLogoArea`), so its colours never touch a module.
 */
export function MmQrCode({ text, label }: MmQrCodeProps) {
  const code = encodeQr(text);
  const logo = qrLogoArea(code.size);
  const inLogo = (x: number, y: number) =>
    x >= logo.from && x < logo.from + logo.span && y >= logo.from && y < logo.from + logo.span;
  let path = '';
  code.dark.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark && !inLogo(x, y)) path += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }),
  );
  const whole = code.size + quiet * 2;
  return (
    <div className="mm-qr" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${whole} ${whole}`} shapeRendering="crispEdges" aria-hidden="true">
        <rect className="mm-qr-ground" width={whole} height={whole} />
        <path className="mm-qr-modules" d={path} />
        <image
          href={appIcon}
          x={logo.from + quiet + 1}
          y={logo.from + quiet + 1}
          width={logo.span - 2}
          height={logo.span - 2}
          clipPath="inset(0 round 18%)"
        />
      </svg>
    </div>
  );
}
