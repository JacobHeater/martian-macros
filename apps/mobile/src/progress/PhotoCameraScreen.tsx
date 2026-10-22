import { useContext, useEffect, useState } from 'react';
import type { CameraPreview } from '../domain/integration/CameraPreview';
import { PhotoPose } from '../domain/photos/PhotoPose';
import { photoSets } from '../domain/photos/photoSets';
import { tooSoonForPhotos } from '../domain/photos/tooSoonForPhotos';
import { photoPoseLabel } from '../format/photoPoseLabel';
import { CloseScreenContext } from '../app/CloseScreenContext';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmCameraPreview } from '../ui/MmCameraPreview';
import { MmSegmented } from '../ui/MmSegmented';
import { Notice } from '../ui/Notice';
import { useOverlays } from '../ui/useOverlays';
import { usePhotoBytes } from './usePhotoBytes';
import './progress.css';

/** How many sets the checklist is drawn for; from then on the habit is set. */
const checklistSets = 3;

/** What makes two photos comparable, said the first times (MM-157). */
const checklist = [
  'The same place, against the same background.',
  'The same light: no window behind you.',
  'The same time of day: the morning, with the weigh-in, before eating.',
  'The same clothing, and the camera at the same height and distance.',
] as const;

/**
 * Taking a progress photo (MM-157), inside the app: the camera's picture
 * with the last photo of the same pose laid over it faintly, to match
 * distance and framing; the checklist for the first sets; front, side and
 * back in turn, each optional. A set within a week of the last is kept and
 * gently noted. The photo goes nowhere but this phone's app storage.
 */
export function PhotoCameraScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const close = useContext(CloseScreenContext);
  const today = useCell(state.today);
  const photos = useLoaded(state.progressPhotos) ?? [];
  const [pose, setPose] = useState<PhotoPose>('front');
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [preview, setPreview] = useState<CameraPreview>();
  const [unavailable, setUnavailable] = useState(false);
  const [taking, setTaking] = useState(false);

  // The last photo of this pose is on screen: kept out of the app switcher and screenshots.
  useEffect(() => services.privateScreen.hide(), [services]);

  useEffect(() => {
    let live = true;
    let started: CameraPreview | undefined;
    void services.photoCamera.start(facing).then((camera) => {
      if (!live) {
        camera?.stop();
        return;
      }
      started = camera;
      setPreview(camera);
      setUnavailable(camera === undefined);
    });
    return () => {
      live = false;
      started?.stop();
    };
  }, [services, facing]);

  const previous = [...photos].reverse().find((photo) => photo.pose === pose);
  const overlay = usePhotoBytes(previous?.id);
  const setsBefore = photoSets(photos.filter((photo) => photo.date !== today)).length;

  const take = async () => {
    if (preview === undefined || taking) return;
    setTaking(true);
    try {
      const captured = await preview.capture();
      const firstToday = !photos.some((photo) => photo.date === today);
      await services.progressPhotos.savePhoto({ date: today, pose, takenAt: services.clock.now(), ...captured });
      const soon = firstToday && tooSoonForPhotos(photos, today);
      overlays.snack(
        soon
          ? `${photoPoseLabel(pose)} photo kept. Less than a week since the last set: every two to four weeks shows more.`
          : `${photoPoseLabel(pose)} photo kept.`,
      );
      const next = PhotoPose.values[PhotoPose.values.indexOf(pose) + 1];
      if (next === undefined) close?.();
      else setPose(next);
    } catch {
      overlays.snack('The photo could not be taken. Nothing was kept.');
    } finally {
      setTaking(false);
    }
  };

  return (
    <Screen title="Take photos">
      {setsBefore >= checklistSets ? null : (
        <InfoCard title="Each time, the same way">
          {checklist.map((line) => (
            <p key={line} className="app-text">
              {line}
            </p>
          ))}
        </InfoCard>
      )}
      <MmSegmented<PhotoPose>
        name="Pose"
        segments={PhotoPose.values.map((value) => ({ value, label: photoPoseLabel(value) }))}
        selected={pose}
        onChange={(chosen) => setPose(chosen ?? pose)}
      />
      <div className="app-gap-small" />
      {unavailable ? (
        <Notice
          kind="caution"
          title="The camera could not be opened"
          text="Allow the camera for Martian Macros in your phone’s settings, then come back."
        />
      ) : (
        <MmCameraPreview
          attach={preview?.attach}
          overlay={overlay}
          overlayLabel={`Your last ${photoPoseLabel(pose).toLowerCase()} photo, faint, to line this one up with`}
        />
      )}
      <p className="app-caption">
        {previous === undefined
          ? `Stand relaxed, ${pose === 'front' ? 'facing the camera' : pose === 'side' ? 'side on to the camera' : 'back to the camera'}, arms loose.`
          : 'Line yourself up with the faint photo: the same distance and the same framing.'}
      </p>
      <MmButton label={taking ? 'Taking…' : `Take ${photoPoseLabel(pose).toLowerCase()} photo`} icon="camera" expand onPress={preview === undefined ? undefined : () => void take()} />
      <MmButton
        label={facing === 'environment' ? 'Use the front camera' : 'Use the back camera'}
        kind="text"
        onPress={() => setFacing(facing === 'environment' ? 'user' : 'environment')}
      />
    </Screen>
  );
}
