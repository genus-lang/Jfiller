export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file'
  | 'unknown';

export interface FieldOption {
  value: string;
  label: string;
}

export interface DetectedField {
  id: string;
  element: HTMLElement;
  type: FieldType;
  label: string;
  placeholder?: string;
  name?: string;
  ariaLabel?: string;
  options?: FieldOption[];
  required: boolean;
  section?: string;
  confidence?: number;
}
