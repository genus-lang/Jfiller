import { SiteAdapter } from './adapter.interface';
import { FieldType } from '../../types/field';
import { FormDetector } from '../detector/form-detector';
import { FieldDetector } from '../detector/field-detector';
import { LabelExtractor } from '../detector/label-extractor';
import { FieldTypeDetector } from '../detector/field-type-detector';

export class GenericAdapter implements SiteAdapter {
  name = 'Generic Adapter';

  canHandle(_url: string, _document: Document): boolean {
    return true; // Fallback handles everything
  }

  detectForms(): HTMLElement[] {
    return FormDetector.detectForms();
  }

  detectFields(container: HTMLElement): HTMLElement[] {
    return FieldDetector.detectFields(container);
  }

  extractLabel(element: HTMLElement): string {
    return LabelExtractor.extractLabel(element);
  }

  detectType(element: HTMLElement): FieldType {
    return FieldTypeDetector.detectType(element);
  }
}
