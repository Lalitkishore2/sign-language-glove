/**
 * @fileoverview Knowledge Workspace State Management store.
 * Holds active translations, definitions, illustrations/images, and synonyms.
 */
import { create } from "zustand";
import { KnowledgeService } from "../services/knowledge/knowledge.service";

interface WordDetails {
  word: string;
  definition: string;
  imageUrl?: string;
  synonyms: string[];
  examples: string[];
}

interface KnowledgeState {
  activeSearchQuery: string;
  selectedWordDetails: WordDetails | null;
  isLoadingDetails: boolean;
  setSearchQuery: (query: string) => void;
  setSelectedWordDetails: (details: WordDetails | null) => void;
  setLoadingDetails: (status: boolean) => void;
  fetchWordDetails: (word: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  activeSearchQuery: "",
  selectedWordDetails: null,
  isLoadingDetails: false,
  setSearchQuery: (query) => set({ activeSearchQuery: query }),
  setSelectedWordDetails: (details) => set({ selectedWordDetails: details }),
  setLoadingDetails: (status) => set({ isLoadingDetails: status }),
  fetchWordDetails: async (word: string) => {
    if (!word) return;
    set({ isLoadingDetails: true, activeSearchQuery: word });
    
    const details = await KnowledgeService.fetchExplanation(word);
    
    set({ 
      selectedWordDetails: details,
      isLoadingDetails: false 
    });
  },
}));
