import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * MM-109: the app icon and the launch screen. CI builds no iOS app and cannot
 * look at a launcher, so this reads the shells' files: the launch screen and
 * the web view start on Martian's canvas (the default palette's first frame),
 * the Android icon has its themed layer, and every icon file the catalogs name
 * exists.
 */
const read = (path: string) => readFileSync(path, 'utf8');

function martianCanvas(): string {
  const tokens = read('src/theme/tokens.css');
  const martian = tokens.slice(tokens.indexOf('.theme-martian {'));
  const canvas = /--canvas:\s*(#[0-9a-f]{6})/i.exec(martian.slice(0, martian.indexOf('}')));
  expect(canvas, 'Martian names its canvas').not.toBeNull();
  return (canvas?.[1] ?? '').toLowerCase();
}

const res = 'android/app/src/main/res';

describe('the launch screen starts on the first frame’s colour', () => {
  it('Android draws its launch screen on the canvas', () => {
    const colour = /<color name="launch_canvas">(#[0-9a-f]{6})<\/color>/i.exec(read(`${res}/values/launch_canvas.xml`));
    expect(colour?.[1]?.toLowerCase()).toBe(martianCanvas());
    const styles = read(`${res}/values/styles.xml`);
    expect(styles).toContain('<item name="windowSplashScreenBackground">@color/launch_canvas</item>');
    expect(read(`${res}/drawable/launch_screen.xml`)).toContain('@color/launch_canvas');
  });

  it('the web view starts on the canvas', () => {
    expect(read('capacitor.config.ts')).toContain(`backgroundColor: '${martianCanvas()}'`);
  });

  it('iOS draws its launch screen on the canvas', () => {
    const storyboard = read('ios/App/App/Base.lproj/LaunchScreen.storyboard');
    const colour = /<color key="backgroundColor" red="([\d.]+)" green="([\d.]+)" blue="([\d.]+)"/.exec(storyboard);
    expect(colour, 'the launch view has a colour').not.toBeNull();
    const hex = martianCanvas();
    [1, 2, 3].forEach((channel) => {
      const expected = parseInt(hex.slice(2 * channel - 1, 2 * channel + 1), 16) / 255;
      expect(Number(colour?.[channel])).toBeCloseTo(expected, 3);
    });
    expect(storyboard).toContain('image="LaunchMark"');
  });
});

describe('the app icon', () => {
  it('Android’s adaptive icons have a foreground, a background and a themed layer', () => {
    ['ic_launcher', 'ic_launcher_round'].forEach((name) => {
      const icon = read(`${res}/mipmap-anydpi-v26/${name}.xml`);
      expect(icon).toContain('<foreground android:drawable="@drawable/ic_launcher_foreground"/>');
      expect(icon).toContain('<monochrome android:drawable="@drawable/ic_launcher_monochrome"/>');
    });
    expect(existsSync(`${res}/drawable/ic_launcher_foreground.xml`)).toBe(true);
    expect(existsSync(`${res}/drawable/ic_launcher_monochrome.xml`)).toBe(true);
  });

  it('every file the iOS catalog names exists', () => {
    ['AppIcon.appiconset', 'LaunchMark.imageset'].forEach((set) => {
      const folder = `ios/App/App/Assets.xcassets/${set}`;
      const contents = JSON.parse(read(`${folder}/Contents.json`)) as { images: { filename?: string }[] };
      contents.images.forEach(({ filename }) => {
        expect(filename, `${set} names a file for each image`).toBeDefined();
        expect(existsSync(`${folder}/${filename}`), `${set}/${filename}`).toBe(true);
      });
    });
  });

  it('has no text in it', () => {
    ['icon.svg', 'icon-dark.svg', 'icon-tinted.svg', 'launch-mark.svg'].forEach((master) => {
      expect(read(`design/${master}`)).not.toMatch(/<text\b/);
    });
  });
});
