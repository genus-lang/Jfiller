import { DetectedField } from '../../types/field';
import { SiteAdapter } from '../adapters/adapter.interface';
import { DomParser } from './dom-parser';

export class FormParser {
  /**
   * Scans the document using the provided adapter and returns a list of all normalized fields.
   */
  public static parseAllForms(adapter: SiteAdapter): DetectedField[] {
    const containers = adapter.detectForms();
    let allFields: DetectedField[] = [];

    containers.forEach(container => {
      const rawFields = adapter.detectFields(container);
      const parsedFields = rawFields.map(field => DomParser.parseField(adapter, field));
      allFields = [...allFields, ...parsedFields];
    });

    return allFields;
  }
}
