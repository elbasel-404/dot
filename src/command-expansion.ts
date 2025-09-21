/**
 * Command Expansion Module
 *
 * This module handles the expansion and execution of dot-notation commands.
 * It takes input like "ls.all.long" and expands it to "ls -a -l" before execution.
 * Uses zx for shell command execution with proper error handling.
 */

import { $ } from "zx";
import type {
  ParsedCommand,
  ExpandedCommand,
  ExecutionResult,
  ExecutionOptions,
  CommandError,
} from "./types.js";
import {
  mappingExists,
  getMappingFlags,
  getCommandOptions,
} from "./command-mappings.js";

/**
 * Parse a dot-notation command into its components
 */
export function parseDotCommand(input: string): ParsedCommand {
  if (!input.includes(".")) {
    throw new Error(`Not a dot-notation command: ${input}`);
  }

  // Extract base command (part before first dot)
  const firstDotIndex = input.indexOf(".");
  const baseCommand = input.substring(0, firstDotIndex);

  // Extract and split option parts
  const optionsString = input.substring(firstDotIndex + 1);
  const options = optionsString ? optionsString.split(".") : [];

  return {
    baseCommand,
    options,
    original: input,
  };
}

/**
 * Expand dot-notation options to command-line flags
 */
export function expandOptionsToFlags(parsed: ParsedCommand): ExpandedCommand {
  const { baseCommand, options } = parsed;
  const flags: string[] = [];
  const errors: string[] = [];

  for (const option of options) {
    const mappingKey = `${baseCommand}.${option}`;

    if (mappingExists(mappingKey)) {
      const flagsString = getMappingFlags(mappingKey);
      if (flagsString) {
        // Split flags by spaces and add to array
        const optionFlags = flagsString.trim().split(/\s+/);
        flags.push(...optionFlags);
      }
    } else {
      errors.push(`Unknown option '${option}' for command '${baseCommand}'`);
    }
  }

  if (errors.length > 0) {
    const availableOptions = getCommandOptions(baseCommand);
    const error: CommandError = {
      type: "UNKNOWN_OPTION",
      message: errors.join(", "),
      input: parsed.original,
      suggestions: availableOptions,
    };
    throw error;
  }

  const fullCommand = [baseCommand, ...flags].join(" ");

  return {
    command: baseCommand,
    flags,
    fullCommand,
  };
}

/**
 * Validate that a base command exists on the system
 */
export async function validateBaseCommand(command: string): Promise<boolean> {
  try {
    // Use 'which' or 'command -v' to check if command exists
    await $`command -v ${command}`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute an expanded command using zx
 */
export async function executeCommand(
  expanded: ExpandedCommand,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const {
    showCommand = true,
    cwd = process.cwd(),
    env = process.env,
    captureOutput = false,
  } = options;

  // Show the expanded command for transparency
  if (showCommand) {
    console.error(`+ ${expanded.fullCommand}`);
  }

  try {
    // Set up zx options
    const originalQuiet = $.quiet;
    const originalCwd = process.cwd();

    if (captureOutput) {
      $.quiet = true;
    }

    // Change to specified working directory if provided
    if (cwd !== process.cwd()) {
      process.chdir(cwd);
    }

    // Set environment variables
    const originalEnv = process.env;
    Object.assign(process.env, env);

    // Execute the command using Node.js child_process for proper argument handling
    const { spawn } = await import("child_process");

    // Use child_process spawn for proper argument handling
    const childProcess = spawn(expanded.command, expanded.flags, {
      stdio: "inherit",
      shell: false,
    });

    // Wait for the process to complete
    const result = await new Promise<ExecutionResult>((resolve) => {
      childProcess.on("close", (code) => {
        resolve({
          success: code === 0,
          exitCode: code || 0,
          stdout: "", // stdio: 'inherit' means we don't capture
          stderr: "",
          command: expanded.fullCommand,
        });
      });

      childProcess.on("error", (error) => {
        resolve({
          success: false,
          exitCode: 1,
          stdout: "",
          stderr: error.message,
          command: expanded.fullCommand,
        });
      });
    });

    // Restore original settings
    $.quiet = originalQuiet;
    process.chdir(originalCwd);
    process.env = originalEnv;

    return result;
  } catch (error: any) {
    // Restore settings in case of error
    const originalQuiet = $.quiet;
    const originalCwd = process.cwd();
    $.quiet = originalQuiet;
    process.chdir(originalCwd);

    return {
      success: false,
      exitCode: error.exitCode || 1,
      stdout: error.stdout || "",
      stderr: error.stderr || error.message || "Unknown error",
      command: expanded.fullCommand,
    };
  }
}

/**
 * Main function: expand and run a dot-notation command
 */
export async function expandAndRun(
  input: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  try {
    // Validate input
    if (!input) {
      const error: CommandError = {
        type: "PARSING_ERROR",
        message: "No command provided",
        input: "",
        suggestions: [
          "Usage: expandAndRun <command.options>",
          'Example: expandAndRun("ls.all.long")',
        ],
      };
      throw error;
    }

    // Check if input contains dots (is a dot-notation command)
    if (!input.includes(".")) {
      const error: CommandError = {
        type: "PARSING_ERROR",
        message: `'${input}' is not a dot-notation command`,
        input,
        suggestions: [
          "Dot-notation commands must contain at least one dot (e.g., ls.all)",
        ],
      };
      throw error;
    }

    // Parse the command
    const parsed = parseDotCommand(input);

    // Validate base command exists
    const commandExists = await validateBaseCommand(parsed.baseCommand);
    if (!commandExists) {
      const error: CommandError = {
        type: "UNKNOWN_COMMAND",
        message: `Command '${parsed.baseCommand}' not found`,
        input,
        suggestions: ["Make sure the command is installed and in your PATH"],
      };
      throw error;
    }

    // Expand options to flags
    const expanded = expandOptionsToFlags(parsed);

    // Execute the expanded command
    return await executeCommand(expanded, options);
  } catch (error: any) {
    // Handle CommandError objects
    if (error.type) {
      return {
        success: false,
        exitCode: 1,
        stdout: "",
        stderr: `Error: ${error.message}\\n${
          error.suggestions ? error.suggestions.join("\\n") : ""
        }`,
        command: input,
      };
    }

    // Handle other errors
    return {
      success: false,
      exitCode: 1,
      stdout: "",
      stderr: `Unexpected error: ${error.message || error}`,
      command: input,
    };
  }
}

/**
 * Dry run: expand command without executing
 */
export function expandOnly(input: string): ExpandedCommand {
  const parsed = parseDotCommand(input);
  return expandOptionsToFlags(parsed);
}

/**
 * Show available commands and their options
 */
export function showAvailableCommands(): string {
  const {
    getBaseCommands,
    getBaseCommandMappings,
  } = require("./command-mappings.js");
  const baseCommands = getBaseCommands();

  let output = "Available commands and options:\\n\\n";

  for (const baseCmd of baseCommands) {
    output += `  ${baseCmd}:\\n`;
    const mappings = getBaseCommandMappings(baseCmd);

    for (const mapping of mappings) {
      const option = mapping.key.split(".")[1];
      output += `    ${option.padEnd(12)} -> ${mapping.flags}`;
      if (mapping.description) {
        output += ` (${mapping.description})`;
      }
      output += "\\n";
    }
    output += "\\n";
  }

  return output;
}
