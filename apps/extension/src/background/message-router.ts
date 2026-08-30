import { ExtensionMessage, SaveProfilePayload } from '../messaging/message-types';
import { ProfileService } from '../profile/profile-service';
import { ChatGPTManager } from './chatgpt-manager';

export class MessageRouter {
  public static init() {
    ChatGPTManager.init();
    
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
      console.log('Background received message:', message.type);

      if (message.type === 'GET_PROFILE') {
        ProfileService.getProfile().then(profile => {
          sendResponse({ profile: profile || ProfileService.getEmptyProfile() });
        });
        return true; // Indicates asynchronous response
      }

      if (message.type === 'SAVE_PROFILE') {
        const payload = message.payload as SaveProfilePayload;
        ProfileService.saveProfile(payload.profile).then(() => {
          sendResponse({ success: true });
        });
        return true; // Indicates asynchronous response
      }
      
      // Allow synchronous return for unhandled messages
      return false;
    });
  }
}
