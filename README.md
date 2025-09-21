# Shell Command Dot Notation System

A powerful and modular zsh system that transforms command-line interactions using intuitive dot notation syntax.

## 🚀 Quick Start

```bash
# Load the system
source script.sh

# Use dot notation commands
. ls.all          # → ls -a
. ls.all.long     # → ls -a -l
. ls.human        # → ls -lh

# Tab completion works everywhere
ls.<TAB>          # Shows: all, almost, color, hidden, human, long, reverse, size, time
ls.a<TAB>         # Shows: all, almost
```

## 📋 Features

- **Dot Notation Syntax**: Transform `ls.all.long` → `ls -a -l`
- **Intelligent Tab Completion**: Type `ls.` + TAB to see all options
- **Chained Options**: Combine multiple flags seamlessly
- **Modular Architecture**: Easy to extend with new commands
- **Error Handling**: Clear error messages with suggestions
- **Self-Documenting**: Built-in help system

## 📁 Project Structure

```
shell.cmd/
├── script.sh                    # Main entry point
├── lib/
│   ├── command-mappings.zsh     # Command definitions
│   ├── command-expansion.zsh    # Expansion logic
│   └── tab-completion.zsh       # Completion system
└── README.md                    # This file
```

## 🎯 Usage Examples

### Basic Commands

```bash
. ls.all          # List all files (including hidden)
. ls.long         # Long listing format
. ls.human        # Human-readable file sizes
. ls.color        # Colorized output
```

### Chained Options

```bash
. ls.all.long     # ls -a -l (all files, long format)
. ls.human.color  # ls -lh --color (human sizes, colored)
. ls.all.time.reverse  # ls -a -t -r (all files, by time, reversed)
. ls.all.long.color.time.reverse  # ls -a -l --color -t -r (everything!)
```

### Seamless Chaining with Tab Completion

The system provides **seamless chaining** - when you accept a completion with Enter, no space is automatically added, allowing you to immediately continue with a dot:

```bash
# Workflow example:
1. Type: ls.all<TAB>          # Shows: .almost .color .human .long etc.
2. Select: .human             # Press ENTER - NO space added!
3. Continue: ls.all.human.    # Type dot immediately
4. Tab again: <TAB>           # Shows: .almost .color .long .size etc.
5. Result: ls.all.human.color # Seamless chaining!
```

**Completion Examples:**

````bash
**Clean Completion Display:**
```bash
ls.<TAB>          # Shows: .all .almost .color .hidden .human .long .reverse .size .time
ls.all.<TAB>      # Shows: .almost .color .hidden .human .long .reverse .size .time
ls.all.c<TAB>     # Shows: .color
ls.all.long.<TAB> # Shows: .almost .color .hidden .human .reverse .size .time
````

The completions now display **only the next option** (`.color`) instead of the full chain (`ls.all.hidden.color`), making them much cleaner and easier to read!

````

The completion system intelligently:

- 🚫 **Excludes already used options** from suggestions
- 🔄 **Allows infinite chaining** of compatible options
- 🎯 **Supports partial matching** at any level
- 💡 **Provides contextual completions** based on current chain
- ⚡ **No automatic spaces** - accepting completions allows immediate chaining with dots

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

## 🔧 System Commands

```bash
help-dot          # Show comprehensive help
dot-stats         # Show completion statistics
dot-version       # Show version information
````

## 📚 Architecture Overview

### Modules

#### 1. Command Mappings (`lib/command-mappings.zsh`)

- Defines the `CMD_MAP` associative array
- Maps dot notation to command flags
- Provides utility functions for querying mappings
- Easy to extend with new commands

#### 2. Command Expansion (`lib/command-expansion.zsh`)

- Parses dot notation input
- Expands options to command-line flags
- Handles command execution
- Comprehensive error handling

#### 3. Tab Completion (`lib/tab-completion.zsh`)

- Integrates with zsh completion system
- Supports partial matching and chaining
- Context-aware completions
- Works with both direct commands and dot function

#### 4. Main Script (`script.sh`)

- Entry point and module loader
- Defines the main `.` function
- Provides help and utility commands
- System initialization

## 🔨 Adding New Commands

### Step 1: Add to Command Mappings

Edit `lib/command-mappings.zsh` and add to the `init_command_mappings()` function:

```bash
# Git command mappings
CMD_MAP[git.status]="status"
CMD_MAP[git.branch]="branch"
CMD_MAP[git.log]="log --oneline"
```

### Step 2: Update Completion (Optional)

The completion system automatically discovers new mappings, but you can add custom logic in `lib/tab-completion.zsh` if needed.

### Step 3: Test

```bash
source script.sh    # Reload the system
. git.status        # Should work immediately
git.<TAB>           # Should show new options
```

## 🐛 Error Handling

The system provides helpful error messages:

```bash
. ls.invalid
# Error: Unknown option 'invalid' for command 'ls'
# Available options:
#   all
#   almost
#   color
#   hidden
#   human
#   long
#   reverse
#   size
#   time
```

## 🧪 Testing

Test the system after modifications:

```bash
# Load the system
source script.sh

# Test basic functionality
. ls.all

# Test tab completion (manual test)
# Type: ls.<TAB>

# Test chained options
. ls.all.long.color

# Test error handling
. ls.nonexistent

# Show system information
help-dot
dot-stats
```

## 🔮 Future Enhancements

- **More Commands**: Add support for `git`, `grep`, `find`, etc.
- **Configuration File**: External configuration for mappings
- **Aliases**: Support for custom user aliases
- **History Integration**: Remember frequently used combinations
- **Plugin System**: Loadable modules for different tools

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test thoroughly
5. Submit a pull request

---

**Happy command-line productivity!** 🚀
