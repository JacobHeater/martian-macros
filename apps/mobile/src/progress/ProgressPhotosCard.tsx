import { photoSets } from '../domain/photos/photoSets';
import { photosOffered } from '../domain/photos/photosOffered';
import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmSection } from '../ui/MmSection';
import { ProgressPhotosScreen } from './ProgressPhotosScreen';

/**
 * The way into the progress photos on Progress (MM-157): a section line
 * saying when the last set was taken, and nothing of the photos
 * themselves, which open behind the phone's lock. Not offered with an
 * eating-disorder history until turned on in Settings (MM-11).
 */
export function ProgressPhotosCard() {
  const { state } = useApp();
  const navigator = useNavigator();
  const setup = useLoaded(state.setup);
  const settings = useLoaded(state.photoSettings);
  const photos = useLoaded(state.progressPhotos) ?? [];
  if (setup === undefined || settings === undefined) return null;
  if (!photosOffered(settings, setup.screening.eatingDisorderHistory)) return null;
  const last = photoSets(photos)[0];
  return (
    <MmSection
      icon="camera"
      title="Progress photos"
      summary={last === undefined ? 'None yet. Private to this phone.' : `Last set ${Fmt.longDate(last.date)}.`}
      opens="Opens your photos, after your phone’s lock"
      onPress={() => void navigator.push(() => <ProgressPhotosScreen />)}
    />
  );
}
