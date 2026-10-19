import { createContext } from 'react';
import type { SettingsSectionId } from './SettingsSectionId';

/** The section a way into Settings asked to find open (MM-398); none opens by itself. */
export const SettingsOpenSectionContext = createContext<SettingsSectionId | undefined>(undefined);
