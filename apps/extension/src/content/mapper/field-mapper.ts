import { DetectedField } from '../../types/field';
import { ConfidenceEngine, FieldMapping } from './confidence';
import { KeywordMatcher } from './keyword-matcher';
import { SemanticMatcher } from './semantic-matcher';

export class FieldMapper {
  /**
   * Maps a parsed DOM field to the best matching ProfileField.
   */
  public static mapField(field: DetectedField): FieldMapping {
    const label = field.label || field.name || '';
    const [keywordMatch, keywordScore] = KeywordMatcher.match(label);
    
    if (keywordMatch && keywordScore >= 0.8) {
      return ConfidenceEngine.evaluateMapping(
        field.id,
        label,
        keywordMatch,
        keywordScore,
        keywordScore === 1.0 ? 'exact' : 'keyword'
      );
    }

    // 2. Try Semantic Matcher (Fallback)
    const [semanticMatch, semanticScore] = SemanticMatcher.match(label);
    
    if (semanticMatch && semanticScore > 0.5) {
      return ConfidenceEngine.evaluateMapping(
        field.id,
        label,
        semanticMatch,
        semanticScore,
        'semantic'
      );
    }

    // 3. Unmapped / ChatGPT Handoff Needed
    return {
      fieldId: field.id,
      label: label,
      profileField: undefined,
      confidence: 0,
      source: 'user',
      requiresConfirmation: true
    };
  }
}
