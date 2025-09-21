/**
 * Core TypeScript interfaces and types for the Shell Command Dot Notation System
 *
 * This module defines the fundamental data structures that replace the zsh
 * associative arrays and provide type safety for the entire system.
 */

/**
 * Represents a command mapping from dot notation to shell flags
 */
export interface CommandMapping {
  /** The command key in dot notation (e.g., "ls.all") */
  key: string;
  /** The shell flags/options this maps to (e.g., "-a") */
  flags: string;
  /** Optional description of what this mapping does */
  description?: string;
}

/**
 * Configuration for a base command (e.g., "ls", "git")
 */
export interface BaseCommand {
  /** The base command name */
  name: string;
  /** Available options for this command */
  options: Map<string, CommandMapping>;
  /** Optional description of the base command */
  description?: string;
}

/**
 * Parsed components of a dot notation command
 */
export interface ParsedCommand {
  /** The base command (e.g., "ls" from "ls.all.long") */
  baseCommand: string;
  /** Array of options (e.g., ["all", "long"] from "ls.all.long") */
  options: string[];
  /** The original input string */
  original: string;
}

/**
 * Result of expanding a dot notation command
 */
export interface ExpandedCommand {
  /** The base command to execute */
  command: string;
  /** Array of expanded flags */
  flags: string[];
  /** The complete command string that will be executed */
  fullCommand: string;
}

/**
 * Completion suggestion for tab completion
 */
export interface CompletionSuggestion {
  /** The completion text to insert */
  completion: string;
  /** Display text for the user (may differ from completion) */
  display: string;
  /** Optional description of what this completion does */
  description?: string;
}

/**
 * Context for tab completion
 */
export interface CompletionContext {
  /** The current input being completed */
  input: string;
  /** The base command being completed */
  baseCommand: string;
  /** Options already used in the chain */
  usedOptions: string[];
  /** The partial option being typed (if any) */
  partialOption?: string;
}

/**
 * Configuration options for the system
 */
export interface SystemConfig {
  /** Whether to show expanded commands before execution */
  showExpansion: boolean;
  /** Whether to use colored output */
  useColors: boolean;
  /** Maximum number of completion suggestions to show */
  maxCompletions: number;
  /** Whether to enable debug mode */
  debug: boolean;
}

/**
 * Error information for command processing
 */
export interface CommandError {
  /** Error type */
  type:
    | "UNKNOWN_COMMAND"
    | "UNKNOWN_OPTION"
    | "PARSING_ERROR"
    | "EXECUTION_ERROR";
  /** Error message */
  message: string;
  /** The input that caused the error */
  input: string;
  /** Suggestions for fixing the error */
  suggestions?: string[];
}

/**
 * Statistics about the command system
 */
export interface SystemStats {
  /** Total number of base commands */
  baseCommands: number;
  /** Total number of mappings */
  totalMappings: number;
  /** Mappings per base command */
  mappingsPerCommand: Map<string, number>;
}

/**
 * Type guard to check if a string is a valid dot notation command
 */
export function isDotNotationCommand(input: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_-]*\.[a-zA-Z][a-zA-Z0-9_.-]*$/.test(input);
}

/**
 * Type for command execution result
 */
export interface ExecutionResult {
  /** Whether the command executed successfully */
  success: boolean;
  /** Exit code from the command */
  exitCode: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** The command that was executed */
  command: string;
}

/**
 * Options for command execution
 */
export interface ExecutionOptions {
  /** Whether to show the command before executing */
  showCommand?: boolean;
  /** Working directory for command execution */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Whether to capture output */
  captureOutput?: boolean;
}
