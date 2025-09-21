/**
 * Shell Command Dot Notation System
 *
 * Main entry point for the TypeScript/zx rewrite of the shell command system.
 * Provides programmatic access to all functionality.
 */

// Re-export all public APIs
export * from "./types.js";
export * from "./command-mappings.js";
export * from "./command-expansion.js";
export * from "./completion.js";

// Main API functions
export {
  expandAndRun,
  expandOnly,
  parseDotCommand,
  expandOptionsToFlags,
} from "./command-expansion.js";

export {
  getBaseCommands,
  getCommandOptions,
  mappingExists,
  getMapping,
  getMappingFlags,
  addMapping,
  removeMapping,
  getSystemStats,
} from "./command-mappings.js";

export {
  generateCompletions,
  parseCompletionInput,
  generateCompletionScript,
  getInstallationInstructions,
} from "./completion.js";

// Default configuration
export const defaultConfig = {
  showExpansion: true,
  useColors: true,
  maxCompletions: 50,
  debug: false,
} as const;

/**
 * Initialize the system (called automatically on import)
 */
import "./command-mappings.js"; // This initializes the mappings
