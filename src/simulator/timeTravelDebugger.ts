import { useTimeTravelStore, CircuitSnapshot } from "@/store/timeTravelStore";

// Assuming globalScope is available globally (as declared in simulator)
declare var globalScope: any;

export interface CircuitSnapshot {
  id: string;
  timestamp: number;
  label?: string;
  circuitData: any;
  clockTick: number;
}

/**
 * Captures the current circuit state and stores it in the time travel store
 */
export function captureCircuitState(label?: string): void {
  const store = useTimeTravelStore();

  if (!store.isRecording) return;

  // Serialize the current globalScope state
  const circuitData = serializeScope(globalScope);

  // Get current clock tick (assuming simulationArea has this info)
  const clockTick = (window as any).simulationArea?.clockState || 0;

  // Update the latest snapshot with the captured data
  if (store.snapshots.length > 0) {
    const latestSnapshot = store.snapshots[store.snapshots.length - 1];
    latestSnapshot.circuitData = circuitData;
    latestSnapshot.clockTick = clockTick;
    if (label) latestSnapshot.label = label;
  }
}

/**
 * Restores a circuit snapshot
 */
export function restoreCircuitState(snapshot: CircuitSnapshot): void {
  if (!snapshot.circuitData) return;

  deserializeScope(snapshot.circuitData);

  // Update simulation area clock state if available
  if ((window as any).simulationArea) {
    (window as any).simulationArea.clockState = snapshot.clockTick;
  }

  // Trigger UI updates
  if ((window as any).scheduleUpdate) {
    (window as any).scheduleUpdate();
  }
}

/**
 * Serializes the global scope into a JSON-compatible object
 */
export function serializeScope(scope: any): any {
  if (!scope) return null;

  // Deep clone to avoid mutations
  const serialized = {
    id: scope.id,
    name: scope.name,
    timeStamp: scope.timeStamp,
    ox: scope.ox,
    oy: scope.oy,
    scale: scope.scale,
    layout: scope.layout ? { ...scope.layout } : {},
    verilogMetadata: scope.verilogMetadata ? { ...scope.verilogMetadata } : {},
    restrictedCircuitElementsUsed: scope.restrictedCircuitElementsUsed ? [...scope.restrictedCircuitElementsUsed] : [],

    // Serialize all circuit elements and nodes
    allNodes: scope.allNodes ? scope.allNodes.map(serializeNode) : [],
    wires: scope.wires ? scope.wires.map(serializeWire) : [],

    // Serialize module elements
    Input: scope.Input ? scope.Input.map(serializeCircuitElement) : [],
    Output: scope.Output ? scope.Output.map(serializeCircuitElement) : [],
    Clock: scope.Clock ? scope.Clock.map(serializeCircuitElement) : [],
    AndGate: scope.AndGate ? scope.AndGate.map(serializeCircuitElement) : [],
    OrGate: scope.OrGate ? scope.OrGate.map(serializeCircuitElement) : [],
    NotGate: scope.NotGate ? scope.NotGate.map(serializeCircuitElement) : [],
    NandGate: scope.NandGate ? scope.NandGate.map(serializeCircuitElement) : [],
    NorGate: scope.NorGate ? scope.NorGate.map(serializeCircuitElement) : [],
    XorGate: scope.XorGate ? scope.XorGate.map(serializeCircuitElement) : [],
    XnorGate: scope.XnorGate ? scope.XnorGate.map(serializeCircuitElement) : [],
    SevenSegDisplay: scope.SevenSegDisplay ? scope.SevenSegDisplay.map(serializeCircuitElement) : [],
    // Add more module types as needed
  };

  return serialized;
}

/**
 * Deserializes a scope object back into globalScope
 */
export function deserializeScope(data: any): void {
  if (!data || !globalScope) return;

  // Restore basic properties
  globalScope.id = data.id;
  globalScope.name = data.name;
  globalScope.timeStamp = data.timeStamp;
  globalScope.ox = data.ox;
  globalScope.oy = data.oy;
  globalScope.scale = data.scale;
  globalScope.layout = { ...data.layout };
  globalScope.verilogMetadata = { ...data.verilogMetadata };
  globalScope.restrictedCircuitElementsUsed = [...data.restrictedCircuitElementsUsed];

  // Clear existing elements
  clearScopeElements(globalScope);

  // Restore nodes first (needed for wires and elements)
  if (data.allNodes) {
    data.allNodes.forEach((nodeData: any) => {
      const node = deserializeNode(nodeData, globalScope);
      if (node) globalScope.allNodes.push(node);
    });
  }

  // Restore circuit elements
  restoreModuleElements(data, globalScope, 'Input');
  restoreModuleElements(data, globalScope, 'Output');
  restoreModuleElements(data, globalScope, 'Clock');
  restoreModuleElements(data, globalScope, 'AndGate');
  restoreModuleElements(data, globalScope, 'OrGate');
  restoreModuleElements(data, globalScope, 'NotGate');
  restoreModuleElements(data, globalScope, 'NandGate');
  restoreModuleElements(data, globalScope, 'NorGate');
  restoreModuleElements(data, globalScope, 'XorGate');
  restoreModuleElements(data, globalScope, 'XnorGate');
  restoreModuleElements(data, globalScope, 'SevenSegDisplay');
  // Add more module types as needed

  // Restore wires last (after nodes are restored)
  if (data.wires) {
    data.wires.forEach((wireData: any) => {
      const wire = deserializeWire(wireData, globalScope);
      if (wire) globalScope.wires.push(wire);
    });
  }
}

function clearScopeElements(scope: any): void {
  // Clear all arrays
  const moduleTypes = [
    'allNodes', 'wires', 'Input', 'Output', 'Clock', 'AndGate', 'OrGate',
    'NotGate', 'NandGate', 'NorGate', 'XorGate', 'XnorGate', 'SevenSegDisplay'
  ];

  moduleTypes.forEach(type => {
    if (scope[type]) {
      scope[type] = [];
    }
  });
}

function restoreModuleElements(data: any, scope: any, moduleType: string): void {
  if (data[moduleType]) {
    data[moduleType].forEach((elementData: any) => {
      const element = deserializeCircuitElement(elementData, scope, moduleType);
      if (element && scope[moduleType]) {
        scope[moduleType].push(element);
      }
    });
  }
}

// Helper functions for serialization/deserialization
function serializeNode(node: any): any {
  return {
    id: node.id,
    x: node.x,
    y: node.y,
    type: node.type,
    bitWidth: node.bitWidth,
    label: node.label,
    value: node.value,
    connections: node.connections?.map((conn: any) => ({
      id: conn.id,
      x: conn.x,
      y: conn.y,
    })) || [],
  };
}

function deserializeNode(data: any, scope: any): any {
  if (!data) return null;
  // Create a basic node object with essential properties
  // Note: This is a simplified implementation. Full implementation would require
  // instantiating the proper Node class with all methods.
  const node = {
    id: data.id,
    x: data.x,
    y: data.y,
    type: data.type,
    bitWidth: data.bitWidth,
    label: data.label,
    value: data.value,
    connections: data.connections || [],
    // Add placeholder methods that would be needed
    reset: () => {},
    resolve: () => {},
    // Add more methods as needed
  };
  return node;
}

function serializeWire(wire: any): any {
  return {
    x1: wire.x1,
    y1: wire.y1,
    x2: wire.x2,
    y2: wire.y2,
    value: wire.value,
    node1Id: wire.node1?.id,
    node2Id: wire.node2?.id,
  };
}

function deserializeWire(data: any, scope: any): any {
  if (!data) return null;
  // Find the nodes by ID
  const node1 = scope.allNodes?.find((n: any) => n.id === data.node1Id);
  const node2 = scope.allNodes?.find((n: any) => n.id === data.node2Id);

  if (!node1 || !node2) return null;

  // Create wire object with essential properties
  // Note: This is a simplified implementation.
  const wire = {
    x1: data.x1,
    y1: data.y1,
    x2: data.x2,
    y2: data.y2,
    value: data.value,
    node1,
    node2,
    objectType: 'Wire',
    // Add placeholder methods
    updateData: () => {},
    // Add more methods as needed
  };
  return wire;
}

function serializeCircuitElement(element: any): any {
  return {
    id: element.id,
    x: element.x,
    y: element.y,
    label: element.label,
    direction: element.direction,
    bitWidth: element.bitWidth,
    objectType: element.objectType,
    customData: element.customData || {},
    propagationDelay: element.propagationDelay,
    // Add other properties as needed
  };
}

function deserializeCircuitElement(data: any, scope: any, moduleType?: string): any {
  if (!data) return null;
  // Create basic element object with essential properties
  // Note: This is a simplified implementation. Full implementation would require
  // instantiating the proper element class with all methods.
  const element = {
    id: data.id,
    x: data.x,
    y: data.y,
    label: data.label,
    direction: data.direction,
    bitWidth: data.bitWidth,
    objectType: data.objectType || moduleType,
    customData: data.customData || {},
    propagationDelay: data.propagationDelay,
    // Add placeholder methods that would be needed
    draw: () => {},
    resolve: () => {},
    // Add more methods as needed
  };
  return element;
}

export const timeTravelDebugger = {
  capture: captureCircuitState,
  restore: restoreCircuitState,
  serializeScope,
  deserializeScope,
};

// Set up global hook for automatic capture
(window as any).timeTravelCaptureHook = (label?: string) => {
  captureCircuitState(label);
};