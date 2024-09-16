/**
 * DEPRECATED! use pcall()
 * @param {function} fn - function
 * @deprecated
 * @returns message type with sucess and value
*/
export function pcall_msg<T>(fn: () => T | void): { success: true, value: T | void } | { success: false, error: any } {
  try {
    const value = fn();
    return { success: true, value };
  } catch (error) {
    return { success: false, error: error };
  }
}

export async function pcall<T>(fn: () => T | void) {
  try {
    const value = await fn();
    return [ true, value ];
  } catch (error) {
    return [ error, undefined ];
  }
}
export function pcall_sync<T>(fn: () => T | void) {
  try {
    const value = fn();
    return [ true, value ];
  } catch (error) {
    return [ error, undefined ];
  }
}