import { MasterProfile } from '../types/profile';

export class ProfileParser {
  /**
   * Utility to flatten the nested MasterProfile into a simple key-value record
   * so it can be easily accessed by the FormFiller (e.g. `profileData['firstName']`).
   */
  public static flattenProfile(profile: MasterProfile): Record<string, any> {
    const flat: Record<string, any> = {};

    // Flatten personal data
    flat['firstName'] = profile.personal.firstName;
    flat['lastName'] = profile.personal.lastName;
    flat['fullName'] = profile.personal.fullName;
    flat['email'] = profile.personal.email;
    flat['phone'] = profile.personal.phone;
    
    // Flatten location
    flat['address'] = profile.personal.location.address;
    flat['city'] = profile.personal.location.city;
    flat['state'] = profile.personal.location.state;
    flat['country'] = profile.personal.location.country;
    flat['zipCode'] = profile.personal.location.zipCode;

    // Flatten links
    flat['linkedin'] = profile.personal.links.linkedin;
    flat['github'] = profile.personal.links.github;
    flat['portfolio'] = profile.personal.links.portfolio;

    // Note: Arrays like education and experience are harder to flatten for generic filling.
    // In advanced phases, the FormEngine will need to map specific indices (e.g., "College 1").
    // For Phase 4, we just serialize them as strings for fallback.
    
    if (profile.education.length > 0) {
      const ed = profile.education[0];
      flat['college'] = ed.college;
      flat['degree'] = ed.degree;
      flat['major'] = ed.major;
      flat['cgpa'] = ed.cgpa;
      flat['graduationYear'] = ed.graduationYear;
    }

    if (profile.experience.length > 0) {
      flat['experience'] = profile.experience.map(e => `${e.role} at ${e.company}`).join(', ');
    }

    if (profile.skills.length > 0) {
      flat['skills'] = profile.skills.join(', ');
    }

    if (profile.resumeFile) {
      flat['resume'] = profile.resumeFile;
    }

    if (profile.profilePhoto) {
      flat['photo'] = profile.profilePhoto;
    }

    return flat;
  }
}
