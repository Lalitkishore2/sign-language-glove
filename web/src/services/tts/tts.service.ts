/**
 * @fileoverview Text-to-Speech (TTS) engine.
 * Converts translated text and builds vocal output feeds for listeners.
 */

export class TTSService {
  /**
   * Play vocal synthesis of a string using SpeechSynthesis Utterance.
   */
  static speak(text: string, volume = 0.8, rate = 1.0): void {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    // Cancel active speak tasks
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Instantly stops any playing voice output.
   */
  static stop(): void {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}
