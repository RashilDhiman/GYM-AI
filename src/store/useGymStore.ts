import { create } from 'zustand';
import type { ExerciseMode } from '../types/gym';

type GymState = {
  exerciseMode: ExerciseMode;
  repCount: number;
  sessionStartMs: number | null;
  elapsedSec: number;
  isSessionRunning: boolean;
  backWarning: boolean;
  dietPlan: string;
  isDietLoading: boolean;
  setExerciseMode: (mode: ExerciseMode) => void;
  setBackWarning: (value: boolean) => void;
  setDietPlan: (value: string) => void;
  setDietLoading: (value: boolean) => void;
  incrementRep: () => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  tickSession: () => void;
  stopSession: () => void;
};

export const useGymStore = create<GymState>((set, get) => ({
  exerciseMode: 'squat',
  repCount: 0,
  sessionStartMs: null,
  elapsedSec: 0,
  isSessionRunning: false,
  backWarning: false,
  dietPlan: '',
  isDietLoading: false,
  setExerciseMode: (exerciseMode) => set({ exerciseMode }),
  setBackWarning: (backWarning) => set({ backWarning }),
  setDietPlan: (dietPlan) => set({ dietPlan }),
  setDietLoading: (isDietLoading) => set({ isDietLoading }),
  incrementRep: () =>
    set((s) => {
      if (!s.isSessionRunning) {
        return s;
      }
      return { repCount: s.repCount + 1 };
    }),
  startSession: () => {
    set({ sessionStartMs: Date.now(), elapsedSec: 0, repCount: 0, isSessionRunning: true });
  },
  pauseSession: () => {
    const state = get();
    if (!state.isSessionRunning || state.sessionStartMs == null) {
      return;
    }
    const elapsedSec = Math.floor((Date.now() - state.sessionStartMs) / 1000);
    set({ elapsedSec, sessionStartMs: null, isSessionRunning: false });
  },
  resumeSession: () => {
    const state = get();
    if (state.isSessionRunning) {
      return;
    }
    set({
      sessionStartMs: Date.now() - state.elapsedSec * 1000,
      isSessionRunning: true,
    });
  },
  tickSession: () => {
    const { sessionStartMs, isSessionRunning } = get();
    if (!isSessionRunning || sessionStartMs == null) {
      return;
    }
    set({ elapsedSec: Math.floor((Date.now() - sessionStartMs) / 1000) });
  },
  stopSession: () =>
    set({
      repCount: 0,
      sessionStartMs: null,
      elapsedSec: 0,
      isSessionRunning: false,
      backWarning: false,
    }),
}));

