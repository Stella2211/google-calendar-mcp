/**
 * Email masking utilities for privacy protection
 *
 * When an email is in the config mappings, we return the original email
 * with the mapped display name. When not in mappings, we mask the email
 * as "j***@example.com" format.
 */

import { PrivacyConfig } from './PrivacyConfig.js';

/**
 * Result of applying email privacy
 */
export interface MaskedEmailResult {
  /** Email address (masked or original if in mappings) */
  email: string;
  /** Display name from config mappings or preserved from Google API */
  displayName?: string;
}

/**
 * Mask an email address for privacy
 * "john.doe@example.com" -> "j***@example.com"
 *
 * @param email - Email address to mask
 * @returns Masked email string
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email || '';
  }

  const atIndex = email.indexOf('@');
  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  if (localPart.length === 0) {
    return `***@${domain}`;
  }

  // Keep first character, mask rest
  const maskedLocal = localPart.charAt(0) + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Apply privacy masking to an email address
 *
 * If the email is in config.emailMappings:
 *   - Return original email (known contact)
 *   - Use mapped name as displayName
 *
 * If not in mappings:
 *   - Return masked email (e.g., "j***@example.com")
 *   - Preserve Google API displayName if available
 *
 * @param email - Email address to process
 * @param googleDisplayName - Display name from Google API (preserved if available)
 * @param config - Privacy config with email mappings
 * @returns Object with masked/original email and displayName
 */
export function applyEmailPrivacy(
  email: string | undefined | null,
  googleDisplayName: string | undefined | null,
  config: Pick<PrivacyConfig, 'emailMappings'>
): MaskedEmailResult {
  if (!email) {
    return { email: '', displayName: googleDisplayName || undefined };
  }

  const emailLower = email.toLowerCase();
  const mappings = config.emailMappings || {};

  // Check if email is in mappings (known contact)
  if (emailLower in mappings) {
    return {
      email: email, // Keep original email for known contacts
      displayName: mappings[emailLower], // Use mapped display name
    };
  }

  // Unknown email - mask it
  return {
    email: maskEmail(email),
    displayName: googleDisplayName || undefined, // Preserve Google's displayName if available
  };
}
