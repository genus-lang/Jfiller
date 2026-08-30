export class LabelExtractor {
  /**
   * Extracts the most likely human-readable label for a given input element.
   */
  public static extractLabel(element: HTMLElement): string {
    // 1. Check for explicit <label for="id">
    if (element.id) {
      const explicitLabel = document.querySelector(`label[for="${element.id}"]`);
      if (explicitLabel && explicitLabel.textContent) {
        return explicitLabel.textContent.trim();
      }
    }

    // 2. Check for implicit <label> wrapping the input
    const implicitLabel = element.closest('label');
    if (implicitLabel && implicitLabel.textContent) {
      return implicitLabel.textContent.replace(element.textContent || '', '').trim();
    }

    // 3. Check for aria-labelledby
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelEl = document.getElementById(ariaLabelledBy);
      if (labelEl && labelEl.textContent) {
        return labelEl.textContent.trim();
      }
    }

    // 4. Check for aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel.trim();
    }

    // 5. Check placeholder
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) {
      return placeholder.trim();
    }

    // 6. Fallback: visual proximity (e.g. previous sibling text)
    // This is a naive implementation; production would do bounding box checks.
    const previousSibling = element.previousElementSibling;
    if (previousSibling && previousSibling.textContent && previousSibling.textContent.length < 100) {
      return previousSibling.textContent.trim();
    }

    return '';
  }
}
