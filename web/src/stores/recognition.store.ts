/**
 * @fileoverview Recognition State Management store.
 * Manages raw gesture coordinates, recognized letters/words, sentence contexts, and confidence levels.
 */
import { create } from "zustand";
import { ContextService } from "../services/context/context.service";
import { VoiceService } from "../services/voice/voice.service";
import { useSettingsStore } from "./settings.store";

interface RecognitionState {
  detectedWord: string;
  wordBuilderList: string[];
  refinedSentence: string;
  confidence: number;
  isProcessing: boolean;
  setDetectedWord: (word: string) => void;
  setWordBuilderList: (list: string[]) => void;
  setRefinedSentence: (sentence: string) => void;
  setConfidence: (val: number) => void;
  setProcessing: (status: boolean) => void;
  resetSession: () => void;
  addWordToBuilder: (word: string) => Promise<void>;
}

export const useRecognitionStore = create<RecognitionState>((set, get) => ({
  detectedWord: "",
  wordBuilderList: [],
  refinedSentence: "",
  confidence: 1.0,
  isProcessing: false,
  setDetectedWord: (word) => set({ detectedWord: word }),
  setWordBuilderList: (list) => set({ wordBuilderList: list }),
  setRefinedSentence: (sentence) => set({ refinedSentence: sentence }),
  setConfidence: (val) => set({ confidence: val }),
  setProcessing: (status) => set({ isProcessing: status }),
  resetSession: () => set({ detectedWord: "", wordBuilderList: [], refinedSentence: "", confidence: 1.0 }),
  addWordToBuilder: async (word: string) => {
    const state = get();
    // Prevent duplicate consecutive words unless intended
    const lastWord = state.wordBuilderList[state.wordBuilderList.length - 1];
    if (word === lastWord) return;

    const newList = [...state.wordBuilderList, word];
    set({ wordBuilderList: newList });

    // Try to enrich sentence context
    if (newList.length >= 2) {
      set({ isProcessing: true });
      const refined = await ContextService.enrichSentence(newList);
      set({ refinedSentence: refined, isProcessing: false });

      // Speak if settings allow (we can get settings from the store)
      const settings = useSettingsStore.getState().accessibility;
      VoiceService.speak(refined, settings.voiceVolume, settings.speechRate);
    } else {
      set({ refinedSentence: word });
      const settings = useSettingsStore.getState().accessibility;
      VoiceService.speak(word, settings.voiceVolume, settings.speechRate);
    }
  },
}));
