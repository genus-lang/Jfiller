import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MasterProfile } from '../../types/profile';
import { ExtensionMessage, GetProfileResponse } from '../../messaging/message-types';
import { Input } from '../components/ui/Input';

export const SettingsView: React.FC = () => {
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_PROFILE' } as ExtensionMessage, (response: GetProfileResponse) => {
      if (!chrome.runtime.lastError && response?.profile) {
        setProfile(response.profile);
        setCustomAnswers(response.profile.customAnswers || {});
      }
    });
  }, []);

  const saveCustomAnswers = (newAnswers: Record<string, string>) => {
    if (!profile) return;
    const updatedProfile = { ...profile, customAnswers: newAnswers };
    setProfile(updatedProfile);
    setCustomAnswers(newAnswers);
    chrome.runtime.sendMessage({ type: 'SAVE_PROFILE', payload: { profile: updatedProfile } } as ExtensionMessage);
  };

  const handleDeleteAnswer = (key: string) => {
    const updated = { ...customAnswers };
    delete updated[key];
    saveCustomAnswers(updated);
  };

  const handleAddAnswer = () => {
    if (newKey.trim() && newVal.trim()) {
      const normalizedKey = newKey.trim().replace(/:$/, '');
      const updated = { ...customAnswers, [normalizedKey]: newVal };
      saveCustomAnswers(updated);
      setNewKey('');
      setNewVal('');
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      chrome.storage.local.clear(() => {
        setProfile(null);
        setCustomAnswers({});
        alert('All data cleared.');
      });
    }
  };

  const Toggle = ({ label, defaultChecked = false }: { label: string, defaultChecked?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} style={{ accentColor: 'var(--primary-accent)', transform: 'scale(1.2)' }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Settings</h2>

      <Card className="mb-4" padding="20px">
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--secondary-accent)' }}>Learned Custom Answers</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          These are answers that the AI automatically learned from previous forms. They will be used to autofill future forms instantly without querying ChatGPT.
        </p>
        
        {Object.entries(customAnswers).length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '16px' }}>No custom answers learned yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {Object.entries(customAnswers).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{key}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{val}</div>
                </div>
                <button 
                  onClick={() => handleDeleteAnswer(key)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  title="Delete this learned answer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          <Input label="New Question / Field Name" value={newKey} onChange={e => setNewKey(e.target.value)} />
          <Input label="Your Answer" value={newVal} onChange={e => setNewVal(e.target.value)} />
          <Button variant="secondary" onClick={handleAddAnswer} disabled={!newKey.trim() || !newVal.trim()}>
            Add Custom Answer
          </Button>
        </div>
      </Card>

      <Card className="mb-4" padding="20px">
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--secondary-accent)' }}>Automation</h3>
        <Toggle label="Auto-detect forms on page load" defaultChecked={true} />
        <Toggle label="Require confirmation before filling" defaultChecked={false} />
      </Card>

      <Button variant="outline" fullWidth style={{ marginTop: '24px', borderColor: '#ef4444', color: '#ef4444' }} onClick={handleClearAll}>
        Clear All Data
      </Button>
    </div>
  );
};
