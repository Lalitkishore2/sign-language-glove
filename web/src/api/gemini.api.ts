/**
 * @fileoverview Safe API endpoints layer to communicate with Google Gemini models.
 */
import { ENV } from "../config/env";

export const geminiApi = {
  /**
   * Request syntax structures correction from model endpoint.
   */
  async fetchSentenceRefinement(rawWords: string[]): Promise<Response> {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    return await fetch(`${url}?key=${ENV.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an Indian Sign Language (ISL) translator. 
Given the following sequence of glosses recognized from ISL, construct a grammatically correct natural English sentence. 
Do not add extra conversational filler. Return only the corrected sentence.

Glosses: ${rawWords.join(", ")}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100,
        },
      }),
    });
  },

  /**
   * Explains a sign vocabulary contextually.
   */
  async fetchExplanation(word: string): Promise<Response> {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    return await fetch(`${url}?key=${ENV.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Provide a dictionary-style explanation for the sign language word: "${word}".
Format the response as JSON with the following structure:
{
  "definition": "Clear concise meaning",
  "synonyms": ["word1", "word2"],
  "examples": ["Usage example 1", "Usage example 2"]
}
Do not include markdown codeblocks (\`\`\`json) in the response, return raw JSON.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });
  },
};
