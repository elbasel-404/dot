# Add this to your ~/.zshrc file

# Define command mappings
typeset -A COMMAND_CHAINS
COMMAND_CHAINS=(
    # ls command chains
    "ls.all" "-a"
    "ls.long" "-l"
    "ls.color" "--color=auto"
    "ls.human" "-h"
    "ls.reverse" "-r"
    "ls.time" "-t"
    "ls.size" "-S"
    "ls.hidden" "-A"
    "ls.recursive" "-R"
    
    # grep command chains
    "grep.ignore" "-i"
    "grep.recursive" "-r"
    "grep.line" "-n"
    "grep.count" "-c"
    "grep.invert" "-v"
    "grep.word" "-w"
    "grep.fixed" "-F"
    "grep.color" "--color=auto"
    
    # find command chains
    "find.name" "-name"
    "find.type" "-type f"
    "find.dir" "-type d"
    "find.size" "-size"
    "find.newer" "-newer"
    "find.exec" "-exec"
    
    # git command chains
    "git.status" "status"
    "git.add" "add"
    "git.commit" "commit"
    "git.push" "push"
    "git.pull" "pull"
    "git.log" "log"
    "git.diff" "diff"
    "git.branch" "branch"
    "git.checkout" "checkout"
    
    # docker command chains
    "docker.ps" "ps"
    "docker.images" "images"
    "docker.run" "run"
    "docker.exec" "exec"
    "docker.logs" "logs"
    "docker.stop" "stop"
    "docker.rm" "rm"
    
    # Add more command chains as needed
)

# Function to expand chained commands
expand_command_chain() {
    local input="$1"
    local base_cmd="${input%%.*}"
    local chains="${input#*.}"
    
    # If no chains, return original command
    if [[ "$chains" == "$input" ]]; then
        echo "$input"
        return
    fi
    
    local expanded_cmd="$base_cmd"
    local current_chain=""
    
    # Split chains by dots and process each
    while [[ -n "$chains" ]]; do
        if [[ "$chains" == *"."* ]]; then
            current_chain="${chains%%.*}"
            chains="${chains#*.}"
        else
            current_chain="$chains"
            chains=""
        fi
        
        local chain_key="${base_cmd}.${current_chain}"
        if [[ -n "${COMMAND_CHAINS[$chain_key]}" ]]; then
            expanded_cmd="$expanded_cmd ${COMMAND_CHAINS[$chain_key]}"
        else
            # If chain not found, treat as literal argument
            expanded_cmd="$expanded_cmd .$current_chain"
        fi
    done
    
    echo "$expanded_cmd"
}

# Custom widget for command expansion
expand-command-widget() {
    local expanded
    expanded=$(expand_command_chain "$LBUFFER")
    if [[ "$expanded" != "$LBUFFER" ]]; then
        LBUFFER="$expanded"
    fi
}

# Bind the expansion to Ctrl+X Ctrl+E (or change to your preference)
zle -N expand-command-widget
bindkey '^X^E' expand-command-widget

# Hook to auto-expand on enter
auto_expand_on_enter() {
    local expanded
    expanded=$(expand_command_chain "$BUFFER")
    if [[ "$expanded" != "$BUFFER" ]]; then
        BUFFER="$expanded"
    fi
    zle accept-line
}

zle -N auto_expand_on_enter
bindkey '^M' auto_expand_on_enter

# Helper functions to extract options from our COMMAND_CHAINS
get_command_options() {
    local base_cmd="$1"
    local options=()
    
    for key in ${(k)COMMAND_CHAINS}; do
        if [[ "$key" == "${base_cmd}."* ]]; then
            local option="${key#*.}"
            options+=("$option")
        fi
    done
    
    printf '%s\n' "${options[@]}"
}

get_base_commands() {
    local base_commands=()
    
    for key in ${(k)COMMAND_CHAINS}; do
        local base_cmd="${key%%.*}"
        # Add to array if not already present
        if [[ ! " ${base_commands[@]} " =~ " ${base_cmd} " ]]; then
            base_commands+=("$base_cmd")
        fi
    done
    
    printf '%s\n' "${base_commands[@]}"
}

# Core completion logic for dot-notation commands
_complete_dot_notation() {
    local current_word="$1"
    local completions=()

    # Parse the current word to understand its structure
    local base_cmd="${current_word%%.*}"
    local remaining="${current_word#*.}"

    # Handle different completion scenarios
    if [[ "$current_word" =~ ^[a-zA-Z]+\.?$ ]]; then
        # Base command completion: "ls" or "ls." -> show all ls options
        completions=($(get_base_command_completions "$current_word"))
    elif [[ "$remaining" =~ \.$ ]]; then
        # Chained completion ending with dot: "ls.all." -> show remaining options
        completions=($(get_chained_completion_after_dot "$current_word"))
    elif [[ "$remaining" =~ \. ]]; then
        # Chained option completion with partial: "ls.all.c" -> "ls.all.color"
        completions=($(get_chained_option_completions "$current_word"))
    else
        # Single option completion: "ls.a" -> "ls.all"
        completions=($(get_single_option_completions "$current_word"))
    fi

    # Return completions to zsh with clean display (showing only .option)
    if ((${#completions[@]} > 0)); then
        local display_options=()
        
        for completion in "${completions[@]}"; do
            # Extract just the option name and format as .option
            local option_name="${completion##*.}"
            display_options+=(".${option_name}")
        done
        
        # Set the prefix to what's already typed, show only .option for each choice
        local current_prefix="${current_word%.*}"
        if [[ "$current_word" =~ \.$ ]]; then
            # Current word ends with dot, prefix includes the dot
            current_prefix="$current_word"
        else
            # Current word doesn't end with dot, add one
            current_prefix="${current_prefix}."
        fi
        
        compadd -S '' -r "." -P "$current_prefix" -a display_options
    fi
}

# Get completions for base commands (e.g., "ls." -> all ls options)
get_base_command_completions() {
    local current_word="$1"
    local base_cmd="${current_word%.*}"
    local completions=()

    local options
    options=($(get_command_options "$base_cmd"))

    for option in "${options[@]}"; do
        completions+=("${base_cmd}.${option}")
    done

    printf '%s\n' "${completions[@]}"
}

# Get completions for single options (e.g., "ls.a" -> "ls.all")
get_single_option_completions() {
    local current_word="$1"
    local base_cmd="${current_word%%.*}"
    local partial_option="${current_word#*.}"
    local completions=()

    local options
    options=($(get_command_options "$base_cmd"))

    for option in "${options[@]}"; do
        # Match options that start with the partial input
        if [[ "$option" =~ ^${partial_option} ]]; then
            completions+=("${base_cmd}.${option}")
        fi
    done

    printf '%s\n' "${completions[@]}"
}

# Get completions when chain ends with dot (e.g., "ls.all." -> show remaining options)
get_chained_completion_after_dot() {
    local current_word="$1"
    local base_cmd="${current_word%%.*}"
    local remaining="${current_word#*.}"
    local existing_chain="${remaining%.}" # Remove trailing dot
    local completions=()

    # Get all available options for this base command
    local options
    options=($(get_command_options "$base_cmd"))

    # Get list of already used options in the chain
    local used_options=()
    if [[ -n "$existing_chain" ]]; then
        IFS="." read -rA used_options <<<"$existing_chain"
    fi

    # Add available options that aren't already used
    for option in "${options[@]}"; do
        # Check if this option is already in the chain
        local already_used=false
        for used in "${used_options[@]}"; do
            if [[ "$option" == "$used" ]]; then
                already_used=true
                break
            fi
        done

        # If not already used, add it as a completion
        if [[ "$already_used" == "false" ]]; then
            if [[ -n "$existing_chain" ]]; then
                completions+=("${base_cmd}.${existing_chain}.${option}")
            else
                completions+=("${base_cmd}.${option}")
            fi
        fi
    done

    printf '%s\n' "${completions[@]}"
}

# Get completions for chained options (e.g., "ls.all.c" -> "ls.all.color")
get_chained_option_completions() {
    local current_word="$1"
    local base_cmd="${current_word%%.*}"
    local remaining="${current_word#*.}"

    # Parse the existing chain and partial option
    local existing_parts=""
    local partial_option=""

    # Split by the last dot
    if [[ "$remaining" == *.* ]]; then
        existing_parts="${remaining%.*}"
        partial_option="${remaining##*.}"
    else
        # Single level: ls.a -> existing_parts="", partial_option="a"
        existing_parts=""
        partial_option="$remaining"
    fi

    local completions=()
    local options
    options=($(get_command_options "$base_cmd"))

    # Get list of already used options
    local used_options=()
    if [[ -n "$existing_parts" ]]; then
        IFS="." read -rA used_options <<<"$existing_parts"
    fi

    for option in "${options[@]}"; do
        # Skip options already in the chain
        local already_used=false
        for used in "${used_options[@]}"; do
            if [[ "$option" == "$used" ]]; then
                already_used=true
                break
            fi
        done

        # Skip if already used
        if [[ "$already_used" == "true" ]]; then
            continue
        fi

        # Match options that start with the partial input
        if [[ "$option" =~ ^${partial_option} ]]; then
            if [[ -n "$existing_parts" ]]; then
                completions+=("${base_cmd}.${existing_parts}.${option}")
            else
                completions+=("${base_cmd}.${option}")
            fi
        fi
    done

    printf '%s\n' "${completions[@]}"
}

# Completion function for direct command completion
_direct_command_completion() {
    local current_word="${words[CURRENT]}"

    # Check if current word ends with a dot or is a partial dot command
    if [[ "$current_word" =~ ^[a-zA-Z]+\..*$ ]] || [[ "$current_word" =~ \.$ ]]; then
        _complete_dot_notation "$current_word"
    else
        # Fall back to default completion
        _default
    fi
}

# Setup completion bindings
setup_completion_bindings() {
    # Register completion for direct command usage
    local base_commands
    base_commands=($(get_base_commands))

    for base_cmd in "${base_commands[@]}"; do
        compdef _direct_command_completion "$base_cmd"
    done
}

# Initialize the completion system
setup_completion_bindings

# Optional: Add a helper function to list available chains for a command
list_chains() {
    local base_cmd="$1"
    if [[ -z "$base_cmd" ]]; then
        echo "Usage: list_chains <command>"
        echo "Available base commands:"
        local -a base_commands
        for key in ${(k)COMMAND_CHAINS}; do
            local cmd="${key%%.*}"
            if [[ ! " ${base_commands[@]} " =~ " ${cmd} " ]]; then
                base_commands+=("$cmd")
            fi
        done
        echo "${(j:, :)base_commands}"
        return
    fi
    
    echo "Available chains for $base_cmd:"
    for key in ${(k)COMMAND_CHAINS}; do
        if [[ "$key" == "${base_cmd}."* ]]; then
            local chain="${key#*.}"
            local expansion="${COMMAND_CHAINS[$key]}"
            printf "  %-15s -> %s\n" "$chain" "$expansion"
        fi
    done
}

# Optional: Function to add new chains dynamically
add_chain() {
    if [[ $# -ne 2 ]]; then
        echo "Usage: add_chain <command.chain> <expansion>"
        echo "Example: add_chain ls.sort '-S'"
        return 1
    fi
    
    local chain_key="$1"
    local expansion="$2"
    COMMAND_CHAINS["$chain_key"]="$expansion"
    echo "Added chain: $chain_key -> $expansion"
}

echo "Command chaining system loaded!"
echo "Usage examples:"
echo "  ls.all.long      -> ls -a -l"
echo "  grep.ignore.line -> grep -i -n"
echo "  git.status       -> git status"
echo ""
echo "Key bindings:"
echo "  Ctrl+X Ctrl+E    -> Manually expand current command"
echo "  Enter            -> Auto-expand and execute"
echo ""
echo "Helper functions:"
echo "  list_chains [cmd] -> Show available chains"
echo "  add_chain <cmd.chain> <expansion> -> Add new chain"