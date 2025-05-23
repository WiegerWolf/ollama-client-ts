export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  images?: string[];
  tool_calls?: any[];
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  format?: string | object;
  options?: Record<string, any>;
  stream?: boolean;
  keep_alive?: string;
  tools?: any[];
}

export interface ChatResponse {
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

export interface OllamaModel {
  name: string;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
    family?: string;
  };
  size?: number;
  digest?: string;
  modified_at?: string;
}

export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async chat(
    model: string,
    messages: ChatMessage[],
    options: {
      stream?: boolean;
      temperature?: number;
      format?: string | object;
      onToken?: (token: string) => void;
      onComplete?: (response: ChatResponse) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<ChatResponse | void> {
    const {
      stream = true,
      temperature,
      format,
      onToken,
      onComplete,
      onError
    } = options;

    const requestBody: ChatRequest = {
      model,
      messages,
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
        return this.handleStreamingResponse(response, onToken, onComplete, onError);
      } else {
        const data = await response.json() as ChatResponse;
        onComplete?.(data);
        return data;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      throw err;
    }
  }

  private async handleStreamingResponse(
    response: Response,
    onToken?: (token: string) => void,
    onComplete?: (response: ChatResponse) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let assistantMessage = "";
    let finalResponse: ChatResponse | null = null;

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
              onToken?.(data.message.content);
              assistantMessage += data.message.content;
            }

            if (data.done) {
              finalResponse = {
                ...data,
                message: {
                  ...data.message,
                  content: assistantMessage
                }
              };
              onComplete?.(finalResponse);
            }
          } catch (parseError) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      throw err;
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as { models?: OllamaModel[] };
      return data.models || [];
    } catch (error) {
      console.error("Error listing models:", error);
      throw error;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Singleton instance for use across the app
export const ollamaClient = new OllamaClient(
  process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "http://localhost:11434"
);