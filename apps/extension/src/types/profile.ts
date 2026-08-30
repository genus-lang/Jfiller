export type ProfileField =
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'state'
  | 'country'
  | 'linkedin'
  | 'github'
  | 'portfolio'
  | 'college'
  | 'degree'
  | 'major'
  | 'cgpa'
  | 'graduationYear'
  | 'skills'
  | 'experience'
  | 'resume'
  | 'photo'
  | 'unknown';

export interface Education {
  id: string;
  college: string;
  degree: string;
  major: string;
  cgpa?: string;
  startDate?: string;
  endDate?: string;
  graduationYear?: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  technologies: string[];
}

export interface ResumeFile {
  id: string;
  name: string;
  type: string;
  base64: string;
  uploadDate: number;
}

export interface MasterProfile {
  personal: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
    location: {
      address: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
    links: {
      linkedin: string;
      github: string;
      portfolio: string;
    };
  };
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: string[];
  resumeText?: string;
  profilePhoto?: ResumeFile;
  resumeFile?: ResumeFile;
  savedResumes?: ResumeFile[];
}

export interface SavedAnswer {
  id: string;
  question: string;
  answer: string;
  category: 'personal' | 'education' | 'experience' | 'behavioral' | 'job-specific' | 'eligibility';
  tags: string[];
  createdAt: number;
  updatedAt: number;
}
