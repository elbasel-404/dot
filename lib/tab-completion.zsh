#!/bin/zsh
#
# Tab Completion Module
#
# This module provides intelligent tab completion for dot-notation commands.
# It supports:
# 1. Completion after typing "ls." + TAB (shows all ls options)
# 2. Partial completion like "ls.a" + TAB (shows ls.all, ls.almost)
# 3. Completion within the dot function: ". ls.a" + TAB
# 4. Chained completion: "ls.all.c" + TAB (shows ls.all.color)
#
# The completion system integrates with zsh's completion framework
# and provides context-aware suggestions based on available mappings.
#

#
# Core completion logic for dot-notation commands
# This function analyzes the current buffer and provides appropriate completions
#
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
		# Single option completion: "ls.a" -> "ls.all", "ls.almost"
		completions=($(get_single_option_completions "$current_word"))
	fi

	# Return completions to zsh with clean display (showing only .option)
	if ((${#completions[@]} > 0)); then
		# Create display names that show only .option
		local display_names=()
		for completion in "${completions[@]}"; do
			local option_name="${completion##*.}"
			display_names+=(".${option_name}")
		done

		# Use -d to show clean display names while completing to full chains
		compadd -S '' -r "." -d display_names -a completions
	fi
}

#
# Get completions for base commands (e.g., "ls." -> all ls options)
#
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

#
# Get completions for single options (e.g., "ls.a" -> "ls.all", "ls.almost")
#
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

#
# Get completions when chain ends with dot (e.g., "ls.all." -> show remaining options)
#
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

#
# Get completions for chained options (e.g., "ls.all.c" -> "ls.all.color")
#
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

#
# Main completion function for the dot (.) command
# Called when user types ". ls.a" + TAB
#
_dot_completion() {
	local line="$BUFFER"
	local cursor="$CURSOR"

	# Extract the current word being completed
	local current_word="${line##* }"

	# Only complete if the word looks like a dot-notation command
	if [[ "$current_word" =~ ^[a-zA-Z]+\. ]]; then
		_complete_dot_notation "$current_word"
	fi
}

#
# Completion function for direct command completion
# Called when user types "ls.a" + TAB (without the dot function)
#
_direct_command_completion() {
	local line="$BUFFER"
	local current_word="${line##* }"

	# Check if current word ends with a dot or is a partial dot command
	if [[ "$current_word" =~ ^[a-zA-Z]+\..*$ ]] || [[ "$current_word" =~ \.$ ]]; then
		_complete_dot_notation "$current_word"
	fi
}

#
# Enhanced completion that provides help text
# Shows both the completion and what flags it maps to
#
_completion_with_descriptions() {
	local completions=()
	local descriptions=()
	local current_word="${BUFFER##* }"

	if [[ "$current_word" =~ ^[a-zA-Z]+\..*$ ]]; then
		local base_cmd="${current_word%%.*}"
		local options
		options=($(get_command_options "$base_cmd"))

		for option in "${options[@]}"; do
			local full_cmd="${base_cmd}.${option}"
			local mapping="$(get_mapping "$full_cmd")"

			# Only include if it matches the partial input
			if [[ "$full_cmd" =~ ^${current_word//./\\.} ]]; then
				completions+=("$full_cmd")
				descriptions+=("$mapping")
			fi
		done

		# Add completions with descriptions and clean display format
		local display_names=()
		for completion in "${completions[@]}"; do
			local option_name="${completion##*.}"
			display_names+=(".${option_name}")
		done

		# Use -d to show clean display names with descriptions
		compadd -S '' -r "." -d display_names -X "Available options:" -a completions
	fi
}

#
# Setup completion bindings
#
setup_completion_bindings() {
	# Register completion for the dot function
	compdef _dot_completion .

	# Register completion for direct command usage
	# This enables completion for all known base commands
	local base_commands
	base_commands=($(get_base_commands))

	for base_cmd in "${base_commands[@]}"; do
		compdef _direct_command_completion "$base_cmd"
	done

	# Note: Completions use -S '' -r "." -d to:
	# - Prevent automatic space insertion after completion (-S '')
	# - Allow dots to remove suffix for seamless chaining (-r ".")
	# - Show clean display names (.option) while completing full chains (-d)
	# This enables: ls.all<TAB> shows .color .human but completes to ls.all.color
	# Result: Clean display + correct completion behavior
}

#
# Show completion statistics (for debugging)
#
show_completion_stats() {
	echo "Completion Statistics:"
	echo

	local base_commands
	base_commands=($(get_base_commands))

	echo "Base commands with completion: ${#base_commands[@]}"
	for base_cmd in "${base_commands[@]}"; do
		local option_count
		option_count=$(get_command_options "$base_cmd" | wc -l)
		printf "  %-10s: %d options\n" "$base_cmd" "$option_count"
	done
}
