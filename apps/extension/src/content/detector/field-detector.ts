export class FieldDetector {
  /**
   * Finds all actionable input fields within a given form or container.
   */
  public static detectFields(container: HTMLElement): HTMLElement[] {
    const selectors = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
      'select',
      'textarea',
      // Include ARIA roles that act as inputs
      '[role="textbox"]',
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="checkbox"]',
      '[role="radio"]'
    ];
    
    const fields = container.querySelectorAll(selectors.join(', '));
    return Array.from(fields) as HTMLElement[];
  }
}
