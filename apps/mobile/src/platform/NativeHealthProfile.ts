import { CalendarDate } from '../domain/CalendarDate';
import type { BiologicalSex } from '../domain/BiologicalSex';
import type { HealthProfile } from '../domain/integration/HealthProfile';
import type { HealthProfileReader } from '../domain/integration/HealthProfileReader';
import { HealthReadFailure } from '../healthIngest/HealthReadFailure';
import type { MmHealthProfile } from './MmHealthProfile';
import type { MmHealthProfileApi } from './MmHealthProfileApi';

const whole = (n: number | undefined): n is number => n !== undefined && Number.isInteger(n);

/** The date of birth the parts make, or nothing when they make none. */
function birthDateOf(raw: MmHealthProfile): CalendarDate | undefined {
  if (!whole(raw.birthYear) || !whole(raw.birthMonth) || !whole(raw.birthDay)) return undefined;
  try {
    return CalendarDate.of(raw.birthYear, raw.birthMonth, raw.birthDay);
  } catch {
    return undefined;
  }
}

/**
 * Apple Health's sex, date of birth and height for onboarding (MM-69),
 * over the app's own plugin. Only female and male are a sex the app uses;
 * HealthKit's other and not set fill nothing (MM-14).
 */
export class NativeHealthProfile implements HealthProfileReader {
  readonly offersProfile = true;
  private readonly api: MmHealthProfileApi;

  constructor(api: MmHealthProfileApi) {
    this.api = api;
  }

  async readProfile(): Promise<HealthProfile> {
    let raw: MmHealthProfile;
    try {
      raw = await this.api.profile();
    } catch {
      throw new HealthReadFailure('reading the profile');
    }
    const sex: BiologicalSex | undefined = raw.sex === 'female' || raw.sex === 'male' ? raw.sex : undefined;
    const heightM = raw.heightM;
    return {
      sex,
      birthDate: birthDateOf(raw),
      heightCm: heightM !== undefined && Number.isFinite(heightM) && heightM > 0 ? Math.round(heightM * 1000) / 10 : undefined,
    };
  }
}
