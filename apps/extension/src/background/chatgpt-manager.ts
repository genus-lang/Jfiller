import { ExtensionMessage} from '../messaging/message-types';
import { ProfileService } from '../profile/profile-service';

export class ChatGPTManager {
  private static activeQuestion: string | null = null;
  private static activeJobTabId: number | null = null;

  public static init() {
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
      
      if (message.type === 'ASK_CHATGPT') {
        this.activeQuestion = message.payload.question;
        this.activeJobTabId = message.payload.jobTabId || null;
        this.openOrFocusChatGPT(this.activeQuestion!, message.payload.resumeFile);
        sendResponse({ success: true });
        return false;
      }

      if (message.type === 'CHATGPT_ANSWER_READY') {
        const answer = message.payload.answer;
        console.log('Received Answer from ChatGPT:', answer);
        
        // Check if the answer contains a JSON payload (used for Resume Parsing)
        const jsonMatch = answer.match(/```json\n([\s\S]*?)\n```/) || answer.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
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
            } else if (parsedData.jobfill_custom_answers) {
              console.log('Parsed Custom Fields Answers, beaming back to job tab...');
              if (this.activeJobTabId) {
                chrome.tabs.sendMessage(this.activeJobTabId, {
                  type: 'AUTOFILL_CUSTOM_FIELDS',
                  payload: { customData: parsedData.jobfill_custom_answers }
                });
              }
            }
          } catch (e) {
            console.error('Failed to parse ChatGPT JSON response:', e);
          }
        }

        // Clean up
        this.activeQuestion = null;
        this.activeJobTabId = null;
        sendResponse({ success: true });
        return false;
      }
    });
  }

  private static openOrFocusChatGPT(prompt: string, resumeFile?: any) {
    chrome.tabs.query({ url: "https://chatgpt.com/*" }, (tabs) => {
      if (tabs && tabs.length > 0) {
        // Found an existing ChatGPT tab — use it but NEVER focus or switch to it
        const tab = tabs[0];
        
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id!, {
            type: 'PASTE_PROMPT_IN_CHATGPT',
            payload: { prompt, resumeFile }
          });
        }, 300);

      } else {
        // No ChatGPT tab — create one HIDDEN in the background
        this.createHiddenBackgroundTab(prompt, resumeFile);
      }
    });
  }

  private static createHiddenBackgroundTab(prompt: string, resumeFile?: any) {
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
                payload: { prompt, resumeFile }
              });
            }, 2000);
          }
        });
      });
    });
  }
}
