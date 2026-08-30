export class QuestionParser {
  /**
   * Cleans and normalizes the extracted label to better understand the question.
   */
  public static cleanLabel(rawLabel: string): string {
    if (!rawLabel) return '';

    let cleaned = rawLabel.trim();
    
    // Remove trailing colons, asterisks (required indicators)
    cleaned = cleaned.replace(/[:*]+$/, '').trim();

    // Sometimes Workday uses "(Required)" in the label text
    cleaned = cleaned.replace(/\(Required\)/i, '').trim();

    return cleaned;
  }
}
