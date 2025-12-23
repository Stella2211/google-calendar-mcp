import { describe, it, expect } from 'vitest';
import { maskEmail, applyEmailPrivacy } from '../../../config/EmailMasker.js';

describe('EmailMasker', () => {
  describe('maskEmail', () => {
    it('should mask standard email addresses', () => {
      expect(maskEmail('john.doe@example.com')).toBe('j***@example.com');
      expect(maskEmail('alice@company.org')).toBe('a***@company.org');
    });

    it('should handle single character local part', () => {
      expect(maskEmail('a@example.com')).toBe('a***@example.com');
    });

    it('should handle empty email string', () => {
      expect(maskEmail('')).toBe('');
    });

    it('should handle email without @', () => {
      expect(maskEmail('notanemail')).toBe('notanemail');
    });

    it('should handle email with empty local part', () => {
      expect(maskEmail('@example.com')).toBe('***@example.com');
    });

    it('should handle null/undefined', () => {
      expect(maskEmail(null as any)).toBe('');
      expect(maskEmail(undefined as any)).toBe('');
    });
  });

  describe('applyEmailPrivacy', () => {
    const configWithMappings = {
      emailMappings: {
        'known@example.com': 'Known Person',
        'john.doe@company.org': 'John Doe',
      },
    };

    const emptyConfig = {
      emailMappings: {},
    };

    it('should return original email when in mappings', () => {
      const result = applyEmailPrivacy('known@example.com', null, configWithMappings);
      expect(result.email).toBe('known@example.com');
      expect(result.displayName).toBe('Known Person');
    });

    it('should handle case-insensitive email matching', () => {
      const result = applyEmailPrivacy('KNOWN@EXAMPLE.COM', null, configWithMappings);
      expect(result.email).toBe('KNOWN@EXAMPLE.COM');
      expect(result.displayName).toBe('Known Person');
    });

    it('should mask email when not in mappings', () => {
      const result = applyEmailPrivacy('unknown@test.com', null, configWithMappings);
      expect(result.email).toBe('u***@test.com');
      expect(result.displayName).toBeUndefined();
    });

    it('should preserve Google displayName when not in mappings', () => {
      const result = applyEmailPrivacy('unknown@test.com', 'Google Display Name', configWithMappings);
      expect(result.email).toBe('u***@test.com');
      expect(result.displayName).toBe('Google Display Name');
    });

    it('should handle null/undefined email', () => {
      const result1 = applyEmailPrivacy(null, 'Name', configWithMappings);
      expect(result1.email).toBe('');
      expect(result1.displayName).toBe('Name');

      const result2 = applyEmailPrivacy(undefined, null, configWithMappings);
      expect(result2.email).toBe('');
      expect(result2.displayName).toBeUndefined();
    });

    it('should work with empty config', () => {
      const result = applyEmailPrivacy('test@example.com', null, emptyConfig);
      expect(result.email).toBe('t***@example.com');
    });

    it('should work without emailMappings property', () => {
      const result = applyEmailPrivacy('test@example.com', null, {});
      expect(result.email).toBe('t***@example.com');
    });
  });
});
