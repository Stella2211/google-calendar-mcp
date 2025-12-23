/**
 * Privacy configuration loader with caching
 * Loads config from ~/.config/stella2211-google-calendar-mcp/config.json
 */

import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import { PrivacyConfig, DEFAULT_PRIVACY_CONFIG } from './PrivacyConfig.js';

/**
 * Get the privacy config file path
 * Priority: PRIVACY_CONFIG_PATH > XDG_CONFIG_HOME > ~/.config
 */
export function getPrivacyConfigPath(): string {
  if (process.env.PRIVACY_CONFIG_PATH) {
    return path.resolve(process.env.PRIVACY_CONFIG_PATH);
  }
  const configDir = process.env.XDG_CONFIG_HOME || path.join(homedir(), '.config');
  return path.join(configDir, 'stella2211-google-calendar-mcp', 'config.json');
}

/**
 * Singleton loader for privacy configuration
 * Uses in-memory caching with TTL to avoid repeated file reads
 */
export class PrivacyConfigLoader {
  private static instance: PrivacyConfigLoader | null = null;
  private config: PrivacyConfig | null = null;
  private configPath: string;
  private lastLoadTime: number = 0;
  private readonly CACHE_TTL = 60 * 1000; // 1 minute cache

  private constructor() {
    this.configPath = getPrivacyConfigPath();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PrivacyConfigLoader {
    if (!PrivacyConfigLoader.instance) {
      PrivacyConfigLoader.instance = new PrivacyConfigLoader();
    }
    return PrivacyConfigLoader.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    PrivacyConfigLoader.instance = null;
  }

  /**
   * Load config from file with caching
   * Returns default config if file doesn't exist or is invalid
   */
  async loadConfig(): Promise<PrivacyConfig> {
    // Return cached config if still fresh
    if (this.config && (Date.now() - this.lastLoadTime) < this.CACHE_TTL) {
      return this.config;
    }

    try {
      const fileContent = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(fileContent);

      // Validate and normalize the config
      this.config = this.validateConfig(parsed);
      this.lastLoadTime = Date.now();
      return this.config;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist - return defaults (this is not an error)
        this.config = { ...DEFAULT_PRIVACY_CONFIG };
        this.lastLoadTime = Date.now();
        return this.config;
      }

      // Log error but return defaults (graceful degradation)
      if (process.env.NODE_ENV !== 'test') {
        process.stderr.write(`Warning: Failed to load privacy config from ${this.configPath}: ${error}\n`);
      }
      this.config = { ...DEFAULT_PRIVACY_CONFIG };
      this.lastLoadTime = Date.now();
      return this.config;
    }
  }

  /**
   * Validate and normalize config structure
   */
  private validateConfig(parsed: unknown): PrivacyConfig {
    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULT_PRIVACY_CONFIG };
    }

    const config: PrivacyConfig = { ...DEFAULT_PRIVACY_CONFIG };
    const obj = parsed as Record<string, unknown>;

    // Version
    if (obj.version !== undefined && typeof obj.version === 'number') {
      config.version = obj.version;
    }

    // Email mappings - normalize keys to lowercase
    if (obj.emailMappings && typeof obj.emailMappings === 'object') {
      config.emailMappings = {};
      for (const [email, name] of Object.entries(obj.emailMappings as Record<string, unknown>)) {
        if (typeof name === 'string') {
          config.emailMappings[email.toLowerCase()] = name;
        }
      }
    }

    // Default calendar ID
    if (obj.defaultCalendarId && typeof obj.defaultCalendarId === 'string') {
      config.defaultCalendarId = obj.defaultCalendarId;
    }

    return config;
  }

  /**
   * Invalidate cache (for testing or when config changes)
   */
  invalidateCache(): void {
    this.config = null;
    this.lastLoadTime = 0;
  }

  /**
   * Get the config file path (for error messages/debugging)
   */
  getPath(): string {
    return this.configPath;
  }
}

/**
 * Convenience function to load privacy config
 * Returns the config or defaults if unavailable
 */
export async function loadPrivacyConfig(): Promise<PrivacyConfig> {
  return PrivacyConfigLoader.getInstance().loadConfig();
}
