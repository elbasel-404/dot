# mapping for ls
typeset -A CMD_MAP
CMD_MAP[ls.all]="-a"
CMD_MAP[ls.color]="--color"
CMD_MAP[ls.long]="-l"
CMD_MAP[ls.human]="-lh"

expand_and_run() {
  local input="$1"
  local basecmd="${input%%.*}"   # part before first dot
  local flags=()

  # split the rest by "."
  local parts="${input#"$basecmd"}"
  parts="${parts#.}"  # remove leading dot
  IFS="." read -rA tokens <<< "$parts"

  for t in "${tokens[@]}"; do
    local key="$basecmd.$t"
    if [[ -n ${CMD_MAP[$key]} ]]; then
      flags+=("${(z)CMD_MAP[$key]}")  # expand option string
    else
      echo "Unknown option: $t" >&2
      return 1
    fi
  done

  # run the expanded command
  echo "+ $basecmd ${flags[*]}" >&2
  "$basecmd" "${flags[@]}"
}

.() {
  expand_and_run "$@"
}

