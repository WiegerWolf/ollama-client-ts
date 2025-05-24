"use client"

import { useState } from "react"
import { ThinkingSections } from "@/components/ui/thinking-section"
import { parseMessageContent, parseStreamingContent } from "@/lib/content-parser"

export default function ThinkingTestPage() {
  const [testContent, setTestContent] = useState(`<think>
This is a thinking section where I analyze the problem.
I need to consider multiple factors:
1. User requirements
2. Technical constraints
3. Best practices
</think>

Here is my regular response after thinking about it.

<think>
Another thinking section with more analysis.
This shows how multiple thinking sections work.
</think>

And here's more regular content at the end.`)

  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

  const parsedStatic = parseMessageContent(testContent)
  const parsedStreaming = parseStreamingContent(streamingContent)

  const simulateStreaming = () => {
    setIsStreaming(true)
    setStreamingContent("")
    
    const fullContent = `<think>
I'm thinking about this step by step...
Let me analyze the requirements first.
</think>

Based on my analysis, here's what I recommend:

1. First, we should consider the user experience
2. Then, we need to think about performance

<think>
Actually, let me reconsider this approach.
Maybe there's a better way to handle this.
</think>

After further consideration, I believe the best approach is to implement it gradually.`

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < fullContent.length) {
        setStreamingContent(fullContent.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsStreaming(false)
        clearInterval(interval)
      }
    }, 50)
  }

  return (
    <div className="min-h-screen bg-bg-primary p-4xl">
      <div className="max-w-4xl mx-auto space-y-4xl">
        {/* Header */}
        <div className="bg-bg-secondary p-3xl rounded-large shadow-light">
          <h1 className="text-display-large text-text-primary mb-lg">Thinking Tags Test</h1>
          <p className="text-body-large text-text-secondary">
            Testing the implementation of thinking tags parsing and display.
          </p>
        </div>

        {/* Static Content Test */}
        <div className="bg-bg-secondary p-3xl rounded-large shadow-light">
          <h2 className="text-display-medium text-text-primary mb-xl">Static Content Test</h2>
          
          <div className="space-y-lg">
            <div>
              <h3 className="text-heading-medium text-text-primary mb-md">Raw Content:</h3>
              <textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                className="w-full h-32 p-md border border-border-primary rounded-md bg-bg-primary text-text-primary font-mono text-sm"
              />
            </div>

            <div>
              <h3 className="text-heading-medium text-text-primary mb-md">Parsed Result:</h3>
              <div className="space-y-md">
                <div>
                  <h4 className="text-heading-small text-text-secondary mb-sm">Thinking Sections ({parsedStatic.thinkingSections.length}):</h4>
                  <ThinkingSections sections={parsedStatic.thinkingSections} />
                </div>
                
                {parsedStatic.regularContent && (
                  <div>
                    <h4 className="text-heading-small text-text-secondary mb-sm">Regular Content:</h4>
                    <div className="bg-bg-primary p-md rounded-md border border-border-primary">
                      <div className="whitespace-pre-wrap text-text-primary">
                        {parsedStatic.regularContent}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Streaming Content Test */}
        <div className="bg-bg-secondary p-3xl rounded-large shadow-light">
          <h2 className="text-display-medium text-text-primary mb-xl">Streaming Content Test</h2>
          
          <div className="space-y-lg">
            <div>
              <button
                onClick={simulateStreaming}
                disabled={isStreaming}
                className="bg-primary-blue text-white px-lg py-md rounded-md font-medium hover:bg-primary-blue-hover transition-colors disabled:opacity-50"
              >
                {isStreaming ? "Streaming..." : "Start Streaming Simulation"}
              </button>
            </div>

            <div>
              <h3 className="text-heading-medium text-text-primary mb-md">Streaming Content:</h3>
              <div className="bg-bg-primary p-md rounded-md border border-border-primary min-h-[100px]">
                <div className="whitespace-pre-wrap text-text-primary font-mono text-sm">
                  {streamingContent}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1 rounded-sm" />
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-heading-medium text-text-primary mb-md">Parsed Streaming Result:</h3>
              <div className="space-y-md">
                <div>
                  <h4 className="text-heading-small text-text-secondary mb-sm">
                    Complete Thinking Sections ({parsedStreaming.thinkingSections.length}):
                  </h4>
                  <ThinkingSections 
                    sections={parsedStreaming.thinkingSections}
                    partialThinking={parsedStreaming.partialThinking}
                  />
                </div>
                
                {parsedStreaming.regularContent && (
                  <div>
                    <h4 className="text-heading-small text-text-secondary mb-sm">Regular Content:</h4>
                    <div className="bg-bg-primary p-md rounded-md border border-border-primary">
                      <div className="whitespace-pre-wrap text-text-primary">
                        {parsedStreaming.regularContent}
                      </div>
                    </div>
                  </div>
                )}

                {parsedStreaming.partialThinking && (
                  <div>
                    <h4 className="text-heading-small text-text-secondary mb-sm">Partial Thinking:</h4>
                    <div className="bg-bg-tertiary p-md rounded-md border border-border-secondary">
                      <div className="whitespace-pre-wrap text-text-secondary font-mono text-sm">
                        {parsedStreaming.partialThinking}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}