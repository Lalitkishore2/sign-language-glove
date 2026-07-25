/**
 * @fileoverview Learning Studio State Management store.
 * Manages active lessons, daily streak, challenge status, and practice feed data.
 */
import { create } from "zustand";

interface Lesson {
  id: string;
  title: string;
  progress: number;
  completed: boolean;
}

interface LearningState {
  lessons: Lesson[];
  activeLessonId: string | null;
  streakDays: number;
  xpPoints: number;
  setActiveLesson: (id: string | null) => void;
  updateLessonProgress: (id: string, progress: number) => void;
  incrementStreak: () => void;
  addXP: (amount: number) => void;
}

export const useLearningStore = create<LearningState>((set) => ({
  lessons: [
    { id: "1", title: "Introduction & Alphabets", progress: 100, completed: true },
    { id: "2", title: "Common Greetings", progress: 60, completed: false },
    { id: "3", title: "Daily Numbers", progress: 0, completed: false },
    { id: "4", title: "Expression Matching", progress: 0, completed: false },
  ],
  activeLessonId: null,
  streakDays: 4,
  xpPoints: 340,
  setActiveLesson: (id) => set({ activeLessonId: id }),
  updateLessonProgress: (id, progress) =>
    set((state) => ({
      lessons: state.lessons.map((l) =>
        l.id === id ? { ...l, progress, completed: progress >= 100 } : l
      ),
    })),
  incrementStreak: () => set((state) => ({ streakDays: state.streakDays + 1 })),
  addXP: (amount) => set((state) => ({ xpPoints: state.xpPoints + amount })),
}));
