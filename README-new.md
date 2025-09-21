# Shell Command Dot Notation System v2.0

A powerful TypeScript/Bun CLI system that transforms command-line interactions using intuitive dot notation syntax.

## 🚀 Quick Start

```bash
# Install dependencies and build
bun install
bun run build

# Use dot notation commands
bun start ls.all          # → ls -a
bun start ls.all.long     # → ls -a -l
bun start ls.human        # → ls -lh

# Or install globally
npm link  # or bun link
dot ls.all.long.color     # → ls -a -l --color
```

## 📋 Features

- **Modern TypeScript Implementation**: Built with TypeScript and powered by zx for shell execution
- **Bun-Powered**: Fast builds and execution with Bun runtime
- **Dot Notation Syntax**: Transform `ls.all.long` → `ls -a -l`
- **Intelligent CLI**: Commander.js-based CLI with comprehensive help
- **Shell Completion**: Generate completion scripts for zsh/bash
- **Modular Architecture**: Clean, extensible codebase
- **Cross-Platform**: Works on any system with Node.js or Bun

## 📁 Project Structure

```
shell-cmd-dot/
├── src/
│   ├── types.ts              # TypeScript interfaces and types
│   ├── command-mappings.ts   # Command definitions using Maps
│   ├── command-expansion.ts  # Expansion logic with zx
│   ├── completion.ts         # Shell completion generator
│   ├── cli.ts               # Main CLI interface
│   └── index.ts             # Public API exports
├── bin/
│   └── dot                  # Executable entry point
├── dist/                    # Built JavaScript files
├── package.json
└── README.md
```

## 🎯 Usage Examples

### Basic Commands

```bash
# Using bun start (development)
bun start ls.all          # List all files (including hidden)
bun start ls.long         # Long listing format
bun start ls.human        # Human-readable file sizes
bun start ls.color        # Colorized output

# Using installed binary
dot ls.all               # Same functionality
dot ls.long              # Global command
```

### Advanced Features

```bash
# Dry run - see what would be executed
bun start --dry-run ls.all.long.color
# Output: Would execute: ls -a -l --color

# Quiet mode - don't show expanded command
bun start --quiet ls.all

# Capture output as JSON
bun start --capture ls.all

# Get help and statistics
bun start help-detailed
bun start stats
bun start list
bun start search color
```

### Chained Options

```bash
bun start ls.all.long     # ls -a -l (all files, long format)
bun start ls.human.color  # ls -lh --color (human sizes, colored)
bun start ls.all.time.reverse  # ls -a -t -r (all files, by time, reversed)
```

## 🛠️ Available Commands

### ls (File Listing)

| Notation     | Flags     | Description                                |
| ------------ | --------- | ------------------------------------------ |
| `ls.all`     | `-a`      | Show all files including hidden (. and ..) |
| `ls.almost`  | `-A`      | Show all files except . and ..             |
| `ls.hidden`  | `-a`      | Alias for ls.all                           |
| `ls.long`    | `-l`      | Long listing format                        |
| `ls.human`   | `-lh`     | Long format with human-readable sizes      |
| `ls.color`   | `--color` | Colorized output                           |
| `ls.size`    | `-S`      | Sort by file size (largest first)          |
| `ls.time`    | `-t`      | Sort by modification time (newest first)   |
| `ls.reverse` | `-r`      | Reverse sort order                         |

## 🔧 Development

### Building

```bash
# Install dependencies
bun install

# Build all modules
bun run build

# Build specific modules
bun run build:cli
bun run build:completion

# Development with watching
bun run dev
```

### Scripts

```bash
bun run build              # Build TypeScript to JavaScript
bun run start              # Run the CLI
bun run dev                # Development mode with watching
bun run clean              # Clean dist directory
bun run test               # Run tests
bun run setup-completion   # Generate completion scripts
```

## 🎣 Shell Completion

Generate and install shell completion:

```bash
# Generate zsh completion
bun start generate-completion zsh > _dot
sudo mv _dot /usr/share/zsh/site-functions/

# Generate bash completion
bun start generate-completion bash > dot-completion.bash
echo "source $(pwd)/dot-completion.bash" >> ~/.bashrc

# Reload shell
exec zsh  # or exec bash
```

## 📚 Architecture Overview

### TypeScript Modules

#### 1. Types (`src/types.ts`)

- Comprehensive TypeScript interfaces
- Type guards and utility types
- Replaces zsh associative arrays with proper types

#### 2. Command Mappings (`src/command-mappings.ts`)

- Uses Map objects for command storage
- Type-safe mapping management
- Easy extensibility for new commands

#### 3. Command Expansion (`src/command-expansion.ts`)

- Parsing and expansion logic
- Integration with zx for shell execution
- Comprehensive error handling

#### 4. CLI Interface (`src/cli.ts`)

- Commander.js-based CLI
- Rich help system and subcommands
- Proper argument parsing and validation

#### 5. Completion System (`src/completion.ts`)

- Dynamic completion script generation
- Support for zsh and bash
- Integration with the Node.js runtime

## 🔨 Adding New Commands

### Step 1: Add to Command Mappings

Edit `src/command-mappings.ts`:

```typescript
// In initializeGitCommands() function
const gitMappings: CommandMapping[] = [
  { key: "git.status", flags: "status", description: "Show git status" },
  {
    key: "git.log",
    flags: "log --oneline",
    description: "Show commit history",
  },
  // ... more mappings
];
```

### Step 2: Update Initialization

Add the new command initializer to `initializeCommandMappings()`:

```typescript
export function initializeCommandMappings(): void {
  commandMappings.clear();
  baseCommands.clear();

  initializeLsCommands();
  initializeGitCommands(); // Add this line
}
```

### Step 3: Test

```bash
bun run build
bun start git.status     # Should work immediately
bun start list           # Should show 'git' in base commands
```

## 🐛 Error Handling

The system provides helpful error messages:

```bash
bun start ls.invalid
# Error: Unknown option 'invalid' for command 'ls'
# Available options: all, almost, color, hidden, human, long, reverse, size, time

bun start nonexistent.command
# Error: Command 'nonexistent' not found
```

## 🧪 Testing

```bash
# Test basic functionality
bun start --dry-run ls.all.long

# Test error handling
bun start ls.nonexistent

# Test system commands
bun start stats
bun start help-detailed
bun start search human
```

## 📊 System Information

```bash
# Show statistics
bun start stats

# List all commands
bun start list

# Search for specific functionality
bun start search color

# Generate completion
bun start generate-completion zsh
```

## 🔮 Future Enhancements

- **More Commands**: Git, Docker, NPM, etc.
- **Configuration Files**: JSON/YAML config support
- **Plugin System**: Loadable command modules
- **History Integration**: Remember frequently used combinations
- **Interactive Mode**: TUI for command exploration

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements (follow TypeScript patterns)
4. Test with `bun test`
5. Build with `bun run build`
6. Submit a pull request

---

**Built with TypeScript, Bun, and zx** 🚀
