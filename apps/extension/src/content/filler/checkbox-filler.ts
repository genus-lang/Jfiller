import { EventDispatcher } from './event-dispatcher';

export class CheckboxFiller {
  public static fill(element: HTMLElement, shouldBeChecked: boolean): boolean {
    if (element instanceof HTMLInputElement && element.type === 'checkbox') {
      if (element.checked !== shouldBeChecked) {
        // Many frameworks require a real click event for checkboxes
        element.click();
        
        // Fallback if click didn't change it (e.g., event prevented)
        if (element.checked !== shouldBeChecked) {
          element.checked = shouldBeChecked;
          EventDispatcher.dispatchEvents(element, ['change']);
        }
      }
      return true;
    }
    return false;
  }
}
