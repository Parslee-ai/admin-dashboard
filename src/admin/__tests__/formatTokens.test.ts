import { describe, it, expect } from 'vitest';
import { formatTokens } from '../OrganizationsTab';

describe('formatTokens', () => {
  it('returns "-" for null', () => { expect(formatTokens(null)).toBe('-'); });
  it('returns "-" for undefined', () => { expect(formatTokens(undefined)).toBe('-'); });
  it('returns "0" for zero', () => { expect(formatTokens(0)).toBe('0'); });
  it('returns raw string for sub-1K values', () => { expect(formatTokens(999)).toBe('999'); });
  it('returns "1.0K" at the 1K boundary', () => { expect(formatTokens(1000)).toBe('1.0K'); });
  it('returns "1000.0K" at the sub-M boundary', () => { expect(formatTokens(999999)).toBe('1000.0K'); });
  it('returns "1.0M" at the 1M boundary', () => { expect(formatTokens(1000000)).toBe('1.0M'); });
  it('returns "2.4M" for representative M value', () => { expect(formatTokens(2400000)).toBe('2.4M'); });
});
