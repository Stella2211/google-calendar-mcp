/**
 * Configuration module exports
 */

// Transport configuration (existing)
export { TransportConfig, ServerConfig, parseArgs } from './TransportConfig.js';

// Privacy configuration
export { PrivacyConfig, DEFAULT_PRIVACY_CONFIG } from './PrivacyConfig.js';
export {
  PrivacyConfigLoader,
  loadPrivacyConfig,
  getPrivacyConfigPath,
} from './PrivacyConfigLoader.js';
export { maskEmail, applyEmailPrivacy, MaskedEmailResult } from './EmailMasker.js';
