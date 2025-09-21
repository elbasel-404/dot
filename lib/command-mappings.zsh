#!/bin/zsh
#
# Command Mappings Module
# 
# This module defines command mappings for the dot notation system.
# Each mapping defines how a dot-notation command (e.g., "ls.all") 
# translates to actual command-line flags (e.g., "-a").
#
# Usage:
#   source lib/command-mappings.zsh
#   echo ${CMD_MAP[ls.all]}  # outputs: -a
#

# Global associative array to store command mappings
# Key format: <command>.<option>
# Value format: command line flags/options
typeset -gA CMD_MAP

#
# Initialize all command mappings
#
init_command_mappings() {
    # LS command mappings
    # Basic file listing options
    CMD_MAP[ls.all]="-a"              # Show all files including hidden (. and ..)
    CMD_MAP[ls.almost]="-A"           # Show all files except . and ..
    CMD_MAP[ls.hidden]="-a"           # Alias for ls.all
    
    # Display format options
    CMD_MAP[ls.long]="-l"             # Long listing format
    CMD_MAP[ls.human]="-lh"           # Long format with human-readable sizes
    CMD_MAP[ls.color]="--color"       # Colorized output
    
    # Sorting options
    CMD_MAP[ls.size]="-S"             # Sort by file size (largest first)
    CMD_MAP[ls.time]="-t"             # Sort by modification time (newest first)
    CMD_MAP[ls.reverse]="-r"          # Reverse sort order
    
    # TODO: Add more commands like git, grep, find, etc.
    # Example future additions:
    # CMD_MAP[git.status]="status"
    # CMD_MAP[git.branch]="branch"
    # CMD_MAP[grep.ignore]="-i"
    # CMD_MAP[find.name]="-name"
}

#
# Get all available base commands (commands before the first dot)
#
get_base_commands() {
    local base_commands=()
    for key in "${(@k)CMD_MAP}"; do
        local base_cmd="${key%%.*}"
        if [[ ! " ${base_commands[*]} " =~ " ${base_cmd} " ]]; then
            base_commands+=("$base_cmd")
        fi
    done
    printf '%s\n' "${base_commands[@]}"
}

#
# Get all options for a specific base command
# Args: $1 - base command (e.g., "ls")
#
get_command_options() {
    local base_cmd="$1"
    local options=()
    
    for key in "${(@k)CMD_MAP}"; do
        if [[ "$key" =~ ^${base_cmd}\. ]]; then
            local option="${key#*.}"
            options+=("$option")
        fi
    done
    
    printf '%s\n' "${options[@]}"
}

#
# Check if a command mapping exists
# Args: $1 - full command key (e.g., "ls.all")
# Returns: 0 if exists, 1 if not
#
mapping_exists() {
    local key="$1"
    [[ -n "${CMD_MAP[$key]}" ]]
}

#
# Get the mapping for a command key
# Args: $1 - full command key (e.g., "ls.all")
#
get_mapping() {
    local key="$1"
    echo "${CMD_MAP[$key]}"
}

# Initialize mappings when module is loaded
init_command_mappings