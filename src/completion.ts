/**
 * Shell Completion Generator
 *
 * This module generates shell completion scripts for zsh and bash
 * to replace the native zsh completion from the original system.
 */

import {
  getBaseCommands,
  getCommandOptions,
  getBaseCommandMappings,
} from "./command-mappings.js";
import type { CompletionSuggestion, CompletionContext } from "./types.js";

/**
 * Generate completions for a given input context
 */
export function generateCompletions(
  context: CompletionContext
): CompletionSuggestion[] {
  const { input, baseCommand, usedOptions, partialOption } = context;
  const suggestions: CompletionSuggestion[] = [];

  // Get all available options for this base command
  const availableOptions = getCommandOptions(baseCommand);
  const mappings = getBaseCommandMappings(baseCommand);

  // Filter out already used options
  const unusedOptions = availableOptions.filter(
    (option) => !usedOptions.includes(option)
  );

  // If we have a partial option, filter by it
  const matchingOptions = partialOption
    ? unusedOptions.filter((option) => option.startsWith(partialOption))
    : unusedOptions;

  // Create suggestions
  for (const option of matchingOptions) {
    const mapping = mappings.find((m) => m.key === `${baseCommand}.${option}`);

    suggestions.push({
      completion: option,
      display: `.${option}`,
      description: mapping?.description || mapping?.flags,
    });
  }

  return suggestions;
}

/**
 * Parse completion input to understand context
 */
export function parseCompletionInput(input: string): CompletionContext {
  if (!input.includes(".")) {
    // Just a base command
    return {
      input,
      baseCommand: input,
      usedOptions: [],
      partialOption: undefined,
    };
  }

  const parts = input.split(".");
  const baseCommand = parts[0] || input;
  const options = parts.slice(1);

  // Check if last part is partial (input doesn't end with dot)
  let usedOptions: string[];
  let partialOption: string | undefined;

  if (input.endsWith(".")) {
    // Input ends with dot, all options are complete
    usedOptions = options;
    partialOption = undefined;
  } else {
    // Last option might be partial
    usedOptions = options.slice(0, -1);
    partialOption = options[options.length - 1];
  }

  return {
    input,
    baseCommand,
    usedOptions,
    partialOption,
  };
}

/**
 * Generate zsh completion script
 */
function generateZshCompletion(): string {
  const baseCommands = getBaseCommands();

  return `#compdef dot shell-dot

# Shell Command Dot Notation System - Zsh Completion
# Generated automatically - do not edit manually

_dot_completion() {
    local context state line
    local -a completions
    
    # Get current word being completed
    local current_word="\${words[CURRENT]}"
    
    # If it's a dot notation command, provide custom completions
    if [[ "\$current_word" =~ ^[a-zA-Z][a-zA-Z0-9_-]*\\. ]]; then
        # Extract base command and options
        local base_cmd="\${current_word%%.*}"
        local remaining="\${current_word#*.}"
        
        # Call Node.js completion helper
        local node_completions
        node_completions=\$(node -e "
            import('./dist/completion.js').then(mod => {
                const context = mod.parseCompletionInput('\$current_word');
                const suggestions = mod.generateCompletions(context);
                console.log(suggestions.map(s => s.display + ':' + (s.description || '')).join('\\n'));
            }).catch(() => {});
        " 2>/dev/null)
        
        if [[ -n "\$node_completions" ]]; then
            local -a suggestions
            while IFS= read -r line; do
                suggestions+=("\$line")
            done <<< "\$node_completions"
            
            _describe 'dot notation options' suggestions
            return 0
        fi
    fi
    
    # Default completions for base commands
    local -a base_commands
    base_commands=(${baseCommands.map((cmd) => `'${cmd}.:'`).join(" ")})
    
    _describe 'base commands' base_commands
}

# Register the completion function
compdef _dot_completion dot shell-dot

# Also enable completion for direct base command usage
${baseCommands.map((cmd) => `compdef _dot_completion ${cmd}`).join("\n")}`;
}

/**
 * Generate bash completion script
 */
function generateBashCompletion(): string {
  const baseCommands = getBaseCommands();

  return `# Shell Command Dot Notation System - Bash Completion  
# Generated automatically - do not edit manually

_dot_completion() {
    local cur prev opts base_commands
    
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    
    # Base commands available
    base_commands="${baseCommands.join(" ")}"
    
    # If current word contains a dot, use Node.js for smart completion
    if [[ "\$cur" == *"."* ]]; then
        # Extract completions using Node.js
        local node_completions
        node_completions=\$(node -e "
            import('./dist/completion.js').then(mod => {
                const context = mod.parseCompletionInput('\$cur');
                const suggestions = mod.generateCompletions(context);
                console.log(suggestions.map(s => s.completion).join(' '));
            }).catch(() => {});
        " 2>/dev/null)
        
        if [[ -n "\$node_completions" ]]; then
            COMPREPLY=( \$(compgen -W "\$node_completions" -- "\$cur") )
            return 0
        fi
    fi
    
    # Default completion for base commands
    case "\$prev" in
        dot|shell-dot)
            COMPREPLY=( \$(compgen -W "\$base_commands help-detailed stats list search generate-completion version" -- "\$cur") )
            ;;
        *)
            COMPREPLY=( \$(compgen -W "\$base_commands" -- "\$cur") )
            ;;
    esac
}

# Register completion for dot commands
complete -F _dot_completion dot shell-dot

# Register completion for base commands when used directly
${baseCommands.map((cmd) => `complete -F _dot_completion ${cmd}`).join("\n")}`;
}

/**
 * Generate completion script for specified shell
 */
export function generateCompletionScript(shell: string = "zsh"): string {
  switch (shell.toLowerCase()) {
    case "zsh":
      return generateZshCompletion();
    case "bash":
      return generateBashCompletion();
    default:
      throw new Error(
        `Unsupported shell: ${shell}. Supported shells: zsh, bash`
      );
  }
}

/**
 * Get installation instructions for completion
 */
export function getInstallationInstructions(shell: string = "zsh"): string {
  const scriptName = shell === "zsh" ? "_dot" : "dot-completion.bash";
  const configFile = shell === "zsh" ? "~/.zshrc" : "~/.bashrc";

  return `Installation Instructions for ${shell.toUpperCase()} Completion:

1. Generate and save the completion script:
   dot generate-completion ${shell} > ${scriptName}

2. ${
    shell === "zsh"
      ? `Move it to your zsh completions directory:
   mv ${scriptName} ~/.zsh/completions/_dot
   # or to system-wide location:
   sudo mv ${scriptName} /usr/share/zsh/site-functions/_dot`
      : `Source it in your ${configFile}:
   echo "source \$(pwd)/${scriptName}" >> ${configFile}`
  }

3. Reload your shell:
   ${shell === "zsh" ? "exec zsh" : "source ~/.bashrc"}

4. Test completion:
   dot ls.<TAB>

Note: Make sure Node.js and the dot command are available in your PATH.`;
}

/**
 * CLI entry point for completion generation
 */
export function main() {
  const shell = process.argv[2] || "zsh";

  if (shell === "--help" || shell === "-h") {
    console.log(`Usage: node completion.js [shell]

Generate shell completion scripts for the dot notation system.

Arguments:
  shell    Shell type: zsh or bash (default: zsh)
  
Examples:
  node completion.js zsh
  node completion.js bash
  
${getInstallationInstructions("zsh")}
`);
    return;
  }

  try {
    const script = generateCompletionScript(shell);
    console.log(script);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Note: main() function available for standalone execution
// To run standalone: node dist/completion.js [shell]
