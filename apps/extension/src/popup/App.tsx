import React, { useState, useEffect } from 'react';
import { DashboardView } from './views/DashboardView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';
import './styles/global.css';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('jobfill_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jobfill_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const navItemStyle = (isActive: boolean) => ({
    flex: 1,
    textAlign: 'center' as const,
    padding: '12px 0',
    cursor: 'pointer',
    color: isActive ? 'var(--primary-accent)' : 'var(--text-secondary)',
    fontWeight: isActive ? 600 : 500,
    fontSize: '13px',
    borderTop: isActive ? '2px solid var(--primary-accent)' : '2px solid transparent',
    background: isActive ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', transition: 'background-color 0.3s ease' }}>
      
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '6px', 
            background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
            marginRight: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '14px'
          }}>
            A
          </div>
          <span style={{ fontWeight: 600, fontSize: '16px', letterSpacing: '0.02em' }}>ApplyAI</span>
        </div>
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'profile' && <ProfileView />}
        {currentView === 'settings' && <SettingsView />}
      </div>

      {/* Bottom Navigation */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)', background: 'var(--bg-card)' }}>
        <div style={navItemStyle(currentView === 'dashboard')} onClick={() => setCurrentView('dashboard')}>
          Dashboard
        </div>
        <div style={navItemStyle(currentView === 'profile')} onClick={() => setCurrentView('profile')}>
          Profile
        </div>
        <div style={navItemStyle(currentView === 'settings')} onClick={() => setCurrentView('settings')}>
          Settings
        </div>
      </div>

    </div>
  );
};

export default App;
