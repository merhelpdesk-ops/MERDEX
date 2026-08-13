declare global {
  interface Window {
    __RUNTIME_CONFIG__?: Record<string, string>;
  }
}

export function getRuntimeConfig(key: string): string | undefined {
  const runtimeValue = window.__RUNTIME_CONFIG__?.[key];
  if (runtimeValue) return runtimeValue;
  return import.meta.env[key];
}
