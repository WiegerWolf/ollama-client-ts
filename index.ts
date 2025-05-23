#!/usr/bin/env bun

import { parseArgs } from "util";

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  images?: string[];
  tool_calls?: any[];
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  format?: string | object;
  options?: Record<string, any>;
  stream?: boolean;
  keep_alive?: string;
  tools?: any[];
}

interface ChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

class OllamaClient {
  private baseUrl: string;
  private conversationHistory: ChatMessage[] = [];

  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async chat(
    model: string,
    message: string,
    options: {
      system?: string;
      stream?: boolean;
      temperature?: number;
      keepHistory?: boolean;
      format?: string | object;
    } = {}
  ): Promise<void> {
    const {
      system,
      stream = true,
      temperature,
      keepHistory = true,
      format
    } = options;

    // Add system message if provided and not already in history
    if (system && this.conversationHistory.length === 0) {
      this.conversationHistory.push({
        role: "system",
        content: system
      });
    }

    // Add user message to history
    this.conversationHistory.push({
      role: "user",
      content: message
    });

    const requestBody: ChatRequest = {
      model,
      messages: keepHistory ? this.conversationHistory : [
        ...(system ? [{ role: "system" as const, content: system }] : []),
        { role: "user", content: message }
      ],
      stream,
      ...(format && { format }),
      ...(temperature !== undefined && {
        options: { temperature }
      })
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (stream) {
        await this.handleStreamingResponse(response);
      } else {
        await this.handleSingleResponse(response);
      }
    } catch (error) {
      console.error("Error calling Ollama API:", error);
      throw error;
    }
  }

  private async handleStreamingResponse(response: Response): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let assistantMessage = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data: ChatResponse = JSON.parse(line);
            
            if (data.message?.content) {
              process.stdout.write(data.message.content);
              assistantMessage += data.message.content;
            }

            if (data.done) {
              console.log(); // New line after completion
              
              // Add assistant response to conversation history
              this.conversationHistory.push({
                role: "assistant",
                content: assistantMessage
              });

              // Print performance stats if available
              if (data.total_duration) {
                const tokensPerSecond = data.eval_count && data.eval_duration 
                  ? (data.eval_count / (data.eval_duration / 1e9)).toFixed(2)
                  : "N/A";
                
                console.log(`\n📊 Stats: ${data.eval_count || 0} tokens, ${tokensPerSecond} tokens/s`);
              }
            }
          } catch (parseError) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async handleSingleResponse(response: Response): Promise<void> {
    const data = await response.json() as ChatResponse;
    
    if (data.message?.content) {
      console.log(data.message.content);
      
      // Add assistant response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: data.message.content
      });
    }

    // Print performance stats if available
    if (data.total_duration) {
      const tokensPerSecond = data.eval_count && data.eval_duration 
        ? (data.eval_count / (data.eval_duration / 1e9)).toFixed(2)
        : "N/A";
      
      console.log(`\n📊 Stats: ${data.eval_count || 0} tokens, ${tokensPerSecond} tokens/s`);
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  async listModels(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as { models?: Array<{ name: string; details?: { parameter_size?: string } }> };
      console.log("Available models:");
      data.models?.forEach((model) => {
        console.log(`  • ${model.name} (${model.details?.parameter_size || 'unknown size'})`);
      });
    } catch (error) {
      console.error("Error listing models:", error);
    }
  }
}

async function interactiveMode(client: OllamaClient, model: string, options: any): Promise<void> {
  console.log(`🤖 Interactive chat with ${model}`);
  console.log("Type 'exit' to quit, 'clear' to clear history, 'models' to list models\n");

  while (true) {
    const input = prompt("You: ");
    
    if (!input) continue;
    
    if (input.toLowerCase() === 'exit') {
      console.log("Goodbye! 👋");
      break;
    }
    
    if (input.toLowerCase() === 'clear') {
      client.clearHistory();
      console.log("Conversation history cleared.\n");
      continue;
    }
    
    if (input.toLowerCase() === 'models') {
      await client.listModels();
      console.log();
      continue;
    }

    try {
      process.stdout.write("Assistant: ");
      await client.chat(model, input, options);
      console.log();
    } catch (error) {
      console.error("Error:", error);
    }
  }
}

function printHelp(): void {
  console.log(`
🦙 Ollama CLI Client

Usage:
  bun run index.ts [options] [message]

Options:
  -m, --model <model>        Model to use (default: llama3.2)
  -s, --system <prompt>      System prompt
  -t, --temperature <num>    Temperature (0.0-1.0)
  -u, --url <url>           Ollama server URL (default: http://localhost:11434)
  --no-stream               Disable streaming
  --no-history              Don't keep conversation history
  --format <format>         Response format (json, or JSON schema)
  -i, --interactive         Interactive mode
  --list-models             List available models
  -h, --help                Show this help

Examples:
  bun run index.ts "Hello, how are you?"
  bun run index.ts -m llama3.2 -s "You are a helpful assistant" "Explain quantum computing"
  bun run index.ts -i -m codellama
  bun run index.ts --format json "List 3 colors in JSON format"
  bun run index.ts --list-models
`);
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      model: { type: "string", short: "m", default: "llama3.2" },
      system: { type: "string", short: "s" },
      temperature: { type: "string", short: "t" },
      url: { type: "string", short: "u", default: "http://localhost:11434" },
      "no-stream": { type: "boolean" },
      "no-history": { type: "boolean" },
      format: { type: "string" },
      interactive: { type: "boolean", short: "i" },
      "list-models": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
    return;
  }

  const client = new OllamaClient(values.url);

  if (values["list-models"]) {
    await client.listModels();
    return;
  }

  const chatOptions = {
    system: values.system,
    stream: !values["no-stream"],
    temperature: values.temperature ? parseFloat(values.temperature) : undefined,
    keepHistory: !values["no-history"],
    format: values.format,
  };

  if (values.interactive) {
    await interactiveMode(client, values.model, chatOptions);
    return;
  }

  const message = positionals.join(" ");
  if (!message) {
    console.error("Error: No message provided. Use -h for help.");
    process.exit(1);
  }

  try {
    await client.chat(values.model, message, chatOptions);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the CLI
if (import.meta.main) {
  main().catch(console.error);
}