export function pcall<T>(fn: () => T): { success: true, value: T } | { success: false, error: any } {
  try {
      const value = fn();
      return { success: true, value };
  } catch (error) {
      return { success: false, error: error };
  }
}