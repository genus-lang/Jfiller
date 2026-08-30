import { ProfileField } from '../../types/profile';

export class KeywordMatcher {
  private static dictionary: Record<ProfileField, string[]> = {
    firstName: ['first name', 'given name', 'fname'],
    lastName: ['last name', 'family name', 'surname', 'lname'],
    fullName: ['full name', 'name'],
    email: ['email', 'e-mail', 'email address'],
    phone: ['phone', 'mobile', 'cell', 'telephone', 'contact number', 'phone number'],
    address: ['address', 'street address', 'line 1'],
    city: ['city', 'town'],
    state: ['state', 'province', 'region'],
    country: ['country', 'nation'],
    linkedin: ['linkedin', 'linked in', 'linkedin url', 'linkedin profile'],
    github: ['github', 'git hub', 'github url', 'github profile'],
    portfolio: ['portfolio', 'website', 'personal website'],
    college: ['college', 'university', 'school', 'institution'],
    degree: ['degree', 'qualification'],
    major: ['major', 'field of study'],
    cgpa: ['cgpa', 'gpa', 'grade'],
    graduationYear: ['graduation year', 'grad year', 'class of'],
    skills: ['skills', 'technologies', 'tools'],
    experience: ['experience', 'work history'],
    resume: ['resume', 'cv', 'curriculum vitae'],
    unknown: []
  };

  /**
   * Checks for exact or substring keyword matches.
   * Returns a tuple of [ProfileField, confidence].
   */
  public static match(label: string): [ProfileField | undefined, number] {
    const normalizedLabel = label.toLowerCase();
    let bestMatch: ProfileField | undefined = undefined;
    let highestScore = 0;

    for (const [field, keywords] of Object.entries(this.dictionary)) {
      for (const keyword of keywords) {
        if (normalizedLabel === keyword) {
          // Exact match
          return [field as ProfileField, 1.0];
        } else if (normalizedLabel.includes(keyword)) {
          // Substring match
          const score = 0.8;
          if (score > highestScore) {
            highestScore = score;
            bestMatch = field as ProfileField;
          }
        }
      }
    }

    return [bestMatch, highestScore];
  }
}
