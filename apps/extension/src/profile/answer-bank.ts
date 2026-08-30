import { SavedAnswer } from '../types/profile';
import { storage } from '../storage/chrome-storage';

const ANSWER_BANK_KEY = 'jobfill_answer_bank';

export class AnswerBank {
  /**
   * Retrieves all saved answers.
   */
  public static async getAnswers(): Promise<SavedAnswer[]> {
    const answers = await storage.get<SavedAnswer[]>(ANSWER_BANK_KEY);
    return answers || [];
  }

  /**
   * Saves a new answer or updates an existing one by ID.
   */
  public static async saveAnswer(answer: SavedAnswer): Promise<void> {
    const answers = await this.getAnswers();
    const existingIndex = answers.findIndex(a => a.id === answer.id);

    if (existingIndex >= 0) {
      answers[existingIndex] = { ...answer, updatedAt: Date.now() };
    } else {
      answers.push({ ...answer, createdAt: Date.now(), updatedAt: Date.now() });
    }

    await storage.set(ANSWER_BANK_KEY, answers);
  }

  /**
   * Deletes a saved answer by ID.
   */
  public static async deleteAnswer(id: string): Promise<void> {
    const answers = await this.getAnswers();
    const filtered = answers.filter(a => a.id !== id);
    await storage.set(ANSWER_BANK_KEY, filtered);
  }
}
