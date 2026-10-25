// src/store/transitionStore.ts
import { create } from 'zustand';

interface TransitionState {
  animateNextTransition: boolean;
  triggerAiNavigationAnimation: () => void;
  consumeAiNavigationAnimation: () => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  animateNextTransition: false,
  triggerAiNavigationAnimation: () => set({ animateNextTransition: true }),
  consumeAiNavigationAnimation: () => set({ animateNextTransition: false }),
}));