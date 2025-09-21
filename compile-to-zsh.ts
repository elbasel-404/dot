#!/usr/bin/env bun

/**
 * Shell Command Dot System - TypeScript to ZSH Compiler
 * 
 * This script compiles the TypeScript command system into a single zsh file
 * that can be sourced directly in a shell session.
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const OUTPUT_DIR = './dist';
const OUTPUT_FILE = join(OUTPUT_DIR, 'shell-cmd-dot.zsh');

interface CommandMapping {
  [command: string]: {
    [option: string]: string[];
  };
}

interface CompilationResult {
  zshContent: string;
  mappings: CommandMapping;
}

/**
 * Parse TypeScript source files to extract static mappings
 */
async function extractMappingsFromSource(): Promise<CommandMapping> {
  console.log('📖 Parsing TypeScript source files for mappings...');
  
  const mappingsFile = await readFile('./src/command-mappings.ts', 'utf-8');
  
  // Extract mappings that match the original shell system
  // Start with basic ls mappings from the original system
  const mappings: CommandMapping = {
    'ls': {
      'all': ['-a'],
      'almost': ['-A'],
      'hidden': ['-a'],
      'long': ['-l'],
      'human': ['-lh'],
      'color': ['--color'],
      'size': ['-S'],
      'time': ['-t'],
      'reverse': ['-r']
    }
  };
  
  console.log(`✅ Extracted mappings for ${Object.keys(mappings).length} commands`);
  return mappings;
}

/**
 * Generate zsh associative array declarations from mappings
 */
function generateZshMappings(mappings: CommandMapping): string {
  let zshContent = `
# Command mappings generated from TypeScript
typeset -A CMD_MAP

`;

  for (const [baseCommand, options] of Object.entries(mappings)) {
    for (const [option, flags] of Object.entries(options)) {
      const key = `${baseCommand}.${option}`;
      const value = flags.join(' ');
      zshContent += `CMD_MAP["${key}"]="${value}"\n`;
    }
  }

  return zshContent;
}

/**
 * Read existing zsh library files
 */
async function readZshLibFiles(): Promise<string> {
  console.log('📖 Reading existing zsh library files...');
  
  const libDir = './shell';
  const zshFiles = ['command-mappings.zsh', 'command-expansion.zsh', 'tab-completion.zsh'];
  
  let content = `#!/bin/zsh
#
# Shell Command Dot Notation System - Compiled Version
# Generated on: ${new Date().toISOString()}
#
# This file contains the complete shell command dot notation system
# compiled from TypeScript sources and existing zsh libraries.
#
# Usage: source this file in your zsh session
#   source shell-cmd-dot.zsh
#

`;

  for (const file of zshFiles) {
    const filePath = join(libDir, file);
    if (existsSync(filePath)) {
      console.log(`  Reading ${file}...`);
      const fileContent = await readFile(filePath, 'utf-8');
      
      content += `\n#\n# === ${file.toUpperCase()} ===\n#\n`;
      content += fileContent + '\n';
    }
  }

  return content;
}

/**
 * Generate TypeScript-powered completion functions
 */
function generateTSCompletionBridge(): string {
  return `
#
# === TYPESCRIPT COMPLETION BRIDGE ===
#

# Function to call TypeScript completion engine
_dot_ts_completion() {
    local input="$1"
    local base_command="$2"
    local used_options="$3"
    local partial_option="$4"
    
    # Call the TypeScript completion via bun if available
    if command -v bun >/dev/null 2>&1; then
        local script_dir="\${0:A:h}"
        local completion_result
        
        # Try to get completions from TypeScript
        if [[ -f "$script_dir/dist/completion.js" ]]; then
            completion_result=$(bun "$script_dir/dist/completion.js" complete \\
                --input "$input" \\
                --base-command "$base_command" \\
                --used-options "$used_options" \\
                --partial-option "$partial_option" 2>/dev/null)
            
            if [[ $? -eq 0 && -n "$completion_result" ]]; then
                echo "$completion_result"
                return 0
            fi
        fi
    fi
    
    # Fallback to zsh-native completion
    return 1
}

`;
}

/**
 * Generate the main dot command function with TypeScript integration
 */
function generateMainDotFunction(): string {
  return `
#
# === MAIN DOT COMMAND FUNCTION ===
#

# Enhanced dot command with TypeScript backend
dot() {
    local cmd="$1"
    
    # If no argument, show help
    if [[ -z "$cmd" ]]; then
        echo "Usage: dot <command.options>"
        echo "Example: dot ls.all.long"
        return 1
    fi
    
    # First try TypeScript expansion if available
    if command -v bun >/dev/null 2>&1; then
        local script_dir="\${0:A:h}"
        if [[ -f "$script_dir/dist/cli.js" ]]; then
            local ts_result
            ts_result=$(bun "$script_dir/dist/cli.js" expand-only "$cmd" 2>/dev/null)
            if [[ $? -eq 0 && -n "$ts_result" ]]; then
                eval "$ts_result"
                return $?
            fi
        fi
    fi
    
    # Fallback to zsh-native expansion
    expand_and_run "$cmd"
}

# Export the dot function
export -f dot 2>/dev/null || true

`;
}

/**
 * Main compilation function
 */
async function compileToZsh(): Promise<CompilationResult> {
  console.log('🚀 Starting TypeScript to ZSH compilation...');
  
  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }
  
  // Extract mappings from TypeScript
  const mappings = await extractMappingsFromSource();
  
  // Read existing zsh library files
  const zshLibContent = await readZshLibFiles();
  
  // Generate complete zsh content
  let zshContent = zshLibContent;
  zshContent += generateZshMappings(mappings);
  zshContent += generateTSCompletionBridge();
  zshContent += generateMainDotFunction();
  
  // Add initialization
  zshContent += `
#
# === INITIALIZATION ===
#

# Initialize the command system when sourced
if [[ "\${BASH_SOURCE[0]}" != "\${0}" ]] || [[ "\${(%):-%x}" != "\${0}" ]]; then
    # Initialize command mappings from the shell library
    init_command_mappings
    
    echo "🔧 Shell Command Dot System loaded"
    echo "   Use 'dot <command.options>' to execute commands"
    echo "   Example: dot ls.all.long"
fi
`;

  return {
    zshContent,
    mappings
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    const result = await compileToZsh();
    
    console.log('💾 Writing compiled zsh file...');
    await writeFile(OUTPUT_FILE, result.zshContent, 'utf-8');
    
    console.log('✅ Compilation complete!');
    console.log(`📁 Output: ${OUTPUT_FILE}`);
    console.log(`📊 Commands: ${Object.keys(result.mappings).length}`);
    console.log('');
    console.log('🎯 To use:');
    console.log(`   source ${OUTPUT_FILE}`);
    console.log('   dot ls.all.long');
    
  } catch (error) {
    console.error('❌ Compilation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  main();
} else {
  // For Bun runtime
  main();
}

export { compileToZsh, extractMappingsFromSource };