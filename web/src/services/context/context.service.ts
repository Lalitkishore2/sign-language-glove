/**
 * @fileoverview Service for analyzing recognized glosses and invoking Gemini enrichment.
 */
import { geminiApi } from "../../api/gemini.api";

export class ContextService {
  /**
   * Builds a cohesive sentence from a list of disjoint glosses using Gemini.
   */
  static async enrichSentence(glosses: string[]): Promise<string> {
    if (!glosses || glosses.length === 0) return "";
    
    // Fallback if only 1 word, just return it instead of wasting an API call
    if (glosses.length === 1) return glosses[0];

    try {
      const response = await geminiApi.fetchSentenceRefinement(glosses);
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract text from Gemini response structure
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return text.trim();
    } catch (error) {
      console.error("Context enrichment failed:", error);
      // Graceful fallback: join words if Gemini fails
      return glosses.join(" ");
    }
  }
}
