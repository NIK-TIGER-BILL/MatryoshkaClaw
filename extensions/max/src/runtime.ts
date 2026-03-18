/**
 * Runtime store for Max channel plugin
 * Mirrors the pattern used by the Telegram extension
 */

export interface MaxRuntime {
  version: string;
  channelId: "max";
}

let _runtime: MaxRuntime | null = null;

export function setMaxRuntime(runtime: MaxRuntime): void {
  _runtime = runtime;
}

export function getMaxRuntime(): MaxRuntime {
  if (!_runtime) throw new Error("Max runtime not initialized");
  return _runtime;
}
