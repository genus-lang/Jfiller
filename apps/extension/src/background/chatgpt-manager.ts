import { ExtensionMessage} from '../messaging/message-types';
import { ProfileService } from '../profile/profile-service';

export class ChatGPTManager {
  public static init() {
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
      
      if (message.type === 'ASK_CHATGPT') {
        chrome.runtime.sendMessage({ type: 'PIPELINE_UPDATE', payload: { state: 'PENDING' } }).catch(() => {});
        this.openOrFocusChatGPT(message.payload.question, message.payload.resumeFile, message.payload.jobTabId);
        sendResponse({ success: true });
        return false;
      }

      if (message.type === 'CHATGPT_ANSWER_READY') {
        const { answer, jobTabId } = message.payload;
        console.log('Received Answer from ChatGPT:', answer);
        
        // Try to extract JSON directly first
        const jsonMatch = answer.match(/```(?:json)?\n([\s\S]*?)\n```/) || answer.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            chrome.runtime.sendMessage({ type: 'PIPELINE_UPDATE', payload: { state: 'ANSWER_PARSED' } }).catch(() => {});
            
            if (parsedData.personal || parsedData.experience) {
              console.log('Parsed Resume Data, saving to Profile...');
              ProfileService.getProfile().then(currentProfile => {
                const updatedProfile = currentProfile || ProfileService.getEmptyProfile();
                if (parsedData.personal) {
                  updatedProfile.personal = { ...updatedProfile.personal, ...parsedData.personal };
                }
                if (parsedData.experience && Array.isArray(parsedData.experience)) {
                  // Generate IDs for new experience blocks
                  const newExp = parsedData.experience.map((e: any) => ({
                    ...e,
                    id: Math.random().toString(36).substring(7)
                  }));
                  updatedProfile.experience = [...updatedProfile.experience, ...newExp];
                }
                ProfileService.saveProfile(updatedProfile);
              });
            } else {
              // It's likely custom fields data!
              const customData = parsedData.jobfill_custom_answers || parsedData;
              console.log('Parsed Custom Fields Answers, beaming back to job tab:', jobTabId, customData);
              if (jobTabId) {
                chrome.tabs.sendMessage(jobTabId, {
                  type: 'AUTOFILL_CUSTOM_FIELDS',
                  payload: { customData }
                }).catch(e => console.log('Job tab closed, cannot autofill', e));
                chrome.runtime.sendMessage({ type: 'PIPELINE_UPDATE', payload: { state: 'FIELD_FILLED' } }).catch(() => {});
                
                // Also bring the job tab back to focus so the user sees the answers fill!
                chrome.tabs.update(jobTabId, { active: true }).catch(() => {});
              }
            }
          } catch (e) {
            console.error('Failed to parse ChatGPT JSON response:', e);
            chrome.runtime.sendMessage({ type: 'PIPELINE_UPDATE', payload: { state: 'ERROR', error: 'Failed to parse JSON' } }).catch(() => {});
          }
        } else {
           chrome.runtime.sendMessage({ type: 'PIPELINE_UPDATE', payload: { state: 'ERROR', error: 'No JSON found in response' } }).catch(() => {});
        }

        // Clean up
        sendResponse({ success: true });
        return false;
      }
    });
  }

  private static openOrFocusChatGPT(prompt: string, resumeFile?: any, jobTabId?: number | null) {
    chrome.tabs.query({ url: "https://chatgpt.com/*" }, (tabs) => {
      if (tabs && tabs.length > 0) {
        // Found an existing ChatGPT tab — use it but NEVER focus or switch to it
        const tab = tabs[0];
        
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id!, {
            type: 'PASTE_PROMPT_IN_CHATGPT',
            payload: { prompt, resumeFile, jobTabId }
          }).catch(e => console.log('ChatGPT tab has no listener or closed.', e));
        }, 300);

      } else {
        // No ChatGPT tab — create one HIDDEN in the background
        this.createHiddenBackgroundTab(prompt, resumeFile, jobTabId);
      }
    });
  }

  private static createHiddenBackgroundTab(prompt: string, resumeFile?: any, jobTabId?: number | null) {
    // Create the tab in background (active: false) and minimized so user never sees it switch
    chrome.windows.getCurrent((currentWindow) => {
      chrome.tabs.create({ 
        url: 'https://chatgpt.com/',
        active: false,           // Don't switch to this tab
        windowId: currentWindow.id  // Keep it in the same window, just hidden
      }, (tab) => {
        if (!tab.id) return;
        
        // Wait for the page to fully load before injecting the prompt
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === tab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            
            // Give React a moment to mount
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id!, {
                type: 'PASTE_PROMPT_IN_CHATGPT',
                payload: { prompt, resumeFile, jobTabId }
              }).catch(e => console.log('Could not message chatgpt tab after creation', e));
            }, 2000);
          }
        });
      });
    });
  }
}
