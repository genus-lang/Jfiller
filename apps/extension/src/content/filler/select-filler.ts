import { EventDispatcher } from './event-dispatcher';

export class SelectFiller {
  public static fill(element: HTMLElement, value: string): boolean {
    if (element instanceof HTMLSelectElement) {
      // Find the option that matches the value (or label)
      const options = Array.from(element.options);
      
      const exactMatch = options.find(opt => opt.value === value || opt.text === value);
      const partialMatch = options.find(opt => opt.value.toLowerCase().includes(value.toLowerCase()) || 
                                               opt.text.toLowerCase().includes(value.toLowerCase()));
      
      const match = exactMatch || partialMatch;

      if (match) {
        element.value = match.value;
        EventDispatcher.dispatchEvents(element, ['focus', 'change', 'blur']);
        return true;
      }
    }
    
    // Handling custom ARIA dropdowns (combobox/listbox) is complex and often 
    // requires simulating clicks on list items. This will be expanded in later phases.
    return false;
  }
}
