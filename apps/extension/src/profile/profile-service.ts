import { MasterProfile } from '../types/profile';
import { storage } from '../storage/chrome-storage';

const PROFILE_KEY = 'jobfill_master_profile';

export class ProfileService {
  /**
   * Retrieves the user's master profile from local storage.
   */
  public static async getProfile(): Promise<MasterProfile | null> {
    return await storage.get<MasterProfile>(PROFILE_KEY);
  }

  /**
   * Saves the user's master profile to local storage.
   */
  public static async saveProfile(profile: MasterProfile): Promise<void> {
    await storage.set(PROFILE_KEY, profile);
  }

  /**
   * Generates a blank, empty MasterProfile structure.
   */
  public static getEmptyProfile(): MasterProfile {
    return {
      personal: {
        firstName: '',
        lastName: '',
        fullName: '',
        email: '',
        phone: '',
        location: { address: '', city: '', state: '', country: '', zipCode: '' },
        links: { linkedin: '', github: '', portfolio: '' }
      },
      education: [],
      experience: [],
      projects: [],
      skills: []
    };
  }
}
