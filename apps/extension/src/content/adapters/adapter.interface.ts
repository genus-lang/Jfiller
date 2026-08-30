import { FieldType } from '../../types/field';

export interface SiteAdapter {
  /**
   * The name of the adapter.
   */
  name: string;

  /**
   * Detects if the current page is supported by this adapter.
   */
  canHandle(url: string, document: Document): boolean;

  /**
   * Finds all form containers.
   */
  detectForms(): HTMLElement[];

  /**
   * Finds all actionable input fields within a container.
   */
  detectFields(container: HTMLElement): HTMLElement[];

  /**
   * Extracts the label for a specific field.
   */
  extractLabel(element: HTMLElement): string;

  /**
   * Determines the normalized field type.
   */
  detectType(element: HTMLElement): FieldType;
}
