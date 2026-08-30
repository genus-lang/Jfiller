export class FormDetector {
  /**
   * Finds all form elements or likely form containers on the page.
   */
  public static detectForms(): HTMLElement[] {
    const forms = Array.from(document.querySelectorAll('form'));
    
    // Some SPAs (like Workday) might not use <form> tags, so we might
    // need to look for containers with multiple inputs if no <form> is found.
    if (forms.length === 0) {
      // Basic heuristic: find divs that contain multiple inputs
      const allInputs = document.querySelectorAll('input, select, textarea');
      if (allInputs.length > 2) {
        // Just return the body or a common ancestor as a fallback "form"
        return [document.body];
      }
    }
    
    return forms as HTMLElement[];
  }
}
