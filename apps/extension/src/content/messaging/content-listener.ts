import { ExtensionMessage, AutofillFormPayload, AutofillCustomFieldsPayload } from '../../messaging/message-types';
import { AdapterManager } from '../adapters/adapter-manager';
import { FormParser } from '../parser/form-parser';
import { FieldMapper } from '../mapper/field-mapper';
import { FormFiller } from '../filler/form-filler';
import { ProfileParser } from '../../profile/profile-parser';

export class ContentListener {
  public static init() {
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
      console.log('Content Script received message:', message.type);

      const adapter = AdapterManager.getAdapter();

      if (message.type === 'SCAN_FORM') {
        try {
          const fields = FormParser.parseAllForms(adapter);
          const mappings = fields.map(field => FieldMapper.mapField(field));
          
          sendResponse({ fields, mappings });
        } catch (error) {
          console.error('JobFill Scan Error:', error);
          sendResponse({ fields: [], mappings: [] });
        }
        return false; // Synchronous response
      }

      if (message.type === 'AUTOFILL_FORM') {
        const payload = message.payload as AutofillFormPayload;
        const fields = FormParser.parseAllForms(adapter);
        const mappings = fields.map(field => FieldMapper.mapField(field));
        
        const flatProfile = ProfileParser.flattenProfile(payload.profile);

        FormFiller.fillAll(mappings, flatProfile).then(() => {
          sendResponse({ success: true });
        }).catch(err => {
          console.error('JobFill Autofill Error:', err);
          sendResponse({ success: false });
        });
        
        return true; // Asynchronous response
      }

      if (message.type === 'AUTOFILL_CUSTOM_FIELDS') {
        const payload = message.payload as AutofillCustomFieldsPayload;
        const fields = FormParser.parseAllForms(adapter);
        const mappings = fields.map(field => FieldMapper.mapField(field));
        
        FormFiller.fillCustomFields(mappings, payload.customData).then(() => {
          sendResponse({ success: true });
        }).catch(err => {
          console.error('JobFill Custom Autofill Error:', err);
          sendResponse({ success: false });
        });
        
        return true; // Asynchronous response
      }

      return false;
    });
  }
}
