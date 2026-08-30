import React, { useState, useEffect } from 'react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MasterProfile } from '../../types/profile';
import { ExtensionMessage, GetProfileResponse, SaveProfilePayload } from '../../messaging/message-types';

export const ProfileView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'experience'>('personal');
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const migrateProfile = (p: MasterProfile) => {
      if (p && p.resumeFile && (!p.savedResumes || p.savedResumes.length === 0)) {
        if (!p.resumeFile.id) p.resumeFile.id = 'legacy-' + Date.now();
        if (!p.resumeFile.uploadDate) p.resumeFile.uploadDate = Date.now();
        p.savedResumes = [p.resumeFile as any];
      }
      return p;
    };

    // Load profile from background script on mount
    const fetchProfile = () => {
      chrome.runtime.sendMessage({ type: 'GET_PROFILE' } as ExtensionMessage, (response: GetProfileResponse) => {
        if (!chrome.runtime.lastError && response?.profile) {
          setProfile(migrateProfile(response.profile));
        }
      });
    };
    fetchProfile();

    // Listen for background updates (e.g., ChatGPT extracted the resume and saved it)
    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes['applyai_profile']) {
        setProfile(migrateProfile(changes['applyai_profile'].newValue));
      }
    };
    chrome.storage.local.onChanged.addListener(storageListener);
    
    return () => chrome.storage.local.onChanged.removeListener(storageListener);
  }, []);

  const persistProfile = (updatedProfile: MasterProfile) => {
    const payload: SaveProfilePayload = { profile: updatedProfile };
    setSaveStatus('saving');
    chrome.runtime.sendMessage({ type: 'SAVE_PROFILE', payload } as ExtensionMessage, (response) => {
      if (!chrome.runtime.lastError && response?.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    });
  };

  const handleSave = () => {
    if (!profile) return;
    persistProfile(profile);
  };

  const handleResumeUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const resumeFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type || 'application/pdf',
        base64,
        uploadDate: Date.now()
      };

      setProfile(prev => {
        if (!prev) return prev;
        const savedResumes = [...(prev.savedResumes || []), resumeFile];
        const updated = { 
          ...prev, 
          savedResumes,
          resumeFile: prev.resumeFile || resumeFile 
        };
        persistProfile(updated as any);
        return updated as any;
      });
      setIsImporting(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteResume = (id: string) => {
    if (!profile) return;
    const savedResumes = (profile.savedResumes || []).filter(r => r.id !== id);
    const isDeletingActive = profile.resumeFile?.id === id;
    
    const updated = { 
      ...profile, 
      savedResumes,
      resumeFile: isDeletingActive ? savedResumes[0] : profile.resumeFile
    };
    setProfile(updated as any);
    persistProfile(updated as any);
  };

  const handleSetActiveResume = (resume: any) => {
    if (!profile) return;
    const updated = { ...profile, resumeFile: resume };
    setProfile(updated);
    persistProfile(updated);
  };

  const handleImport = () => {
    if (!profile?.resumeFile) return;
    
    const schema = `{
      "personal": { "firstName": "string", "lastName": "string", "email": "string", "phone": "string" },
      "experience": [{ "role": "string", "company": "string", "startDate": "string (YYYY-MM)", "endDate": "string (YYYY-MM)" }]
    }`;
    
    const prompt = `Extract the attached resume file into a strict JSON object matching this exact schema: ${schema}. Output ONLY valid JSON inside a \`\`\`json block.`;

    chrome.runtime.sendMessage({
      type: 'ASK_CHATGPT',
      payload: { 
        question: prompt,
        resumeFile: profile.resumeFile
      }
    } as ExtensionMessage);
  };

  const handlePersonalChange = (field: keyof MasterProfile['personal'], value: string) => {
    setProfile(prev => prev ? {
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    } : prev);
  };

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const profilePhoto = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type || 'image/jpeg',
        base64,
        uploadDate: Date.now()
      };

      setProfile(prev => {
        if (!prev) return prev;
        const updated = { ...prev, profilePhoto };
        persistProfile(updated as any);
        return updated as any;
      });
    };
    reader.readAsDataURL(file);
  };

  const tabStyle = (isActive: boolean) => ({
    padding: '8px 16px',
    cursor: 'pointer',
    borderBottom: isActive ? '2px solid var(--primary-accent)' : '2px solid transparent',
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontWeight: isActive ? 600 : 400,
    transition: 'all 0.2s ease',
    fontSize: '14px'
  });

  if (!profile) return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading profile...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '20px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Master Profile</h2>
        <Button variant="outline" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => setIsImporting(!isImporting)}>
          {isImporting ? 'Cancel' : 'Upload Resume'}
        </Button>
      </div>

      {!isImporting && profile.savedResumes && profile.savedResumes.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Saved Resumes</h3>
          {profile.savedResumes.map(resume => {
            const isActive = profile.resumeFile?.id === resume.id;
            return (
              <Card key={resume.id} className="animate-fade-in" padding="12px" style={{ marginBottom: '8px', borderColor: isActive ? 'rgba(99,102,241,0.6)' : 'var(--border-light)', background: isActive ? 'rgba(99,102,241,0.05)' : 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: isActive ? 'var(--primary-accent)' : 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>
                      {isActive ? '✓ Active Resume' : new Date(resume.uploadDate || Date.now()).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: isActive ? 600 : 400 }}>
                      {resume.name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!isActive && (
                      <Button
                        variant="outline"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => handleSetActiveResume(resume)}
                      >
                        Set Active
                      </Button>
                    )}
                    {isActive && (
                      <Button
                        variant="outline"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={handleImport}
                        title="Extract profile data from this resume"
                      >
                        Extract Profile
                      </Button>
                    )}
                    <button
                      onClick={() => handleDeleteResume(resume.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(239,68,68,0.5)',
                        color: '#ef4444',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {isImporting && (
        <div style={{ marginBottom: '16px' }}>
          <Card className="animate-fade-in" padding="16px">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Upload Resume (PDF/DOCX)</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Your resume will be saved automatically. You can switch between resumes at any time.
            </p>
            <div style={{ marginBottom: '12px' }}>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx"
                style={{ fontSize: '12px', color: 'var(--text-primary)' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handleResumeUpload(file);
                }}
              />
            </div>
          </Card>
        </div>
      )}
      
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '20px' }}>
        <div style={tabStyle(activeTab === 'personal')} onClick={() => setActiveTab('personal')}>Personal</div>
        <div style={tabStyle(activeTab === 'experience')} onClick={() => setActiveTab('experience')}>Experience</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', paddingBottom: '20px' }}>
        {activeTab === 'personal' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
                  background: 'var(--bg-card)', border: '2px dashed var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }} onClick={() => document.getElementById('photo-upload')?.click()}>
                  {profile.profilePhoto ? (
                    <img src={profile.profilePhoto.base64} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>📷</span>
                  )}
                </div>
                <input 
                  id="photo-upload" 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }} 
                />
              </div>
            </div>

            <Input label="First Name" id="firstName" value={profile.personal.firstName} onChange={e => handlePersonalChange('firstName', e.target.value)} />
            <Input label="Last Name" id="lastName" value={profile.personal.lastName} onChange={e => handlePersonalChange('lastName', e.target.value)} />
            <Input label="Email" id="email" type="email" value={profile.personal.email} onChange={e => handlePersonalChange('email', e.target.value)} />
            <Input label="Phone" id="phone" type="tel" value={profile.personal.phone} onChange={e => handlePersonalChange('phone', e.target.value)} />
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="animate-fade-in">
            {profile.experience.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💼</div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Experience Added</h4>
                <p style={{ fontSize: '12px', lineHeight: '1.5' }}>
                  Click "Upload Resume" and then "Extract Profile with ChatGPT" to instantly populate your work history.
                </p>
              </div>
            ) : (
              profile.experience.map(exp => (
                <div key={exp.id} style={{ marginBottom: '12px' }}>
                  <Card className="mb-4" padding="16px">
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{exp.role}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{exp.company}</p>
                    <Button variant="outline" fullWidth>Edit</Button>
                  </Card>
                </div>
              ))
            )}
            <Button variant="secondary" fullWidth style={{ marginTop: '12px' }}>+ Add Experience</Button>
          </div>
        )}
        {/* Save Button now scrolls with content */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button fullWidth onClick={handleSave}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved!' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
};
