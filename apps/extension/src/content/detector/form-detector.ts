export class FormDetector {
  /**
   * Finds all form elements or likely form containers on the page.
   */
  public static detectForms(): HTMLElement[] {
    const forms = Array.from(document.querySelectorAll('form'));
    
    // Some SPAs (like Workday or Google Forms) might not use <form> tags, so we might
    // need to look for containers with actionable inputs if no <form> is found.
    if (forms.length === 0) {
      // Basic heuristic: find if there are any inputs or ARIA input roles
      const selectors = [
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
        'select',
        'textarea',
        '[role="textbox"]',
        '[role="combobox"]',
        '[role="listbox"]',
        '[role="checkbox"]',
        '[role="radio"]',
        '[contenteditable="true"]'
      ];
      const allInputs = document.querySelectorAll(selectors.join(', '));
      if (allInputs.length > 0) {
        // Just return the body as a fallback "form"
        return [document.body];
      }
    }
    
    return forms as HTMLElement[];
  }
}
