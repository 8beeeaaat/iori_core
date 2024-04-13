import { add } from './index';
import { describe, expect, it, test } from 'vitest';

test('add function', (test) => {
  describe('should return the sum of two numbers', () => {
    const result = add(2, 3);
    expect(result).toBe(5);
  });

  describe('should return 0 when both numbers are 0', () => {
    const result = add(0, 0);
    expect(result).toBe(0);
  });

  describe('should return a negative number when one number is negative', () => {
    const result = add(-5, 3);
    expect(result).toBe(-2);
  });
});
