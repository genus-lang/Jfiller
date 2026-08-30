import { ProfileField } from '../../types/profile';

export type MappingSource = 'exact' | 'keyword' | 'semantic' | 'chatgpt' | 'user';

export interface FieldMapping {
  fieldId: string;
  label: string;
  profileField?: ProfileField;
  confidence: number;
  source: MappingSource;
  requiresConfirmation: boolean;
}

export class ConfidenceEngine {
  /**
   * Determines if a mapping is confident enough to autofill,
   * or if it requires user confirmation based on thresholds.
   */
  public static evaluateMapping(
    fieldId: string,
    label: string,
    profileField: ProfileField,
    confidence: number,
    source: MappingSource
  ): FieldMapping {
    const HIGH_CONFIDENCE_THRESHOLD = 0.85;

    // Certain fields inherently need confirmation even with high confidence
    const sensitiveFields: ProfileField[] = ['experience', 'resume', 'skills'];
    const isSensitive = sensitiveFields.includes(profileField);

    const requiresConfirmation = isSensitive || confidence < HIGH_CONFIDENCE_THRESHOLD;

    return {
      fieldId,
      label,
      profileField,
      confidence,
      source,
      requiresConfirmation
    };
  }
}
