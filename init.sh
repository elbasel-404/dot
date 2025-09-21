# Dot notation function for the new TypeScript system
function . {
    if [[ $# -eq 0 ]]; then
        echo "Usage: . <command.options>"
        echo "Example: . ls.all.long"
        return 1
    fi
    
    # Call the TypeScript CLI
    bun --cwd=/home/elbasel/shell.cmd start run "$@"
}

# Enable completion for the dot function
function _dot_wrapper_completion {
    # Generate completions using the TypeScript system
    local completions
    completions=$(bun --cwd=/home/elbasel/shell.cmd start generate-completion zsh 2>/dev/null | grep -A 100 '_dot_completion()' | grep -B 100 '^}$')
    
    # Use the generated completion function
    eval "$completions"
    _dot_completion
}

# Register the completion
compdef _dot_wrapper_completion .