import { generateId } from '../generate-id';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('generateId', () => {
  it('should generate a valid UUID v4', () => {
    const id = generateId();

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(id).toMatch(uuidV4Regex);
  });

  it('should return a string', () => {
    const id = generateId();

    expect(typeof id).toBe('string');
  });

  it('should generate IDs of correct length', () => {
    const id = generateId();

    // UUID format is always 36 characters (32 hex + 4 hyphens)
    expect(id).toHaveLength(36);
  });
});
