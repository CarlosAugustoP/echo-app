import { useSyncExternalStore } from "react";

export type TourTargetLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AppTourState = {
  active: boolean;
  stepIndex: number;
  targetLayouts: Record<string, TourTargetLayout>;
};

let state: AppTourState = {
  active: false,
  stepIndex: 0,
  targetLayouts: {},
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function startAppTour() {
  state = {
    ...state,
    active: true,
    stepIndex: 0,
    targetLayouts: {},
  };
  emitChange();
}

export function dismissAppTour() {
  state = {
    ...state,
    active: false,
    stepIndex: 0,
    targetLayouts: {},
  };
  emitChange();
}

export function advanceAppTour() {
  state = {
    ...state,
    stepIndex: state.stepIndex + 1,
  };
  emitChange();
}

export function updateAppTourTargetLayout(targetId: string, layout: TourTargetLayout) {
  state = {
    ...state,
    targetLayouts: {
      ...state.targetLayouts,
      [targetId]: layout,
    },
  };
  emitChange();
}

export function removeAppTourTargetLayout(targetId: string) {
  const nextLayouts = { ...state.targetLayouts };
  delete nextLayouts[targetId];

  state = {
    ...state,
    targetLayouts: nextLayouts,
  };
  emitChange();
}

export function useAppTourStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
