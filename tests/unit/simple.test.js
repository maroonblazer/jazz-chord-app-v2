import { test, expect, describe } from '@jest/globals';

describe('Simple Test', () => {
  test('should work with basic functionality', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('should handle objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(42);
  });
});