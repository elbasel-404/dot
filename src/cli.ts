#!/usr/bin/env node

/**
 * CLI Interface for Shell Command Dot Notation System
 *
 * Main entry point that replaces the zsh dot function.
 * Handles argument parsing and command routing using Commander.js.
 */

import { Command } from "commander";
import {
  expandAndRun,
  expandOnly,
  showAvailableCommands,
} from "./command-expansion.js";
import {
  getSystemStats,
  getBaseCommands,
  searchMappings,
} from "./command-mappings.js";
import { generateCompletionScript } from "./completion.js";
import type { ExecutionOptions } from "./types.js";

const program = new Command();

// Package information
program
  .name("dot")
  .description(
    "Shell command dot notation system - Transform ls.all.long to ls -a -l"
  )
  .version("2.0.0")
  .allowUnknownOption(true);

/**
 * Run dot command - execute dot notation commands
 */
program
  .command("run <command>")
  .description("Execute a dot notation command (e.g., ls.all.long)")
  .option("-d, --dry-run", "Show expanded command without executing")
  .option("-q, --quiet", "Don't show the expanded command before execution")
  .option("--cwd <path>", "Working directory for command execution")
  .option("--capture", "Capture output instead of showing it")
  .action(async (command: string, options: any) => {
    const executionOptions: ExecutionOptions = {
      showCommand: !options.quiet,
      cwd: options.cwd,
      captureOutput: options.capture,
    };

    if (options.dryRun) {
      try {
        const expanded = expandOnly(command);
        console.log(`Would execute: ${expanded.fullCommand}`);
        console.log(`Command: ${expanded.command}`);
        console.log(`Flags: ${expanded.flags.join(" ")}`);
      } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
    } else {
      const result = await expandAndRun(command, executionOptions);

      if (options.capture) {
        // In capture mode, output the results in a structured way
        console.log(
          JSON.stringify(
            {
              success: result.success,
              exitCode: result.exitCode,
              stdout: result.stdout,
              stderr: result.stderr,
              command: result.command,
            },
            null,
            2
          )
        );
      } else {
        // In normal mode, zx handles the output display
        // Just handle the exit code
        process.exit(result.exitCode);
      }
    }
  });

// No default action - let Commander.js handle subcommands properly

/**
 * Help command - show available commands and usage
 */
program
  .command("help-detailed")
  .description("Show comprehensive help and available commands")
  .action(() => {
    console.log(`Shell Command Dot Notation System v2.0.0
================================

This system allows you to use dot notation for command shortcuts:
  dot ls.all        →  ls -a
  dot ls.all.long   →  ls -a -l
  dot ls.human      →  ls -lh

🔗 Advanced Chaining:
  dot ls.all.long.color.time  →  ls -a -l --color -t
  Chain as many options as you want!

Features:
• Intelligent expansion: Converts dot notation to proper flags
• Error validation: Unknown options are caught with suggestions  
• Modular architecture: Easy to extend with new commands
• Cross-platform: Works on any system with Node.js

`);

    console.log(showAvailableCommands());

    console.log(`
System Commands:
  dot help-detailed    Show this comprehensive help
  dot stats           Show system statistics
  dot list            List all available base commands
  dot search <term>   Search for commands/options
  dot generate-completion  Generate shell completion scripts

Examples:
  dot ls.all          # List all files including hidden
  dot ls.all.long     # List all files in long format  
  dot ls.human.color  # Human-readable sizes with colors
  dot --dry-run ls.all.long  # Show what would be executed
  dot --quiet ls.all  # Execute without showing expanded command
`);
  });

/**
 * Stats command - show system statistics
 */
program
  .command("stats")
  .description("Show system statistics")
  .action(() => {
    console.log("Shell Command Dot Notation System Statistics");
    console.log("===========================================\\n");

    const stats = getSystemStats();
    console.log(`Base commands: ${stats.baseCommands}`);
    console.log(`Total mappings: ${stats.totalMappings}\\n`);

    console.log("Mappings per command:");
    for (const [command, count] of stats.mappingsPerCommand) {
      console.log(`  ${command.padEnd(10)}: ${count} options`);
    }
  });

/**
 * List command - show all base commands
 */
program
  .command("list")
  .description("List all available base commands")
  .action(() => {
    const baseCommands = getBaseCommands();
    console.log("Available base commands:");
    for (const command of baseCommands) {
      console.log(`  ${command}`);
    }
    console.log(`\\nTotal: ${baseCommands.length} commands`);
  });

/**
 * Search command - search for mappings
 */
program
  .command("search <term>")
  .description(
    "Search for commands, options, or descriptions containing the term"
  )
  .action((term: string) => {
    const results = searchMappings(term);

    if (results.length === 0) {
      console.log(`No results found for: ${term}`);
      return;
    }

    console.log(`Search results for: ${term}\\n`);
    for (const mapping of results) {
      console.log(`  ${mapping.key.padEnd(20)} -> ${mapping.flags}`);
      if (mapping.description) {
        console.log(`    ${mapping.description}`);
      }
    }
    console.log(`\\nFound ${results.length} result(s)`);
  });

/**
 * Generate completion command - create shell completion scripts
 */
program
  .command("generate-completion")
  .description("Generate shell completion script (zsh or bash)")
  .argument("[shell]", "Shell type: zsh or bash", "zsh")
  .action(async (shell: string) => {
    try {
      const script = generateCompletionScript(shell);
      console.log(script);
    } catch (error) {
      console.error("Error generating completion script:", error);
      process.exit(1);
    }
  });

/**
 * Version command override to show more details
 */
program
  .command("version")
  .description("Show version and system information")
  .action(() => {
    console.log(`Shell Command Dot Notation System v2.0.0
Built with TypeScript and zx
Node.js ${process.version}
Platform: ${process.platform}

Repository: https://github.com/your-org/shell-cmd-dot
License: MIT`);
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code === "commander.help") {
    // Help was shown, exit normally
    process.exit(0);
  } else if (error.code === "commander.version") {
    // Version was shown, exit normally
    process.exit(0);
  } else {
    console.error(`CLI Error: ${error.message}`);
    process.exit(1);
  }
}
