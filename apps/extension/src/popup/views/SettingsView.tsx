import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const SettingsView: React.FC = () => {
  const Toggle = ({ label, defaultChecked = false }: { label: string, defaultChecked?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} style={{ accentColor: 'var(--primary-accent)', transform: 'scale(1.2)' }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Settings</h2>

      <Card className="mb-4" padding="20px">
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--secondary-accent)' }}>Automation</h3>
        <Toggle label="Auto-detect forms on page load" defaultChecked={true} />
        <Toggle label="Require confirmation before filling" defaultChecked={false} />
      </Card>

      <Card padding="20px">
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--secondary-accent)' }}>Preferences</h3>
        <Toggle label="Requires Sponsorship" defaultChecked={false} />
        <Toggle label="Willing to Relocate" defaultChecked={true} />
      </Card>

      <Button variant="outline" fullWidth style={{ marginTop: '24px', borderColor: '#ef4444', color: '#ef4444' }}>
        Clear All Data
      </Button>
    </div>
  );
};
