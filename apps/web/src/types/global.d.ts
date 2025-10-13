// Global type declarations to help with TypeScript strictness
declare global {
  // Allow property access on unknown types
  interface Unknown {
    [key: string]: any;
  }
  
  // Helper type for safe property access
  type SafeAccess<T, K extends keyof any> = T extends Record<K, infer V> ? V : any;
}

// Type assertion helpers
export function safeAccess<T = any>(obj: unknown, key: string): T {
  return (obj as any)?.[key];
}

export function isObject(obj: unknown): obj is Record<string, any> {
  return obj !== null && typeof obj === 'object';
}

export function hasProperty<T extends string>(
  obj: unknown, 
  prop: T
): obj is Record<T, any> {
  return isObject(obj) && prop in obj;
}

export {};
