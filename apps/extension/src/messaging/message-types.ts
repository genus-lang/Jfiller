import { MasterProfile } from '../types/profile';
import { FieldMapping } from '../content/mapper/confidence';
import { DetectedField } from '../types/field';

export type MessageType = 
  | 'GET_PROFILE'
  | 'SAVE_PROFILE'
  | 'SCAN_FORM'
  | 'AUTOFILL_FORM'
  | 'AUTOFILL_CUSTOM_FIELDS'
  | 'ASK_CHATGPT'
  | 'CHATGPT_ANSWER_READY'
  | 'PASTE_PROMPT_IN_CHATGPT'
  | 'PIPELINE_UPDATE';

export type PipelineState = 
  | 'PENDING'
  | 'CHATGPT_OPENED'
  | 'PROMPT_SENT'
  | 'ANSWER_RECEIVED'
  | 'ANSWER_PARSED'
  | 'FIELD_FILLED'
  | 'ERROR';

export interface PipelineUpdatePayload {
  state: PipelineState;
  error?: string;
}

export interface ExtensionMessage {
  type: MessageType;
  payload?: any;
}

export interface AskChatGPTPayload {
  question: string;
  jobTabId?: number;
  resumeFile?: {
    name: string;
    type: string;
    base64: string;
  };
}

export interface AutofillCustomFieldsPayload {
  customData: Record<string, string>;
}

export interface GetProfileResponse {
  profile: MasterProfile;
}

export interface SaveProfilePayload {
  profile: MasterProfile;
}

export interface ScanFormResponse {
  fields: DetectedField[];
  mappings: FieldMapping[];
}

export interface AutofillFormPayload {
  profile: MasterProfile;
}
