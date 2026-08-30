import { DetectedField, FieldOption } from '../../types/field';
import { SiteAdapter } from '../adapters/adapter.interface';
import { QuestionParser } from './question-parser';

export class DomParser {
  /**
   * Normalizes a raw HTMLElement into a DetectedField.
   */
  public static parseField(adapter: SiteAdapter, element: HTMLElement): DetectedField {
    const rawLabel = adapter.extractLabel(element);
    // Further parse the raw label to handle complexities
    const label = QuestionParser.cleanLabel(rawLabel);
    
    const type = adapter.detectType(element);
    const required = element.hasAttribute('required') || element.getAttribute('aria-required') === 'true';

    const id = element.id || `field_${Math.random().toString(36).substr(2, 9)}`;

    let options: FieldOption[] | undefined;
    if (type === 'select' && element.tagName.toLowerCase() === 'select') {
      const selectEl = element as HTMLSelectElement;
      options = Array.from(selectEl.options).map(opt => ({
        value: opt.value,
        label: opt.text
      }));
    }

    return {
      id,
      element,
      type,
      label,
      placeholder: element.getAttribute('placeholder') || undefined,
      name: element.getAttribute('name') || undefined,
      ariaLabel: element.getAttribute('aria-label') || undefined,
      options,
      required,
    };
  }
}
