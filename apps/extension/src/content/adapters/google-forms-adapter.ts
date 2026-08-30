import { SiteAdapter } from './adapter.interface';
import { FieldType } from '../../types/field';

export class GoogleFormsAdapter implements SiteAdapter {
  name = 'Google Forms Adapter';

  canHandle(url: string, _document: Document): boolean {
    return url.includes('docs.google.com/forms');
  }

  detectForms(): HTMLElement[] {
    const form = document.querySelector('form');
    return form ? [form] : [];
  }

  detectFields(container: HTMLElement): HTMLElement[] {
    // Google forms wraps questions in a specific div role="listitem"
    const items = container.querySelectorAll('div[role="listitem"]');
    const fields: HTMLElement[] = [];

    items.forEach(item => {
      // Find the actual interactive element within the list item
      const input = item.querySelector('input[type="text"], input[type="email"], textarea, div[role="radiogroup"], div[role="listbox"], div[role="checkbox"]');
      if (input) {
        // We attach the listitem to the input so we can extract the label easily later
        (input as any).__googleFormContainer = item;
        fields.push(input as HTMLElement);
      }
    });

    return fields;
  }

  extractLabel(element: HTMLElement): string {
    // The question title is usually in a div with role="heading" inside the container
    const container = (element as any).__googleFormContainer || element.closest('div[role="listitem"]');
    if (container) {
      const heading = container.querySelector('div[role="heading"]');
      if (heading && heading.textContent) {
        return heading.textContent.replace(/\*/g, '').trim(); // Remove the required asterisk
      }
    }
    
    // Fallback to aria-label
    return element.getAttribute('aria-label') || '';
  }

  detectType(element: HTMLElement): FieldType {
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'textarea') return 'textarea';
    if (tagName === 'input') {
      const type = element.getAttribute('type');
      if (type === 'email') return 'email';
      if (type === 'date') return 'date';
      return 'text';
    }

    const role = element.getAttribute('role');
    if (role === 'radiogroup') return 'radio';
    if (role === 'checkbox') return 'checkbox';
    if (role === 'listbox') return 'select';

    return 'unknown';
  }
}
