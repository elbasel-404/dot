/**
 * Command Mappings Module
 *
 * This module defines command mappings for the dot notation system.
 * It replaces the zsh associative array CMD_MAP with TypeScript Maps and objects.
 * Each mapping defines how a dot-notation command (e.g., "ls.all")
 * translates to actual command-line flags (e.g., "-a").
 */

import type { CommandMapping, BaseCommand, SystemStats } from "./types.js";

/**
 * Global map of all command mappings
 * Key format: <command>.<option>
 * Value: CommandMapping object
 */
const commandMappings = new Map<string, CommandMapping>();

/**
 * Map of base commands to their configurations
 */
const baseCommands = new Map<string, BaseCommand>();

/**
 * Initialize all command mappings
 */
export function initializeCommandMappings(): void {
  // Clear existing mappings
  commandMappings.clear();
  baseCommands.clear();

  // Initialize LS command mappings
  initializeLsCommands();

  // TODO: Add more commands like git, grep, find, etc.
  // initializeGitCommands();
  // initializeGrepCommands();
  // initializeFindCommands();
}

/**
 * Initialize LS command mappings
 */
function initializeLsCommands(): void {
  const lsOptions = new Map<string, CommandMapping>();

  // Basic file listing options
  const lsMappings: CommandMapping[] = [
    {
      key: "ls.all",
      flags: "-a",
      description: "Show all files including hidden (. and ..)",
    },
    {
      key: "ls.almost",
      flags: "-A",
      description: "Show all files except . and ..",
    },
    { key: "ls.hidden", flags: "-a", description: "Alias for ls.all" },

    // Display format options
    { key: "ls.long", flags: "-l", description: "Long listing format" },
    {
      key: "ls.human",
      flags: "-lh",
      description: "Long format with human-readable sizes",
    },
    { key: "ls.color", flags: "--color", description: "Colorized output" },

    // Sorting options
    {
      key: "ls.size",
      flags: "-S",
      description: "Sort by file size (largest first)",
    },
    {
      key: "ls.time",
      flags: "-t",
      description: "Sort by modification time (newest first)",
    },
    { key: "ls.reverse", flags: "-r", description: "Reverse sort order" },
  ];

  // Add all ls mappings
  for (const mapping of lsMappings) {
    commandMappings.set(mapping.key, mapping);
    const optionName = mapping.key.split(".")[1];
    if (optionName) {
      lsOptions.set(optionName, mapping);
    }
  }

  // Create base command
  const lsCommand: BaseCommand = {
    name: "ls",
    options: lsOptions,
    description: "List directory contents with various formatting options",
  };

  baseCommands.set("ls", lsCommand);
}

/**
 * Get all available base commands
 */
export function getBaseCommands(): string[] {
  return Array.from(baseCommands.keys());
}

/**
 * Get all options for a specific base command
 */
export function getCommandOptions(baseCommand: string): string[] {
  const command = baseCommands.get(baseCommand);
  if (!command) {
    return [];
  }
  return Array.from(command.options.keys());
}

/**
 * Check if a command mapping exists
 */
export function mappingExists(key: string): boolean {
  return commandMappings.has(key);
}

/**
 * Get the mapping for a command key
 */
export function getMapping(key: string): CommandMapping | undefined {
  return commandMappings.get(key);
}

/**
 * Get the flags for a command key
 */
export function getMappingFlags(key: string): string | undefined {
  const mapping = commandMappings.get(key);
  return mapping?.flags;
}

/**
 * Get all mappings for a base command
 */
export function getBaseCommandMappings(baseCommand: string): CommandMapping[] {
  const result: CommandMapping[] = [];
  for (const [key, mapping] of commandMappings) {
    if (key.startsWith(`${baseCommand}.`)) {
      result.push(mapping);
    }
  }
  return result;
}

/**
 * Add a new command mapping
 */
export function addMapping(
  key: string,
  flags: string,
  description?: string
): void {
  const mapping: CommandMapping = { key, flags, description };
  commandMappings.set(key, mapping);

  // Update base command if it exists
  const [baseCmd, option] = key.split(".", 2);
  if (baseCmd && option) {
    const baseCommand = baseCommands.get(baseCmd);
    if (baseCommand) {
      baseCommand.options.set(option, mapping);
    }
  }
}

/**
 * Remove a command mapping
 */
export function removeMapping(key: string): boolean {
  const existed = commandMappings.delete(key);

  if (existed) {
    // Remove from base command options too
    const [baseCmd, option] = key.split(".", 2);
    if (baseCmd && option) {
      const baseCommand = baseCommands.get(baseCmd);
      if (baseCommand) {
        baseCommand.options.delete(option);
      }
    }
  }

  return existed;
}

/**
 * Get system statistics
 */
export function getSystemStats(): SystemStats {
  const mappingsPerCommand = new Map<string, number>();

  for (const [baseCmd, command] of baseCommands) {
    mappingsPerCommand.set(baseCmd, command.options.size);
  }

  return {
    baseCommands: baseCommands.size,
    totalMappings: commandMappings.size,
    mappingsPerCommand,
  };
}

/**
 * Get all available mappings (for debugging/inspection)
 */
export function getAllMappings(): Map<string, CommandMapping> {
  return new Map(commandMappings);
}

/**
 * Search for mappings by pattern
 */
export function searchMappings(pattern: string): CommandMapping[] {
  const regex = new RegExp(pattern, "i");
  const results: CommandMapping[] = [];

  for (const mapping of commandMappings.values()) {
    if (
      regex.test(mapping.key) ||
      regex.test(mapping.flags) ||
      (mapping.description && regex.test(mapping.description))
    ) {
      results.push(mapping);
    }
  }

  return results;
}

/**
 * Validate that all mappings are properly formed
 */
export function validateMappings(): string[] {
  const errors: string[] = [];

  for (const [key, mapping] of commandMappings) {
    // Check key format
    if (!key.includes(".")) {
      errors.push(`Invalid key format: ${key} (must contain dot)`);
    }

    // Check if key matches mapping.key
    if (key !== mapping.key) {
      errors.push(
        `Key mismatch: Map key "${key}" !== mapping.key "${mapping.key}"`
      );
    }

    // Check if flags are not empty
    if (!mapping.flags.trim()) {
      errors.push(`Empty flags for mapping: ${key}`);
    }
  }

  return errors;
}

// Initialize mappings when module is imported
initializeCommandMappings();
