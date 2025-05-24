"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThinkingSectionProps {
  content: string
  isPartial?: boolean
  className?: string
}

export function ThinkingSection({ content, isPartial = false, className }: ThinkingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!content.trim()) {
    return null
  }

  return (
    <div className={cn("border border-border-secondary rounded-lg bg-bg-tertiary", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-md hover:bg-bg-secondary transition-colors duration-150 rounded-lg"
        type="button"
      >
        <div className="flex items-center space-sm">
          <Brain className="h-4 w-4 text-text-tertiary" />
          <span className="text-body-small text-text-secondary font-medium">
            {isPartial ? "Thinking..." : "Thinking"}
          </span>
          {isPartial && (
            <span className="inline-block w-1 h-3 bg-text-tertiary animate-pulse rounded-sm ml-1" />
          )}
        </div>
        <div className="flex items-center space-sm">
          <span className="text-body-small text-text-tertiary">
            {isExpanded ? "Hide" : "Show"}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-text-tertiary" />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-tertiary" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-md pb-md">
          <div className="border-t border-border-secondary pt-md">
            <div className="text-body-small text-text-secondary whitespace-pre-wrap break-words leading-relaxed font-mono bg-bg-primary rounded-md p-sm border border-border-secondary">
              {content}
              {isPartial && (
                <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1 rounded-sm" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ThinkingSectionsProps {
  sections: string[]
  partialThinking?: string | null
  className?: string
}

export function ThinkingSections({ sections, partialThinking, className }: ThinkingSectionsProps) {
  const hasContent = sections.length > 0 || (partialThinking && partialThinking.trim())
  
  if (!hasContent) {
    return null
  }

  return (
    <div className={cn("space-y-sm", className)}>
      {sections.map((section, index) => (
        <ThinkingSection
          key={index}
          content={section}
          isPartial={false}
        />
      ))}
      {partialThinking && partialThinking.trim() && (
        <ThinkingSection
          content={partialThinking}
          isPartial={true}
        />
      )}
    </div>
  )
}