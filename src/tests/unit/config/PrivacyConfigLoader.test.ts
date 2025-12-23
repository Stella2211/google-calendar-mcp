import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrivacyConfigLoader, getPrivacyConfigPath } from '../../../config/PrivacyConfigLoader.js';
import { DEFAULT_PRIVACY_CONFIG } from '../../../config/PrivacyConfig.js';
import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

describe('PrivacyConfigLoader', () => {
  beforeEach(() => {
    PrivacyConfigLoader.resetInstance();
    vi.clearAllMocks();
    delete process.env.PRIVACY_CONFIG_PATH;
    delete process.env.XDG_CONFIG_HOME;
  });

  afterEach(() => {
    PrivacyConfigLoader.resetInstance();
  });

  describe('getPrivacyConfigPath', () => {
    it('should use default path when no env vars set', () => {
      const configPath = getPrivacyConfigPath();
      const expected = path.join(homedir(), '.config', 'stella2211-google-calendar-mcp', 'config.json');
      expect(configPath).toBe(expected);
    });

    it('should use PRIVACY_CONFIG_PATH when set', () => {
      process.env.PRIVACY_CONFIG_PATH = '/custom/path/config.json';
      const configPath = getPrivacyConfigPath();
      expect(configPath).toBe('/custom/path/config.json');
    });

    it('should use XDG_CONFIG_HOME when set', () => {
      process.env.XDG_CONFIG_HOME = '/home/user/.myconfig';
      const configPath = getPrivacyConfigPath();
      expect(configPath).toBe('/home/user/.myconfig/stella2211-google-calendar-mcp/config.json');
    });

    it('should prefer PRIVACY_CONFIG_PATH over XDG_CONFIG_HOME', () => {
      process.env.PRIVACY_CONFIG_PATH = '/custom/path/config.json';
      process.env.XDG_CONFIG_HOME = '/home/user/.myconfig';
      const configPath = getPrivacyConfigPath();
      expect(configPath).toBe('/custom/path/config.json');
    });
  });

  describe('loadConfig', () => {
    it('should return defaults when config file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const loader = PrivacyConfigLoader.getInstance();
      const config = await loader.loadConfig();

      expect(config).toEqual(DEFAULT_PRIVACY_CONFIG);
    });

    it('should load and parse valid config file', async () => {
      const testConfig = {
        version: 1,
        emailMappings: {
          'john@example.com': 'John Smith',
        },
        defaultCalendarId: 'work@gmail.com',
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(testConfig));

      const loader = PrivacyConfigLoader.getInstance();
      const config = await loader.loadConfig();

      expect(config.emailMappings).toEqual({ 'john@example.com': 'John Smith' });
      expect(config.defaultCalendarId).toBe('work@gmail.com');
    });

    it('should normalize email keys to lowercase', async () => {
      const testConfig = {
        emailMappings: {
          'JOHN@EXAMPLE.COM': 'John Smith',
          'Jane@Company.Org': 'Jane Doe',
        },
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(testConfig));

      const loader = PrivacyConfigLoader.getInstance();
      const config = await loader.loadConfig();

      expect(config.emailMappings).toEqual({
        'john@example.com': 'John Smith',
        'jane@company.org': 'Jane Doe',
      });
    });

    it('should cache config within TTL', async () => {
      const testConfig = { version: 1, emailMappings: {} };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(testConfig));

      const loader = PrivacyConfigLoader.getInstance();
      await loader.loadConfig();
      await loader.loadConfig();
      await loader.loadConfig();

      // Should only read file once due to caching
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle malformed JSON gracefully', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('{ invalid json }');

      const loader = PrivacyConfigLoader.getInstance();
      const config = await loader.loadConfig();

      expect(config).toEqual(DEFAULT_PRIVACY_CONFIG);
    });

    it('should handle non-object config', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('"just a string"');

      const loader = PrivacyConfigLoader.getInstance();
      const config = await loader.loadConfig();

      expect(config).toEqual(DEFAULT_PRIVACY_CONFIG);
    });

    it('should ignore invalid emailMappings entries', async () => {
      const testConfig = {
        emailMappings: {
          'valid@example.com': 'Valid Name',
          'invalid@example.com': 123, // Should be ignored
          'also-invalid@example.com': null, // Should be ignored
        },
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(testConfig));

      const loader = PrivacyConfigLoader.getInstance();
      const config = await loader.loadConfig();

      expect(config.emailMappings).toEqual({ 'valid@example.com': 'Valid Name' });
    });

    it('should ignore non-string defaultCalendarId', async () => {
      const testConfig = {
        defaultCalendarId: 123,
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(testConfig));

      const loader = PrivacyConfigLoader.getInstance();
      const config = await loader.loadConfig();

      expect(config.defaultCalendarId).toBeUndefined();
    });
  });

  describe('invalidateCache', () => {
    it('should force reload on next loadConfig call', async () => {
      const testConfig = { version: 1, emailMappings: {} };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(testConfig));

      const loader = PrivacyConfigLoader.getInstance();
      await loader.loadConfig();
      loader.invalidateCache();
      await loader.loadConfig();

      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = PrivacyConfigLoader.getInstance();
      const instance2 = PrivacyConfigLoader.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should reset instance properly', () => {
      const instance1 = PrivacyConfigLoader.getInstance();
      PrivacyConfigLoader.resetInstance();
      const instance2 = PrivacyConfigLoader.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });
});
