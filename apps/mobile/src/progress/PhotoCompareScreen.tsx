import { useEffect, useState } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { PhotoPose } from '../domain/photos/PhotoPose';
import { comparedPhotoLines } from '../format/comparedPhotoLines';
import { Fmt } from '../format/Fmt';
import { photoPoseLabel } from '../format/photoPoseLabel';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmSegmented } from '../ui/MmSegmented';
import { useOverlays } from '../ui/useOverlays';
import { ComparedPhoto } from './ComparedPhoto';
import './progress.css';

interface PhotoCompareScreenProps {
  /** Whether a weight is said under each photo; off when the person has chosen not to see weights (MM-118). */
  showWeight?: boolean;
}

/**
 * Two days compared (MM-157): the same pose from each, side by side, the
 * earlier on the left, with its day, trend weight and waist under it. Any
 * two days can be chosen. No slider that morphs one into the other, no
 * score, and nothing to export: the person looks.
 */
export function PhotoCompareScreen({ showWeight = true }: PhotoCompareScreenProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const photos = useLoaded(state.progressPhotos) ?? [];
  const waist = useLoaded(state.waist) ?? [];
  const trend = useCell(state.coach)?.trend ?? [];
  const units = useLoaded(state.setup)?.unitSystem ?? 'imperial';
  // No weight under the photos when the weight display is Hidden (MM-118); the trend's is shown otherwise.
  const weightDisplay = useCell(state.weightDisplay);
  const [pose, setPose] = useState<PhotoPose>('front');
  const [chosen, setChosen] = useState<{ earlier?: CalendarDate | undefined; later?: CalendarDate | undefined }>({});

  // Out of the app switcher and screenshots while the photos show.
  useEffect(() => services.privateScreen.hide(), [services]);

  const ofPose = photos.filter((photo) => photo.pose === pose);
  const days = [...new Map(ofPose.map((photo) => [photo.date.epochDay, photo.date])).values()].sort((a, b) => a.epochDay - b.epochDay);
  const earlier = chosen.earlier !== undefined && days.includes(chosen.earlier) ? chosen.earlier : days[0];
  const later = chosen.later !== undefined && days.includes(chosen.later) ? chosen.later : days[days.length - 1];
  // The newest photo of the pose on each day.
  const photoOn = (day: CalendarDate | undefined) => [...ofPose].reverse().find((photo) => photo.date === day);
  const left = photoOn(earlier);
  const right = photoOn(later);
  const fmt = new Fmt(units, { weightDisplay });
  const lines = (date: CalendarDate) =>
    comparedPhotoLines({ date, trend, waist, fmt, showWeight: showWeight && weightDisplay !== 'hidden' });

  const choose = async (side: 'earlier' | 'later') => {
    const picked = await overlays.options<number>({
      title: side === 'earlier' ? 'The day on the left' : 'The day on the right',
      options: days.map((day) => ({ value: day.epochDay, label: Fmt.longDate(day) })),
      selected: (side === 'earlier' ? earlier : later)?.epochDay,
    });
    if (picked === undefined) return;
    const day = days.find((d) => d.epochDay === picked.value);
    setChosen({ ...chosen, [side]: day });
  };

  return (
    <Screen title="Compare">
      <MmSegmented<PhotoPose>
        name="Pose"
        segments={PhotoPose.values.map((value) => ({ value, label: photoPoseLabel(value) }))}
        selected={pose}
        onChange={(next) => setPose(next ?? pose)}
      />
      <div className="app-gap-small" />
      {left === undefined || right === undefined || days.length < 2 ? (
        <p className="app-text app-muted">
          {`Two days with a ${photoPoseLabel(pose).toLowerCase()} photo are needed to compare.`}
        </p>
      ) : (
        <>
          <div className="progress-photo-pair">
            <ComparedPhoto photo={left} lines={lines(left.date)} />
            <ComparedPhoto photo={right} lines={lines(right.date)} />
          </div>
          <div className="app-row">
            <MmButton label="Change left day" kind="text" onPress={() => void choose('earlier')} />
            <MmButton label="Change right day" kind="text" onPress={() => void choose('later')} />
          </div>
        </>
      )}
    </Screen>
  );
}
