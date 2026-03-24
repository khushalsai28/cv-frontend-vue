import { defineStore } from "pinia";

export interface CircuitSnapshot {
  id: string;
  timestamp: number;
  label?: string;
  circuitData: any; // Serialized JSON of circuit elements, node states, wire states
  clockTick: number;
}

interface TimeTravelState {
  snapshots: CircuitSnapshot[];
  currentIndex: number;
  isRecording: boolean;
  maxSnapshots: number;
}

export const useTimeTravelStore = defineStore("timeTravel", {
  state: (): TimeTravelState => ({
    snapshots: [],
    currentIndex: -1,
    isRecording: false,
    maxSnapshots: 100,
  }),

  getters: {
    canStepBack: (state) => state.currentIndex > 0,
    canStepForward: (state) => state.currentIndex < state.snapshots.length - 1,
    currentSnapshot: (state) => state.snapshots[state.currentIndex] || null,
    totalSnapshots: (state) => state.snapshots.length,
  },

  actions: {
    captureSnapshot(label?: string) {
      if (!this.isRecording) return;

      // Remove snapshots after current index (when branching)
      this.snapshots = this.snapshots.slice(0, this.currentIndex + 1);

      // Implement ring buffer: remove oldest if at max
      if (this.snapshots.length >= this.maxSnapshots) {
        this.snapshots.shift();
        this.currentIndex--;
      }

      const snapshot: CircuitSnapshot = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        label,
        circuitData: {}, // Will be filled by timeTravelDebugger
        clockTick: 0, // Will be filled by timeTravelDebugger
      };

      this.snapshots.push(snapshot);
      this.currentIndex = this.snapshots.length - 1;
    },

    stepBack() {
      if (this.canStepBack) {
        this.currentIndex--;
      }
    },

    stepForward() {
      if (this.canStepForward) {
        this.currentIndex++;
      }
    },

    jumpToIndex(index: number) {
      if (index >= 0 && index < this.snapshots.length) {
        this.currentIndex = index;
      }
    },

    clearHistory() {
      this.snapshots = [];
      this.currentIndex = -1;
    },

    startRecording() {
      this.isRecording = true;
    },

    stopRecording() {
      this.isRecording = false;
    },
  },
});