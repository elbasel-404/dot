#!/usr/bin/env zx

// Chainable Command Shell with Tab Cycling
// Usage: node shell.mjs or chmod +x shell.mjs && ./shell.mjs

import { createInterface } from 'readline'
import { spawn } from 'child_process'

// Command chain definitions
const commandChains = {
  // ls chains
  'ls.all': 'ls -a',
  'ls.color': 'ls --color=auto',
  'ls.long': 'ls -l',
  'ls.human': 'ls -h',
  'ls.time': 'ls -t',
  'ls.reverse': 'ls -r',
  'ls.size': 'ls -S',
  'ls.all.color': 'ls -a --color=auto',
  'ls.all.long': 'ls -a -l',
  'ls.all.long.human': 'ls -a -l -h',
  'ls.all.color.long': 'ls -a --color=auto -l',
  'ls.color.long': 'ls --color=auto -l',
  'ls.color.long.human': 'ls --color=auto -l -h',
  'ls.long.human': 'ls -l -h',
  'ls.long.time': 'ls -l -t',
  'ls.all.color.long.human': 'ls -a --color=auto -l -h',
  
  // git chains
  'git.status': 'git status',
  'git.add': 'git add',
  'git.commit': 'git commit',
  'git.push': 'git push',
  'git.pull': 'git pull',
  'git.log': 'git log',
  'git.diff': 'git diff',
  'git.branch': 'git branch',
  'git.checkout': 'git checkout',
  'git.add.all': 'git add -A',
  'git.commit.message': 'git commit -m',
  'git.log.oneline': 'git log --oneline',
  'git.log.graph': 'git log --graph --oneline --all',
  'git.status.short': 'git status -s',
  'git.diff.cached': 'git diff --cached',
  'git.push.origin': 'git push origin',
  'git.pull.origin': 'git pull origin',
  
  // docker chains
  'docker.ps': 'docker ps',
  'docker.ps.all': 'docker ps -a',
  'docker.images': 'docker images',
  'docker.run': 'docker run',
  'docker.exec': 'docker exec',
  'docker.stop': 'docker stop',
  'docker.logs': 'docker logs',
  'docker.build': 'docker build',
  'docker.run.interactive': 'docker run -it',
  'docker.exec.interactive': 'docker exec -it',
  'docker.logs.follow': 'docker logs -f',
  'docker.system.prune': 'docker system prune',
  
  // npm chains
  'npm.install': 'npm install',
  'npm.start': 'npm start',
  'npm.test': 'npm test',
  'npm.build': 'npm run build',
  'npm.dev': 'npm run dev',
  'npm.install.dev': 'npm install --save-dev',
  'npm.install.global': 'npm install -g',
  
  // Custom utility chains
  'find.name': 'find . -name',
  'find.type.file': 'find . -type f',
  'find.type.dir': 'find . -type d',
  'grep.recursive': 'grep -r',
  'grep.ignore.case': 'grep -i',
  'grep.recursive.ignore.case': 'grep -ri',
}

// Tab completion state
let currentCompletions = []
let completionIndex = -1
let originalLine = ''
let lastTabTime = 0

// Get available completions for a partial command
function getCompletions(partial) {
  const completions = []
  
  // Find direct matches
  for (const [chain, command] of Object.entries(commandChains)) {
    if (chain.startsWith(partial)) {
      completions.push(chain)
    }
  }
  
  // If no chain matches, include base commands
  if (completions.length === 0) {
    const baseCommands = ['ls', 'git', 'docker', 'npm', 'find', 'grep', 'cd', 'pwd', 'cat', 'echo', 'mkdir', 'rm', 'cp', 'mv']
    for (const cmd of baseCommands) {
      if (cmd.startsWith(partial)) {
        completions.push(cmd)
      }
    }
  }
  
  return completions.sort()
}

// Enhanced tab completion with cycling
function handleTabCompletion(line) {
  const now = Date.now()
  const isConsecutiveTab = now - lastTabTime < 500 // 500ms threshold for consecutive tabs
  lastTabTime = now
  
  // Extract the command part (before first space)
  const spaceIndex = line.indexOf(' ')
  const commandPart = spaceIndex === -1 ? line : line.substring(0, spaceIndex)
  const argsPart = spaceIndex === -1 ? '' : line.substring(spaceIndex)
  
  if (!isConsecutiveTab || originalLine !== commandPart) {
    // First tab or different line - get new completions
    originalLine = commandPart
    currentCompletions = getCompletions(commandPart)
    completionIndex = -1
    
    if (currentCompletions.length === 0) {
      return [[], line]
    }
    
    if (currentCompletions.length === 1) {
      // Single completion - auto-complete it
      const completed = currentCompletions[0] + argsPart
      return [[], completed]
    }
  }
  
  if (currentCompletions.length > 1) {
    // Multiple completions - cycle through them
    completionIndex = (completionIndex + 1) % currentCompletions.length
    const completed = currentCompletions[completionIndex] + argsPart
    
    // Show completion info
    process.stdout.write('\r' + ' '.repeat(process.stdout.columns) + '\r') // Clear line
    const prompt = getPrompt()
    const completionInfo = chalk.gray(` (${completionIndex + 1}/${currentCompletions.length})`)
    process.stdout.write(prompt + completed + completionInfo)
    
    // Move cursor back to end of actual command
    const moveBack = completionInfo.length
    process.stdout.write('\x1b[' + moveBack + 'D')
    
    return [[], completed]
  }
  
  return [[], line]
}

// Expand a chainable command
function expandCommand(input) {
  const parts = input.trim().split(' ')
  const chainCommand = parts[0]
  const args = parts.slice(1)
  
  if (commandChains[chainCommand]) {
    return `${commandChains[chainCommand]} ${args.join(' ')}`.trim()
  }
  
  return input
}

// Execute a command
async function executeCommand(commandLine) {
  if (!commandLine.trim()) return
  
  // Handle built-in commands
  if (commandLine.trim() === 'exit' || commandLine.trim() === 'quit') {
    console.log('Goodbye!')
    process.exit(0)
  }
  
  if (commandLine.trim() === 'help') {
    showHelp()
    return
  }
  
  if (commandLine.trim().startsWith('chains')) {
    const baseCmd = commandLine.split(' ')[1]
    showChains(baseCmd)
    return
  }
  
  // Expand the command
  const expandedCommand = expandCommand(commandLine)
  
  if (expandedCommand !== commandLine) {
    console.log(chalk.gray(`→ ${expandedCommand}`))
  }
  
  try {
    // Execute the command using zx
    await $`${expandedCommand}`
  } catch (error) {
    // If zx fails, try with spawn for better compatibility
    const [cmd, ...args] = expandedCommand.split(' ')
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true
    })
    
    await new Promise((resolve) => {
      child.on('close', resolve)
    })
  }
}

// Show help
function showHelp() {
  console.log(chalk.cyan('\n🔗 Chainable Command Shell Help'))
  console.log('=====================================')
  console.log('Available commands:')
  console.log('  help          - Show this help')
  console.log('  chains [cmd]  - Show available chains for a command')
  console.log('  exit/quit     - Exit the shell')
  console.log('\nTab completion:')
  console.log('  TAB           - Cycle through available completions')
  console.log('  TAB TAB       - Continue cycling through options')
  console.log('\nExample chains:')
  console.log('  ls.all.color.long.human  →  ls -a --color=auto -l -h')
  console.log('  git.log.oneline          →  git log --oneline')
  console.log('  docker.ps.all            →  docker ps -a')
  console.log('\nTry typing "ls." and press TAB to cycle through options!')
}

// Show available chains for a base command
function showChains(baseCmd) {
  if (!baseCmd) {
    console.log('\nAvailable base commands:')
    const bases = [...new Set(Object.keys(commandChains).map(k => k.split('.')[0]))]
    bases.forEach(base => console.log(`  ${base}`))
    console.log('\nUse "chains <command>" to see specific chains')
    return
  }
  
  console.log(`\nAvailable chains for "${baseCmd}":`)
  const chains = Object.keys(commandChains)
    .filter(k => k.startsWith(baseCmd + '.'))
    .sort()
  
  if (chains.length === 0) {
    console.log(`  No chains found for "${baseCmd}"`)
  } else {
    chains.forEach(chain => {
      console.log(`  ${chain.padEnd(25)} → ${commandChains[chain]}`)
    })
  }
}

// Custom prompt
function getPrompt() {
  const cwd = process.cwd().replace(process.env.HOME, '~')
  return chalk.green('⚡ ') + chalk.blue(cwd) + chalk.white(' $ ')
}

// Setup readline interface with custom tab handling
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: handleTabCompletion,
  tabSize: 4
})

// Handle special keys
process.stdin.on('keypress', (str, key) => {
  if (key && key.name !== 'tab') {
    // Reset completion state on any non-tab key
    currentCompletions = []
    completionIndex = -1
    originalLine = ''
  }
})

// Main shell loop
async function startShell() {
  console.log(chalk.cyan('🔗 Welcome to Chainable Command Shell!'))
  console.log(chalk.gray('Type "help" for commands, "exit" to quit'))
  console.log(chalk.gray('Press TAB to cycle through available completions\n'))
  
  const prompt = () => {
    rl.question(getPrompt(), async (input) => {
      // Reset completion state after command execution
      currentCompletions = []
      completionIndex = -1
      originalLine = ''
      
      await executeCommand(input)
      prompt()
    })
  }
  
  prompt()
}

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n' + chalk.yellow('Use "exit" or "quit" to leave the shell'))
  currentCompletions = []
  completionIndex = -1
  originalLine = ''
})

// Enable keypress events
if (process.stdin.isTTY) {
  process.stdin.setRawMode(false)
}

// Start the shell
startShell().catch(console.error)
