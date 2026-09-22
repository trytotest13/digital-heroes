export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | { [key: string]: any }
  | ClassValue[];

/**
 * Clean utility function to merge class names without heavy runtime dependencies.
 */
export function cn(...inputs: ClassValue[]): string {
  const result: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string") {
      result.push(input.trim());
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) result.push(nested);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) result.push(key);
      }
    }
  }
  return result.join(" ");
}
