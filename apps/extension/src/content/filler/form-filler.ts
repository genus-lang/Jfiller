import { FieldMapping } from '../mapper/confidence';
import { TextFiller } from './text-filler';
import { SelectFiller } from './select-filler';
import { CheckboxFiller } from './checkbox-filler';
import { RadioFiller } from './radio-filler';
import { DateFiller } from './date-filler';
import { FileFiller } from './file-filler';

export class FormFiller {
  /**
   * Orchestrates the filling of multiple fields, using a slight delay
   * between each field to simulate human interaction and avoid rate limits.
   */
  public static async fillAll(mappings: FieldMapping[], profileData: Record<string, any>): Promise<void> {
    for (const mapping of mappings) {
      if (mapping.requiresConfirmation) {
        continue;
      }

      const element = document.getElementById(mapping.fieldId);
      if (!element) continue;

      const value = mapping.profileField ? profileData[mapping.profileField] : undefined;
      
      if (value !== undefined) {
        this.fillSingleField(element, value);
        
        // Wait 50ms between fields
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  public static async fillCustomFields(mappings: FieldMapping[], customData: Record<string, string>): Promise<void> {
    for (const [label, answer] of Object.entries(customData)) {
      // Find the mapping whose label exactly matches the key returned by ChatGPT
      const mapping = mappings.find(m => m.label === label);
      if (!mapping) continue;

      const element = document.getElementById(mapping.fieldId);
      if (!element) continue;

      this.fillSingleField(element, answer);
      
      // Wait 50ms between fields
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private static fillSingleField(element: HTMLElement, value: any): boolean {
    const tagName = element.tagName.toLowerCase();
    const type = element.getAttribute('type')?.toLowerCase();

    if (tagName === 'textarea' || (tagName === 'input' && (!type || ['text', 'email', 'tel', 'url'].includes(type)))) {
      return TextFiller.fill(element, String(value));
    }

    if (tagName === 'select') {
      return SelectFiller.fill(element, String(value));
    }

    if (tagName === 'input' && type === 'checkbox') {
      return CheckboxFiller.fill(element, Boolean(value));
    }

    if (tagName === 'input' && type === 'radio') {
      return RadioFiller.fill(element, String(value));
    }

    if (tagName === 'input' && type === 'date') {
      return DateFiller.fill(element, String(value));
    }

    if (tagName === 'input' && type === 'file') {
      return FileFiller.fill(element, value);
    }

    return false;
  }
}
