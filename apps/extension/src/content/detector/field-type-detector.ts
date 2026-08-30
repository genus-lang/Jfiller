import { FieldType } from '../../types/field';

export class FieldTypeDetector {
  /**
   * Determines the normalized FieldType of an element.
   */
  public static detectType(element: HTMLElement): FieldType {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'textarea') {
      return 'textarea';
    }

    if (tagName === 'select') {
      return 'select';
    }

    if (tagName === 'input') {
      const typeAttr = element.getAttribute('type')?.toLowerCase() || 'text';
      
      switch (typeAttr) {
        case 'email':
          return 'email';
        case 'tel':
          return 'phone';
        case 'radio':
          return 'radio';
        case 'checkbox':
          return 'checkbox';
        case 'date':
          return 'date';
        case 'file':
          return 'file';
        case 'password':
          return 'text'; // We might want to ignore passwords, but typing as text for now
        case 'text':
        default:
          return 'text';
      }
    }

    // ARIA roles fallback
    const role = element.getAttribute('role');
    if (role === 'textbox') return 'text';
    if (role === 'checkbox') return 'checkbox';
    if (role === 'radio') return 'radio';
    if (role === 'combobox' || role === 'listbox') return 'select';

    return 'unknown';
  }
}
