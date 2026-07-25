/**
 * @fileoverview Service for fetching sign language definitions via Gemini.
 */
import { geminiApi } from "../../api/gemini.api";

export interface WordDetails {
  word: string;
  definition: string;
  synonyms: string[];
  examples: string[];
}

export class KnowledgeService {
  /**
   * Fetches dictionary explanation for a word.
   */
  static async fetchExplanation(word: string): Promise<WordDetails | null> {
    if (!word) return null;

    try {
      const response = await geminiApi.fetchExplanation(word);
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      
      // Parse the JSON structure requested in the prompt
      const parsed = JSON.parse(text);
      
      return {
        word,
        definition: parsed.definition || "No definition found.",
        synonyms: parsed.synonyms || [],
        examples: parsed.examples || [],
      };
    } catch (error) {
      console.error("Knowledge fetch failed:", error);
      return null;
    }
  }
}
