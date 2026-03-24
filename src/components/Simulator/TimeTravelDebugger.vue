<template>
  <div class="time-travel-debugger draggable-panel" ref="timeTravelPanelRef" id="time-travel-debugger">
    <div class="panel-header">
      Time Travel Debugger
      <span class="fas fa-minus-square minimize"></span>
      <span class="fas fa-external-link-square-alt maximize"></span>
    </div>
    <div class="panel-body">
      <div class="time-travel-toolbar noSelect">
        <button
          class="time-travel-btn"
          :disabled="!canStepBack"
          @click="stepBack"
          title="Step Back"
        >
          <i class="fas fa-step-backward"></i>
        </button>
        <button
          class="time-travel-btn"
          :disabled="!canStepForward"
          @click="stepForward"
          title="Step Forward"
        >
          <i class="fas fa-step-forward"></i>
        </button>
        <button
          class="time-travel-btn record-btn"
          :class="{ recording: isRecording }"
          @click="toggleRecording"
          :title="isRecording ? 'Stop Recording' : 'Start Recording'"
        >
          <i class="fas fa-circle"></i>
        </button>
        <button
          class="time-travel-btn"
          @click="clearHistory"
          title="Clear History"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>

      <div class="time-travel-status">
        <span class="snapshot-count">
          Step {{ currentIndex + 1 }} / {{ totalSnapshots }}
        </span>
      </div>

      <div class="time-travel-timeline">
        <input
          type="range"
          min="0"
          :max="totalSnapshots - 1"
          v-model.number="currentIndex"
          @input="jumpToIndex(Number($event.target.value))"
          class="timeline-slider"
        />
      </div>

      <div class="snapshot-list">
        <div
          v-for="(snapshot, index) in snapshots"
          :key="snapshot.id"
          class="snapshot-item"
          :class="{ active: index === currentIndex }"
          @click="jumpToIndex(index)"
        >
          <div class="snapshot-info">
            <span class="snapshot-label">
              {{ snapshot.label || `Step ${index + 1}` }}
            </span>
            <span class="snapshot-time">
              {{ formatTime(snapshot.timestamp) }}
            </span>
          </div>
          <div class="snapshot-clock">
            Clock: {{ snapshot.clockTick }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTimeTravelStore } from '#/store/timeTravelStore';
import { useTimeTravelDebugger } from '#/composables/useTimeTravelDebugger';
import { useLayoutStore } from '#/store/layoutStore';
import { setupPanelListeners, minimizePanel } from '#/simulator/src/ux';

const layoutStore = useLayoutStore();
const timeTravelPanelRef = ref<HTMLElement>();

const {
  canStepBack,
  canStepForward,
  currentSnapshot,
  totalSnapshots,
  isRecording,
  stepBack,
  stepForward,
  jumpToIndex,
  startRecording,
  stopRecording,
  clearHistory,
} = useTimeTravelDebugger();

// Computed snapshots array from store
const snapshots = computed(() => {
  const store = useTimeTravelStore();
  return store.snapshots;
});

const currentIndex = computed({
  get: () => {
    const store = useTimeTravelStore();
    return store.currentIndex;
  },
  set: (value: number) => {
    jumpToIndex(value);
  }
});

const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

onMounted(() => {
  if (layoutStore && timeTravelPanelRef.value) {
    // Add to layout store if needed
    setupPanelListeners('.time-travel-debugger');
    minimizePanel('.time-travel-debugger');
  }
});
</script>

<style scoped>
.time-travel-debugger {
  background: var(--bg-primary-moz);
  border: 1px solid var(--br-primary);
  border-radius: 4px;
  color: var(--text-lite);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 12px;
  position: absolute;
  z-index: 100;
  min-width: 280px;
  max-width: 400px;
}

.panel-header {
  background: var(--primary);
  color: var(--text-lite);
  padding: 8px 12px;
  font-weight: bold;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header .fa-minus-square,
.panel-header .fa-external-link-square-alt {
  cursor: pointer;
  color: var(--text-lite);
  opacity: 0.7;
}

.panel-header .fa-minus-square:hover,
.panel-header .fa-external-link-square-alt:hover {
  opacity: 1;
}

.panel-body {
  padding: 12px;
}

.time-travel-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
}

.time-travel-btn {
  background: var(--bg-icons);
  border: 1px solid var(--br-secondary);
  color: var(--text-lite);
  padding: 6px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-travel-btn:hover:not(:disabled) {
  background: var(--cus-btn-hov--bg);
  color: var(--cus-btn-hov-text);
}

.time-travel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.record-btn.recording {
  color: var(--btn-danger);
}

.record-btn.recording .fa-circle {
  color: var(--btn-danger);
}

.time-travel-status {
  margin-bottom: 12px;
  text-align: center;
}

.snapshot-count {
  font-weight: bold;
  color: var(--text-lite);
}

.time-travel-timeline {
  margin-bottom: 12px;
}

.timeline-slider {
  width: 100%;
  -webkit-appearance: none;
  background: var(--bg-secondary);
  height: 6px;
  border-radius: 3px;
  outline: none;
}

.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg-toggle-btn-primary);
  cursor: pointer;
}

.timeline-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg-toggle-btn-primary);
  cursor: pointer;
  border: none;
}

.snapshot-list {
  max-height: 200px;
  overflow-y: auto;
}

.snapshot-item {
  padding: 8px;
  border: 1px solid var(--br-secondary);
  border-radius: 3px;
  margin-bottom: 4px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
}

.snapshot-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.snapshot-item.active {
  background: var(--bg-toggle-btn-primary);
  border-color: var(--bg-toggle-btn-primary);
}

.snapshot-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.snapshot-label {
  font-weight: bold;
  color: var(--text-lite);
}

.snapshot-time {
  font-size: 10px;
  color: var(--text-panel);
  opacity: 0.8;
}

.snapshot-clock {
  font-size: 10px;
  color: var(--text-panel);
  opacity: 0.7;
}
</style>