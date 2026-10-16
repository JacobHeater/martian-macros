import { useEffect, useState } from 'react';
import { App } from '../../app/App';
import { TermsAcceptance } from '../../domain/TermsAcceptance';
import type { ThemePreference } from '../../domain/ThemePreference';
import { FixedClock } from '../../fixtures/FixedClock';
import { InMemoryRepositories } from '../../fixtures/InMemoryRepositories';
import { FixturePack } from '../../foodCatalog/FixturePack';
import { FoodCatalog } from '../../foodCatalog/FoodCatalog';
import { SqliteFoodPack } from '../../foodCatalog/SqliteFoodPack';
import { writeFoodPack } from '../../foodCatalog/writeFoodPack';
import { constant } from '../../lang/constant';
import { WasmSqlDatabase } from '../../sql/wasm/WasmSqlDatabase';
import type { AppServices } from '../../state/AppServices';
import { termsOfUse } from '../../terms/termsOfUse';
import { fixtureServices } from '../fixtureServices';
import { demoScenario } from './demoScenario';
import type { StoryDevice } from './StoryDevice';
import { StoryOpener } from './StoryOpener';
import type { StoryScenario } from './StoryScenario';
import type { StoryStage } from './StoryStage';
import type { StoryTerms } from './StoryTerms';
import { storyToday } from './storyToday';

interface StoryAppProps {
  /** The look chosen in Storybook's toolbar. Not stored when undefined, as on a new installation. */
  palette: ThemePreference | undefined;
  /** What the person has stored. The demo's ten weeks unless a story is about something else. */
  scenario?: StoryScenario | undefined;
  /** What the phone brings: a health platform, a camera. Nothing of a device unless given. */
  device?: StoryDevice | undefined;
  /** Whether the terms of use were agreed to. They were, unless a story is about the terms (MM-242). */
  terms?: StoryTerms | undefined;
  /** Brings the app to the screen the story is about, once it is up. */
  open?: ((stage: StoryStage) => void | Promise<void>) | undefined;
}

/** The fixture pack, written in memory and read as the app reads an installed pack. */
async function fixtureCatalog(): Promise<FoodCatalog> {
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(db, FixturePack.header, FixturePack.entries);
  return new FoodCatalog([await SqliteFoodPack.open(db)]);
}

/**
 * The whole app, as shipped, over in-memory stores on a fixed day (MM-237):
 * the screens in a story are the app's own, reached the way the app reaches
 * them, with nothing of the device or the network underneath.
 */
export function StoryApp({ palette, scenario = demoScenario, device, terms = 'agreed', open }: StoryAppProps) {
  const [services, setServices] = useState<AppServices>();
  useEffect(() => {
    let current = true;
    void (async () => {
      const repos = new InMemoryRepositories();
      await scenario(repos, storyToday);
      if (palette !== undefined) await repos.preferences.saveThemePreference(palette);
      if (terms !== 'unanswered') {
        // An earlier agreement is to a version before this one, a month ago.
        const earlier = terms === 'earlier';
        await repos.preferences.saveTermsAcceptance(
          new TermsAcceptance({
            version: termsOfUse.version - (earlier ? 1 : 0),
            acceptedOn: storyToday.addDays(earlier ? -30 : 0),
          }),
        );
      }
      const catalog = await fixtureCatalog();
      const services = { ...fixtureServices(repos, new FixedClock(storyToday)), catalog: constant(catalog) };
      const brought = device === undefined ? services : await device(services);
      if (current) setServices(brought);
    })();
    return () => {
      current = false;
    };
  }, [scenario, device, palette, terms]);
  if (services === undefined) return null;
  return <App services={services}>{open === undefined ? null : <StoryOpener open={open} />}</App>;
}
