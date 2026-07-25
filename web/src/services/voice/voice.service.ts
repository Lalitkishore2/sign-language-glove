/**
 * @fileoverview Web Speech API Text-to-Speech wrapper.
 */

export class VoiceService {
  private static synth = window.speechSynthesis;
  private static voice: SpeechSynthesisVoice | null = null;

  /**
   * Initialize voices.
   */
  static initVoices() {
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => {
        const voices = this.synth.getVoices();
        // Prefer a natural English female voice
        this.voice =
          voices.find((v) => v.name.includes("Google US English")) ||
          voices.find((v) => v.lang === "en-US") ||
          voices[0] ||
          null;
      };
    }
  }

  /**
   * Speak a text string with given volume and rate constraints.
   */
  static speak(text: string, volume: number = 0.8, rate: number = 1.0) {
    if (!this.synth) return;

    if (this.synth.speaking) {
      this.synth.cancel(); // Stop current speech to immediately read new
    }

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.volume = Math.max(0, Math.min(1, volume));
    utterance.rate = Math.max(0.5, Math.min(2, rate));

    this.synth.speak(utterance);
  }

  /**
   * Stop speaking.
   */
  static stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
  }
}

// Pre-init
VoiceService.initVoices();
