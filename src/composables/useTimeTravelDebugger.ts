import { computed } from "vue";
import { useTimeTravelStore } from "@/store/timeTravelStore";
import { timeTravelDebugger } from "@/simulator/timeTravelDebugger";

export function useTimeTravelDebugger() {
  const store = useTimeTravelStore();

  const canStepBack = computed(() => store.canStepBack);
  const canStepForward = computed(() => store.canStepForward);
  const currentSnapshot = computed(() => store.currentSnapshot);
  const totalSnapshots = computed(() => store.totalSnapshots);
  const isRecording = computed(() => store.isRecording);

  const captureSnapshot = (label?: string) => {
    timeTravelDebugger.capture(label);
  };

  const restoreCurrentSnapshot = () => {
    if (currentSnapshot.value) {
      timeTravelDebugger.restore(currentSnapshot.value);
    }
  };

  const stepBack = () => {
    store.stepBack();
    restoreCurrentSnapshot();
  };

  const stepForward = () => {
    store.stepForward();
    restoreCurrentSnapshot();
  };

  const jumpToIndex = (index: number) => {
    store.jumpToIndex(index);
    restoreCurrentSnapshot();
  };

  const startRecording = () => {
    store.startRecording();
  };

  const stopRecording = () => {
    store.stopRecording();
  };

  const clearHistory = () => {
    store.clearHistory();
  };

  return {
    // State
    canStepBack,
    canStepForward,
    currentSnapshot,
    totalSnapshots,
    isRecording,

    // Actions
    captureSnapshot,
    stepBack,
    stepForward,
    jumpToIndex,
    startRecording,
    stopRecording,
    clearHistory,
    restoreCurrentSnapshot,
  };
}