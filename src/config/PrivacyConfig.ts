/**
 * Privacy configuration types and defaults
 * Config file location: ~/.config/stella2211-google-calendar-mcp/config.json
 */

/**
 * Privacy configuration interface
 */
export interface PrivacyConfig {
  /**
   * Schema version for future migrations
   */
  version?: number;

  /**
   * Map of email addresses to display names for privacy masking.
   * Emails not in this map will be masked as "j***@example.com"
   * Keys are normalized to lowercase for case-insensitive matching.
   */
  emailMappings?: Record<string, string>;

  /**
   * Global default calendar ID to use when "primary" is specified.
   * Applied across all accounts. If not set, "primary" passes through unchanged.
   */
  defaultCalendarId?: string;
}

/**
 * Default empty privacy config
 */
export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  version: 1,
  emailMappings: {},
  defaultCalendarId: undefined,
};
