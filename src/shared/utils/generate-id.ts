import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique identifier using UUID v4
 * @returns A UUID v4 string
 */
export function generateId(): string {
  return uuidv4();
}
