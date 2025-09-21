#!/bin/zsh
#
# Command Expansion Module
#
# This module handles the expansion and execution of dot-notation commands.
# It takes input like "ls.all.long" and expands it to "ls -a -l" before execution.
#
# The expansion process:
# 1. Parse the base command (part before first dot)
# 2. Split the remaining parts by dots
# 3. Look up each part in the command mappings
# 4. Combine all flags and execute the command
#
# Usage:
#   source lib/command-expansion.zsh
#   expand_and_run "ls.all.long"  # Executes: ls -a -l
#

#
# Parse a dot-notation command into its components
# Args: $1 - input command (e.g., "ls.all.long")
# Sets global variables: PARSED_BASE_CMD, PARSED_OPTIONS
#
parse_dot_command() {
    local input="$1"
    
    # Extract base command (part before first dot)
    PARSED_BASE_CMD="${input%%.*}"
    
    # Extract and split option parts
    local parts="${input#"$PARSED_BASE_CMD"}"
    parts="${parts#.}"  # Remove leading dot
    
    # Split by dots into array
    if [[ -n "$parts" ]]; then
        IFS="." read -rA PARSED_OPTIONS <<< "$parts"
    else
        PARSED_OPTIONS=()
    fi
}

#
# Expand dot-notation options to command-line flags
# Uses: PARSED_BASE_CMD, PARSED_OPTIONS (set by parse_dot_command)
# Sets: EXPANDED_FLAGS array
#
expand_options_to_flags() {
    EXPANDED_FLAGS=()
    
    for option in "${PARSED_OPTIONS[@]}"; do
        local mapping_key="${PARSED_BASE_CMD}.${option}"
        
        if mapping_exists "$mapping_key"; then
            # Use zsh parameter expansion to split the mapping value
            # This handles cases where mapping contains multiple flags
            local mapping_val="$(get_mapping "$mapping_key")"
            EXPANDED_FLAGS+=($=mapping_val)
        else
            echo "Error: Unknown option '$option' for command '$PARSED_BASE_CMD'" >&2
            echo "Available options:" >&2
            get_command_options "$PARSED_BASE_CMD" | sed 's/^/  /' >&2
            return 1
        fi
    done
    
    return 0
}

#
# Execute a command with its expanded flags
# Uses: PARSED_BASE_CMD, EXPANDED_FLAGS
#
execute_expanded_command() {
    # Show the expanded command for transparency
    echo "+ $PARSED_BASE_CMD ${EXPANDED_FLAGS[*]}" >&2
    
    # Execute the command
    "$PARSED_BASE_CMD" "${EXPANDED_FLAGS[@]}"
}

#
# Main function: expand and run a dot-notation command
# Args: $1 - dot-notation command (e.g., "ls.all.long")
#
expand_and_run() {
    local input="$1"
    
    # Validate input
    if [[ -z "$input" ]]; then
        echo "Error: No command provided" >&2
        echo "Usage: expand_and_run <command.options>" >&2
        echo "Example: expand_and_run ls.all.long" >&2
        return 1
    fi
    
    # Check if input contains dots (is a dot-notation command)
    if [[ "$input" != *.* ]]; then
        echo "Error: '$input' is not a dot-notation command" >&2
        echo "Dot-notation commands must contain at least one dot (e.g., ls.all)" >&2
        return 1
    fi
    
    # Parse the command
    parse_dot_command "$input"
    
    # Validate base command exists
    if ! command -v "$PARSED_BASE_CMD" >/dev/null 2>&1; then
        echo "Error: Command '$PARSED_BASE_CMD' not found" >&2
        return 1
    fi
    
    # Expand options to flags
    if ! expand_options_to_flags; then
        return 1
    fi
    
    # Execute the expanded command
    execute_expanded_command
}

#
# Show available commands and their options
#
show_available_commands() {
    echo "Available commands and options:"
    echo
    
    local base_commands
    base_commands=($(get_base_commands))
    
    for base_cmd in "${base_commands[@]}"; do
        echo "  $base_cmd:"
        local options
        options=($(get_command_options "$base_cmd"))
        
        for option in "${options[@]}"; do
            local mapping_key="${base_cmd}.${option}"
            printf "    %-12s -> %s\n" "$option" "$(get_mapping "$mapping_key")"
        done
        echo
    done
}