#!/bin/bash

echo "🦙 Ollama CLI Examples"
echo "====================="
echo

echo "1. Basic chat:"
echo "bun run index.ts 'Hello, how are you?'"
echo

echo "2. With system prompt:"
echo "bun run index.ts -s 'You are a helpful coding assistant' 'How do I write a TypeScript interface?'"
echo

echo "3. JSON output:"
echo "bun run index.ts --format json 'List 3 colors in JSON format'"
echo

echo "4. Interactive mode:"
echo "bun run index.ts -i"
echo

echo "5. List available models:"
echo "bun run index.ts --list-models"
echo

echo "6. Non-streaming response:"
echo "bun run index.ts --no-stream 'What is TypeScript?'"
echo

echo "7. Custom temperature:"
echo "bun run index.ts -t 0.7 'Write a creative short story'"
echo

echo "8. No conversation history:"
echo "bun run index.ts --no-history 'Independent question'"
echo

echo "Run any of these commands to test the CLI!"