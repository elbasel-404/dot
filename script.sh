#!/bin/zsh
#
# Shell Command Dot Notation System
#
# A modular system for executing commands using dot notation syntax.
# Transforms commands like "ls.all.long" into "ls -a -l" and provides
# intelligent tab completion for all available options.
#
# Features:
# - Dot notation command expansion (ls.all → ls -a)
# - Chained options (ls.all.long → ls -a -l)
# - Tab completion for all commands and options
# - Modular architecture for easy extension
# - Comprehensive error handling and validation
#
# Usage:
#   source script.sh           # Load the system
#   . ls.all                  # Execute: ls -a
#   ls.<TAB>                  # Show completions
#   help-dot                  # Show available commands
#
# Author: Shell Command Enhancement System
# Version: 2.0
#

# Get the directory where this script is located
SCRIPT_DIR="${0:A:h}"
LIB_DIR="${SCRIPT_DIR}/lib"

#
# Load all required modules
#
load_modules() {
	local modules=(
		"command-mappings.zsh"
		"command-expansion.zsh"
		"tab-completion.zsh"
	)

	echo "Loading shell command dot notation system..." >&2

	for module in "${modules[@]}"; do
		local module_file="${LIB_DIR}/${module}"

		if [[ -f "$module_file" ]]; then
			source "$module_file"
			echo "  ✓ Loaded: ${module}" >&2
		else
			echo "  ✗ Error: Module not found: ${module_file}" >&2
			return 1
		fi
	done

	echo "  ✓ All modules loaded successfully" >&2
	return 0
}

#
# Main dot function - the entry point for dot notation commands
#
# Usage: . <command.options>
# Example: . ls.all.long
#
.() {
	if [[ $# -eq 0 ]]; then
		echo "Dot notation command system"
		echo
		echo "Usage: . <command.options>"
		echo "Example: . ls.all.long"
		echo
		echo "For help: help-dot"
		return 0
	fi

	expand_and_run "$@"
}

#
# Help function to show available commands and usage
#
help-dot() {
	echo "Shell Command Dot Notation System"
	echo "================================"
	echo
	echo "This system allows you to use dot notation for command shortcuts:"
	echo "  . ls.all        →  ls -a"
	echo "  . ls.all.long   →  ls -a -l"
	echo "  . ls.human      →  ls -lh"
	echo
	echo "🔗 Advanced Chaining:"
	echo "  . ls.all.long.color.time  →  ls -a -l --color -t"
	echo "  Chain as many options as you want!"
	echo
	echo "Features:"
	echo "  • Modular Tab Completion: Type 'ls.all.' and press TAB for remaining options"
	echo "  • Intelligent Chaining: Already used options are automatically excluded"
	echo "  • Partial Matching: Type 'ls.all.c' + TAB → 'ls.all.color'"
	echo "  • Error validation: Unknown options are caught with suggestions"
	echo
	show_available_commands
	echo
	echo "Tab Completion Examples:"
	echo "  ls.<TAB>             Show all ls options"
	echo "  ls.a<TAB>            Complete options starting with 'a'"
	echo "  ls.all.<TAB>         Show remaining options to chain"
	echo "  ls.all.c<TAB>        Complete to 'ls.all.color'"
	echo "  ls.all.long.<TAB>    Show options excluding 'all' and 'long'"
	echo
	echo "System Commands:"
	echo "  help-dot         Show this help"
	echo "  dot-stats        Show completion statistics"
	echo "  dot-version      Show version information"
}

#
# Show system statistics
#
dot-stats() {
	echo "Shell Command Dot Notation System Statistics"
	echo "==========================================="
	echo
	show_completion_stats
}

#
# Show version information
#
dot-version() {
	echo "Shell Command Dot Notation System v2.0"
	echo "Modular architecture with enhanced completion"
	echo "Loaded modules: command-mappings, command-expansion, tab-completion"
}

#
# Initialize the system
#
init_dot_system() {
	# Load all modules
	if ! load_modules; then
		echo "Failed to load modules. System not initialized." >&2
		return 1
	fi

	# Setup tab completion
	setup_completion_bindings

	echo "  ✓ Tab completion configured" >&2
	echo "  ✓ System ready! Type 'help-dot' for usage information" >&2
	echo >&2
}

# Initialize the system when script is sourced
init_dot_system
