import { useEffect } from 'react';
import { photoSets } from '../domain/photos/photoSets';
import { Fmt } from '../format/Fmt';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmButton } from '../ui/MmButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmMenuButton } from '../ui/MmMenuButton';
import { MmSection } from '../ui/MmSection';
import { useOverlays } from '../ui/useOverlays';
import { PhotoCameraScreen } from './PhotoCameraScreen';
import { PhotoCompareScreen } from './PhotoCompareScreen';
import { PhotoLockGate } from './PhotoLockGate';
import { PhotoThumbnail } from './PhotoThumbnail';
import { usePhotoLock } from './usePhotoLock';
import './progress.css';

/**
 * The progress photos (MM-157), behind the phone's own lock each time the
 * section is opened and each time the app comes back to it from the
 * background (`usePhotoLock`). While it is open the screen is kept out of
 * the app switcher; Android also refuses screenshots of it, which iOS
 * cannot. The sets newest first, a month to a section, each set a dated
 * row with its delete in the row's menu; a set taken, and two days
 * compared. The app stores and shows; it analyses nothing and sends nothing.
 */
export function ProgressPhotosScreen() {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const photos = useLoaded(state.progressPhotos);
  const { status, unlock } = usePhotoLock();

  // Out of the app switcher (and, on Android, screenshots) for as long as the section is open.
  useEffect(() => services.privateScreen.hide(), [services]);

  // Nothing shows until the lock is passed, and then until the photos are read.
  if (status !== 'open' || photos === undefined) {
    return <PhotoLockGate title="Progress photos" status={status === 'open' ? 'asking' : status} onUnlock={unlock} />;
  }
  const sets = photoSets(photos);
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
  // A section to a month, newest first, as the sets are.
  const months: { title: string; sets: typeof sets }[] = [];
  for (const set of sets) {
    const title = Fmt.monthYear(set.date);
    const month = months.at(-1);
    if (month?.title === title) month.sets.push(set);
    else months.push({ title, sets: [set] });
  }

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
        months.map((month) => (
          <MmSection key={month.title} icon="camera" title={month.title}>
            <MmListGroup>
              {month.sets.map((set) => (
                <div key={set.date.epochDay} className="progress-photo-day">
                  <MmListRow
                    dense
                    title={Fmt.longDate(set.date)}
                    trailingAction={
                      <MmMenuButton<'delete'>
                        icon="more"
                        label={`More actions for the photos of ${Fmt.longDate(set.date)}`}
                        items={[{ value: 'delete', label: 'Delete' }]}
                        onSelect={() => void remove(set)}
                      />
                    }
                  />
                  <div className="progress-photo-set">
                    {set.photos.map((photo) => (
                      <PhotoThumbnail key={photo.id} photo={photo} />
                    ))}
                  </div>
                </div>
              ))}
            </MmListGroup>
          </MmSection>
        ))
      )}
      <p className="app-caption">
        Kept only in the app on this phone: not in your photo library, not in your phone’s own backup, never analysed and
        never sent. They join the app’s backup only if you turn that on in Settings.
      </p>
    </Screen>
  );
}
