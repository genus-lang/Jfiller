import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ScanFormResponse, ExtensionMessage, AutofillFormPayload, GetProfileResponse } from '../../messaging/message-types';

export const DashboardView: React.FC = () => {
  const [fieldCount, setFieldCount] = useState<number>(0);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mappings, setMappings] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  useEffect(() => {
    // When the dashboard loads, scan the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { type: 'SCAN_FORM' } as ExtensionMessage, (response: ScanFormResponse) => {
          if (chrome.runtime.lastError) {
            console.log("Could not scan page:", chrome.runtime.lastError.message);
            setIsLoading(false);
            return;
          }

          if (response && response.fields) {
            setFieldCount(response.fields.length);
            setMappings(response.mappings || []);
            setActiveTabId(activeTab.id || null);
            
            // Calculate a rough match score based on mapped fields
            const mappedFields = response.mappings.filter(m => !m.requiresConfirmation).length;
            const score = response.fields.length > 0 ? Math.round((mappedFields / response.fields.length) * 100) : 0;
            setMatchScore(score);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const handleAutofill = () => {
    // Get profile from background, then send to content script
    chrome.runtime.sendMessage({ type: 'GET_PROFILE' } as ExtensionMessage, (response: GetProfileResponse) => {
      if (chrome.runtime.lastError || !response.profile) return;
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          const payload: AutofillFormPayload = { profile: response.profile };
          chrome.tabs.sendMessage(activeTab.id, { 
            type: 'AUTOFILL_FORM',
            payload 
          } as ExtensionMessage);
        }
      });
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ApplyAI</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Your Job Application Assistant</p>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Form Detected</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isLoading ? 'Scanning page...' : `Found ${fieldCount} actionable fields`}
            </p>
          </div>
          {!isLoading && fieldCount > 0 && (
            <div style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--secondary-accent)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
              {matchScore}% Match
            </div>
          )}
        </div>
        
        <Button fullWidth onClick={handleAutofill} disabled={isLoading || fieldCount === 0} style={{ opacity: (isLoading || fieldCount === 0) ? 0.5 : 1 }}>
          Autofill Form
        </Button>

        {!isLoading && fieldCount > 0 && matchScore < 100 && (
          <Button 
            variant="outline" 
            fullWidth 
            style={{ marginTop: '12px' }}
            onClick={() => {
              chrome.runtime.sendMessage({ type: 'GET_PROFILE' } as ExtensionMessage, (response: GetProfileResponse) => {
                if (chrome.runtime.lastError || !response.profile) return;
                
                const unknownFields = mappings.filter(m => m.requiresConfirmation && m.label);
                const labels = unknownFields.map(m => m.label).join(', ');
                
                const prompt = `I am applying for a job. Based strictly on the attached resume file (or this profile data if no file is attached: ${JSON.stringify(response.profile)}), please provide short, accurate answers to the following form fields: [${labels}]. Return ONLY a valid JSON object wrapped in \`\`\`json blocks where the keys are exactly these question labels and the values are your short string answers. Like this: \`\`\`json\n{"jobfill_custom_answers": {"Field 1": "Answer 1"}}\n\`\`\``;
                
                chrome.runtime.sendMessage({
                  type: 'ASK_CHATGPT',
                  payload: { 
                    question: prompt, 
                    jobTabId: activeTabId,
                    resumeFile: response.profile.resumeFile
                  }
                } as ExtensionMessage);
              });
            }}
          >
            Auto-Resolve Unknowns with AI
          </Button>
        )}
      </Card>
    </div>
  );
};
