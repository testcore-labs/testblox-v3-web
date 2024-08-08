export function pcall<T>(fn: () => T | void): { success: true, value: T | void } | { success: false, error: any } {
  try {
      const value = fn();
      return { success: true, value };
  } catch (error) {
      return { success: false, error: error };
  }
}