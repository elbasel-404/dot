#!/bin/zsh
#
# Example Extensions for Shell Command Dot Notation System
#
# This file demonstrates how to extend the system with new commands.
# To use these extensions, source this file after loading the main system:
#   source script.sh
#   source examples/extensions.zsh
#

#
# Git Command Extensions
#
extend_git_commands() {
    echo "Loading Git extensions..." >&2
    
    # Basic git commands
    CMD_MAP[git.status]="status"
    CMD_MAP[git.add]="add ."
    CMD_MAP[git.commit]="commit"
    CMD_MAP[git.push]="push"
    CMD_MAP[git.pull]="pull"
    CMD_MAP[git.fetch]="fetch"
    
    # Git log variations
    CMD_MAP[git.log]="log --oneline"
    CMD_MAP[git.graph]="log --oneline --graph"
    CMD_MAP[git.recent]="log --oneline -10"
    
    # Git branch operations
    CMD_MAP[git.branch]="branch"
    CMD_MAP[git.branches]="branch -a"
    CMD_MAP[git.checkout]="checkout"
    
    # Git diff variations
    CMD_MAP[git.diff]="diff"
    CMD_MAP[git.staged]="diff --cached"
    CMD_MAP[git.summary]="diff --stat"
    
    echo "  ✓ Git extensions loaded" >&2
}

#
# Docker Command Extensions
#
extend_docker_commands() {
    echo "Loading Docker extensions..." >&2
    
    # Container management
    CMD_MAP[docker.ps]="ps"
    CMD_MAP[docker.all]="ps -a"
    CMD_MAP[docker.running]="ps --filter status=running"
    CMD_MAP[docker.stop]="stop"
    CMD_MAP[docker.start]="start"
    CMD_MAP[docker.restart]="restart"
    
    # Image management  
    CMD_MAP[docker.images]="images"
    CMD_MAP[docker.pull]="pull"
    CMD_MAP[docker.build]="build"
    CMD_MAP[docker.rmi]="rmi"
    
    # System commands
    CMD_MAP[docker.clean]="system prune -f"
    CMD_MAP[docker.info]="info"
    CMD_MAP[docker.version]="version"
    
    echo "  ✓ Docker extensions loaded" >&2
}

#
# Find Command Extensions  
#
extend_find_commands() {
    echo "Loading Find extensions..." >&2
    
    # File type searches
    CMD_MAP[find.name]="-name"
    CMD_MAP[find.type]="-type f"
    CMD_MAP[find.dir]="-type d"
    CMD_MAP[find.exec]="-exec"
    
    # Size searches
    CMD_MAP[find.large]="-size +10M"
    CMD_MAP[find.empty]="-empty"
    CMD_MAP[find.recent]="-mtime -1"
    CMD_MAP[find.old]="-mtime +30"
    
    echo "  ✓ Find extensions loaded" >&2
}

#
# Grep Command Extensions
#
extend_grep_commands() {
    echo "Loading Grep extensions..." >&2
    
    # Basic options
    CMD_MAP[grep.ignore]="-i"
    CMD_MAP[grep.recursive]="-r"
    CMD_MAP[grep.number]="-n"
    CMD_MAP[grep.count]="-c"
    CMD_MAP[grep.files]="-l"
    CMD_MAP[grep.invert]="-v"
    
    # Advanced options
    CMD_MAP[grep.word]="-w"
    CMD_MAP[grep.extended]="-E"
    CMD_MAP[grep.fixed]="-F"
    CMD_MAP[grep.context]="-C 3"
    CMD_MAP[grep.before]="-B 3"
    CMD_MAP[grep.after]="-A 3"
    
    echo "  ✓ Grep extensions loaded" >&2
}

#
# Load all extensions
#
load_all_extensions() {
    echo "Loading command extensions..." >&2
    extend_git_commands
    extend_docker_commands  
    extend_find_commands
    extend_grep_commands
    
    # Re-setup completion with new commands
    setup_completion_bindings
    echo "  ✓ All extensions loaded and completion updated" >&2
}

#
# Show examples of the new commands
#
show_extension_examples() {
    echo "Extended Command Examples"
    echo "========================"
    echo
    echo "Git Commands:"
    echo "  . git.status        →  git status"
    echo "  . git.log.graph     →  git log --oneline --graph" 
    echo "  . git.diff.staged   →  git diff --cached"
    echo
    echo "Docker Commands:"
    echo "  . docker.ps.all     →  docker ps -a"
    echo "  . docker.images     →  docker images"
    echo
    echo "Find Commands:"
    echo "  . find.name.type    →  find -name -type f"
    echo "  . find.large        →  find -size +10M"
    echo
    echo "Grep Commands:"
    echo "  . grep.ignore.recursive  →  grep -i -r"
    echo "  . grep.number.context    →  grep -n -C 3"
}

# Auto-load extensions when file is sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]] || [[ "${(%):-%N}" != "${0}" ]]; then
    # File is being sourced, load extensions
    load_all_extensions
fi