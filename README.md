# Ollama CLI Client

A TypeScript CLI client for the Ollama API with streaming support, built for Bun runtime.

## Features

- 🚀 **Streaming responses** - Real-time token streaming from Ollama
- 💬 **Interactive chat mode** - Continuous conversation with history
- 🎯 **Flexible options** - System prompts, temperature control, custom formats
- 📊 **Performance stats** - Token count and generation speed
- 🔄 **Conversation history** - Maintains context across messages
- 🎨 **JSON formatting** - Support for structured outputs

## Installation

Make sure you have [Bun](https://bun.sh) installed, then clone this repository:

```bash
git clone <repository-url>
cd ollama-client-ts
```

## Usage

### Basic Chat

```bash
# Simple question
bun run index.ts "Hello, how are you?"

# With specific model
bun run index.ts -m llama3.2 "Explain quantum computing"

# With system prompt
bun run index.ts -s "You are a helpful coding assistant" "How do I write a function in TypeScript?"
```

### Interactive Mode

```bash
# Start interactive chat
bun run index.ts -i

# Interactive with specific model
bun run index.ts -i -m codellama

# Or use the npm script
bun run chat
```

### Advanced Options

```bash
# JSON output format
bun run index.ts --format json "List 3 programming languages in JSON format"

# Custom temperature
bun run index.ts -t 0.7 "Write a creative story"

# Disable streaming (get complete response at once)
bun run index.ts --no-stream "What is TypeScript?"

# Don't keep conversation history
bun run index.ts --no-history "Independent question"

# Custom Ollama server URL
bun run index.ts -u http://192.168.1.100:11434 "Hello"
```

### Utility Commands

```bash
# List available models
bun run index.ts --list-models

# Show help
bun run index.ts --help
```

## CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--model` | `-m` | Model to use | `llama3.2` |
| `--system` | `-s` | System prompt | - |
| `--temperature` | `-t` | Temperature (0.0-1.0) | - |
| `--url` | `-u` | Ollama server URL | `http://localhost:11434` |
| `--no-stream` | - | Disable streaming | `false` |
| `--no-history` | - | Don't keep conversation history | `false` |
| `--format` | - | Response format (json, or JSON schema) | - |
| `--interactive` | `-i` | Interactive mode | `false` |
| `--list-models` | - | List available models | `false` |
| `--help` | `-h` | Show help | `false` |

## Interactive Mode Commands

When in interactive mode, you can use these special commands:

- `exit` - Quit the interactive session
- `clear` - Clear conversation history
- `models` - List available models

## Examples

### Basic Usage
```bash
# Ask a simple question
bun run index.ts "What is the capital of France?"

# Use a specific model
bun run index.ts -m codellama "Write a Python function to calculate fibonacci"
```

### System Prompts
```bash
# Set a system prompt for role-playing
bun run index.ts -s "You are a pirate captain" "Tell me about your adventures"

# Technical assistant
bun run index.ts -s "You are a senior software engineer" "Explain microservices architecture"
```

### JSON Output
```bash
# Request structured JSON response
bun run index.ts --format json "List the top 5 programming languages with their use cases in JSON format"

# With JSON schema for strict formatting
bun run index.ts --format '{"type":"object","properties":{"languages":{"type":"array","items":{"type":"string"}}}}' "List 3 programming languages"
```

### Interactive Session Example
```bash
$ bun run index.ts -i
🤖 Interactive chat with llama3.2
Type 'exit' to quit, 'clear' to clear history, 'models' to list models

You: Hello! How are you?
Assistant: Hello! I'm doing well, thank you for asking. I'm here and ready to help you with any questions or tasks you might have. How are you doing today?

You: Can you help me with TypeScript?
Assistant: Absolutely! I'd be happy to help you with TypeScript. TypeScript is a powerful superset of JavaScript that adds static typing...

You: clear
Conversation history cleared.

You: exit
Goodbye! 👋
```

## API Compatibility

This CLI supports the Ollama Chat API (`/api/chat`) with the following features:

- ✅ Streaming responses
- ✅ Non-streaming responses  
- ✅ System prompts
- ✅ Conversation history
- ✅ Temperature control
- ✅ JSON formatting
- ✅ Custom model selection
- ✅ Performance statistics

## Requirements

- [Bun](https://bun.sh) runtime
- Ollama server running (default: `http://localhost:11434`)
- TypeScript 5+

## Development

```bash
# Run in development mode with auto-reload
bun run dev

# Start interactive chat
bun run chat

# Run with custom arguments
bun run start -- -m llama3.2 "Your message here"
```

## Error Handling

The CLI includes comprehensive error handling for:

- Network connection issues
- Invalid model names
- Malformed JSON responses
- Server errors
- Invalid command line arguments

## Performance

The streaming implementation provides real-time token output with performance statistics including:

- Token count
- Tokens per second
- Total duration
- Load duration
- Evaluation duration

## License

MIT License - see LICENSE file for details.
