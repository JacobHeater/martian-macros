import { useApp } from '../app/useApp';
import { useAsync } from '../app/useAsync';
import { useLoaded } from '../app/useLoaded';
import { photosOffered } from '../domain/photos/photosOffered';
import { byteSizeText } from '../format/byteSizeText';
import { MmSwitchRow } from '../ui/MmSwitchRow';

/**
 * The progress photo choices in Settings (MM-157): whether the photos are
 * offered on Progress, off to begin with for an eating-disorder history
 * (MM-11), and, with `backup`, whether the app's own backup carries them,
 * with what that adds to its size. Rows of the group they are drawn in.
 */
export function ProgressPhotoSwitches({ backup = false }: { backup?: boolean }) {
  const { services, state } = useApp();
  const settings = useLoaded(state.photoSettings);
  const setup = useLoaded(state.setup);
  const photos = useLoaded(state.progressPhotos) ?? [];
  const size = useAsync(() => services.progressPhotos.totalBytes(), `${photos.length}:${photos.at(-1)?.id ?? 0}`);
  if (settings === undefined || setup === undefined) return null;
  if (backup) {
    const sizeWords = size === undefined || size === 0 ? 'Your photos' : `Your photos (${byteSizeText(size)})`;
    return (
      <MmSwitchRow
        leadingIcon="camera"
        title="Back up photos"
        subtitle={
          settings.backUp
            ? `${sizeWords} go into each backup, encrypted with the rest, which makes the file that much larger.`
            : 'Off: progress photos stay only on this phone and are not in a backup.'
        }
        value={settings.backUp}
        onChange={(backUp) => void services.progressPhotos.savePhotoSettings({ ...settings, backUp })}
      />
    );
  }
  const offered = photosOffered(settings, setup.screening.eatingDisorderHistory);
  return (
    <MmSwitchRow
      leadingIcon="camera"
      title="Progress photos"
      subtitle="Photos on Progress, kept only in the app on this phone, behind your phone’s lock. Never analysed or sent."
      value={offered}
      onChange={(next) => void services.progressPhotos.savePhotoSettings({ ...settings, offered: next })}
    />
  );
}
