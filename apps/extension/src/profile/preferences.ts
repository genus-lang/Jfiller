import { storage } from '../storage/chrome-storage';

const PREFERENCES_KEY = 'jobfill_preferences';

export interface UserPreferences {
  requiresSponsorship: boolean | null;
  willingToRelocate: boolean | null;
  authorizedToWork: boolean | null;
  veteranStatus: string | null;
  disabilityStatus: string | null;
  gender: string | null;
  race: string | null;
}

export class PreferencesService {
  /**
   * Retrieves the user's demographic and eligibility preferences.
   */
  public static async getPreferences(): Promise<UserPreferences> {
    const prefs = await storage.get<UserPreferences>(PREFERENCES_KEY);
    return prefs || {
      requiresSponsorship: null,
      willingToRelocate: null,
      authorizedToWork: null,
      veteranStatus: null,
      disabilityStatus: null,
      gender: null,
      race: null
    };
  }

  /**
   * Updates user preferences.
   */
  public static async savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const current = await this.getPreferences();
    await storage.set(PREFERENCES_KEY, { ...current, ...preferences });
  }
}
