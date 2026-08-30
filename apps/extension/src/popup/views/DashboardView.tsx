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
  const [pipelineState, setPipelineState] = useState<string | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

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

    const messageListener = (message: any) => {
      if (message.type === 'PIPELINE_UPDATE') {
        setPipelineState(message.payload.state);
        if (message.payload.error) {
          setPipelineError(message.payload.error);
        }
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
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

  const states = ['PENDING', 'CHATGPT_OPENED', 'PROMPT_SENT', 'ANSWER_RECEIVED', 'ANSWER_PARSED', 'FIELD_FILLED'];
  const labels = ['Starting...', 'ChatGPT Opened', 'Prompt Sent', 'Answer Received', 'Answer Parsed', 'Form Filled!'];
  
  const currentStateIndex = pipelineState ? states.indexOf(pipelineState) : -1;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
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
        
        <Button fullWidth onClick={handleAutofill} disabled={isLoading || fieldCount === 0 || pipelineState !== null}>
          Autofill Form
        </Button>

        {!isLoading && fieldCount > 0 && matchScore < 100 && !pipelineState && (
          <Button 
            variant="outline" 
            fullWidth 
            style={{ marginTop: '12px' }}
            onClick={() => {
              chrome.runtime.sendMessage({ type: 'GET_PROFILE' } as ExtensionMessage, (response: GetProfileResponse) => {
                if (chrome.runtime.lastError || !response.profile) return;
                
                if (activeTabId) {
                  chrome.tabs.sendMessage(activeTabId, {
                    type: 'AUTOFILL_FORM',
                    payload: { profile: response.profile }
                  } as ExtensionMessage).catch(console.error);
                }

                // Ask ChatGPT to fill EVERY field on the form based on the resume (except the file uploads)
                const unknownFields = mappings.filter(m => m.label && m.profileField !== 'resume' && m.profileField !== 'photo');
                const unknownLabels = unknownFields.map(m => m.label).join(', ');
                
                const profileWithoutFile = { ...response.profile };
                delete profileWithoutFile.resumeFile;
                
                const prompt = `I am applying for a job. Based strictly on the attached resume file (or this profile data if no file is attached: ${JSON.stringify(profileWithoutFile)}), please provide short, accurate answers to the following form fields: [${unknownLabels}]. For numeric fields, provide only digits (e.g. 0) and NEVER words like 'Not specified'. Return ONLY a valid JSON object wrapped in \`\`\`json blocks where the keys are exactly these question labels and the values are your short string answers. Like this: \`\`\`json\n{"jobfill_custom_answers": {"Field 1": "Answer 1"}}\n\`\`\``;
                
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

      {pipelineState && (
        <Card>
           <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>JobFill Debug Tracker</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {states.map((st, idx) => {
                 let icon = '⏳';
                 let color = 'var(--text-secondary)';
                 if (pipelineState === 'ERROR') {
                    if (idx <= currentStateIndex) { icon = '✅'; color = '#10b981'; } // Previous steps succeeded
                    else if (idx === currentStateIndex + 1 || (currentStateIndex === -1 && idx === 0)) { icon = '❌'; color = '#ef4444'; } // This step failed
                 } else {
                    if (idx < currentStateIndex) { icon = '✅'; color = '#10b981'; }
                    else if (idx === currentStateIndex) { icon = '🔄'; color = '#38bdf8'; }
                 }

                 return (
                   <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color }}>
                      <span>{icon}</span>
                      <span>{labels[idx]}</span>
                   </div>
                 );
              })}
           </div>
           {pipelineError && (
              <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '12px', borderRadius: '4px' }}>
                 {pipelineError}
              </div>
           )}
        </Card>
      )}
    </div>
  );
};
