import { useCallback, useEffect, useState } from 'react';
import { photoSets } from '../domain/photos/photoSets';
import { Fmt } from '../format/Fmt';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmIconButton } from '../ui/MmIconButton';
import { Notice } from '../ui/Notice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { useOverlays } from '../ui/useOverlays';
import { PhotoCameraScreen } from './PhotoCameraScreen';
import { PhotoCompareScreen } from './PhotoCompareScreen';
import { PhotoThumbnail } from './PhotoThumbnail';
import './progress.css';

/**
 * The progress photos (MM-157), behind the phone's own lock each time the
 * section is opened, and kept out of the app switcher and screenshots while
 * it is. The sets newest first, a set taken, and two days compared. The app
 * stores and shows; it analyses nothing and sends nothing.
 */
export function ProgressPhotosScreen() {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const photos = useLoaded(state.progressPhotos);
  const [lock, setLock] = useState<'asking' | 'open' | 'locked'>('asking');

  // Out of the app switcher and screenshots for as long as the section is open.
  useEffect(() => services.privateScreen.hide(), [services]);

  const unlock = useCallback(async (live: () => boolean = () => true) => {
    setLock('asking');
    const outcome = await services.deviceLock.unlock('Unlock to see your progress photos.');
    // A phone with no lock set has nothing to ask; the photos open as the rest of the app does.
    if (live()) setLock(outcome === 'refused' ? 'locked' : 'open');
  }, [services]);

  useEffect(() => {
    let live = true;
    void unlock(() => live);
    return () => {
      live = false;
    };
  }, [unlock]);

  if (lock === 'asking' || (lock === 'open' && photos === undefined)) {
    return <Screen title="Progress photos">{<ScreenLoading />}</Screen>;
  }
  if (lock === 'locked') {
    return (
      <Screen title="Progress photos">
        <Notice
          icon="lock"
          title="Locked"
          text="Your progress photos open only after your phone’s lock: face, fingerprint or passcode."
          action={<MmButton label="Unlock" kind="secondary" onPress={() => void unlock()} />}
        />
      </Screen>
    );
  }
  const sets = photoSets(photos ?? []);
  const remove = async (set: (typeof sets)[number]) => {
    const sure = await overlays.confirm({
      title: 'Delete this set?',
      message: `The photos of ${Fmt.longDate(set.date)} are deleted from this phone.`,
      confirmLabel: 'Delete',
    });
    if (!sure) return;
    for (const photo of set.photos) await services.progressPhotos.deletePhoto(photo.id);
    overlays.snack('Deleted.');
  };

  return (
    <Screen title="Progress photos">
      <p className="app-text">
        Front, side and back, standing relaxed. Every two to four weeks is enough: a body changes slowly, and the same
        place, light and time each time matter more than how often.
      </p>
      <div className="app-gap-small" />
      <MmButton label="Take photos" icon="camera" expand onPress={() => void navigator.push(() => <PhotoCameraScreen />)} />
      {sets.length < 2 ? null : (
        <MmButton label="Compare two days" kind="secondary" expand onPress={() => void navigator.push(() => <PhotoCompareScreen />)} />
      )}
      <div className="app-gap" />
      {sets.length === 0 ? (
        <p className="app-text app-muted">No photos yet. Each pose is optional; take what you are comfortable with.</p>
      ) : (
        sets.map((set) => (
          <InfoCard
            key={set.date.epochDay}
            title={Fmt.longDate(set.date)}
            trailing={<MmIconButton icon="delete" label={`Delete the photos of ${Fmt.longDate(set.date)}`} onPress={() => void remove(set)} />}
          >
            <div className="progress-photo-set">
              {set.photos.map((photo) => (
                <PhotoThumbnail key={photo.id} photo={photo} />
              ))}
            </div>
          </InfoCard>
        ))
      )}
      <p className="app-caption">
        Kept only in the app on this phone: not in your photo library, not in your phone’s own backup, never analysed and
        never sent. They join the app’s backup only if you turn that on in Settings.
      </p>
    </Screen>
  );
}
