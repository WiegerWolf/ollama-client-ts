export interface ParsedContent {
  thinkingSections: string[]
  regularContent: string
  isMarkdown?: boolean
}

/**
 * Parses message content to extract thinking sections and regular content
 * @param content The raw message content
 * @returns Object containing thinking sections and regular content
 */
export function parseMessageContent(content: string): ParsedContent {
  const thinkingSections: string[] = []
  let regularContent = content

  // Regular expression to match <think>...</think> tags
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi
  let match

  // Extract all thinking sections
  while ((match = thinkRegex.exec(content)) !== null) {
    thinkingSections.push(match[1].trim())
  }

  // Remove thinking sections from regular content
  regularContent = content.replace(thinkRegex, '').trim()

  // Detect if content should be rendered as markdown
  const isMarkdown = detectMarkdown(regularContent)

  return {
    thinkingSections,
    regularContent,
    isMarkdown
  }
}

/**
 * Parses streaming content to handle partial thinking tags
 * @param content The streaming content
 * @returns Object containing complete thinking sections, partial thinking content, and regular content
 */
export function parseStreamingContent(content: string): {
  thinkingSections: string[]
  partialThinking: string | null
  regularContent: string
  isMarkdown?: boolean
} {
  const thinkingSections: string[] = []
  let regularContent = content
  let partialThinking: string | null = null

  // Find complete thinking sections
  const completeThinkRegex = /<think>([\s\S]*?)<\/think>/gi
  let match

  while ((match = completeThinkRegex.exec(content)) !== null) {
    thinkingSections.push(match[1].trim())
  }

  // Remove complete thinking sections
  regularContent = content.replace(completeThinkRegex, '')

  // Check for partial thinking section (opening tag without closing)
  const partialThinkMatch = regularContent.match(/<think>([\s\S]*)$/i)
  if (partialThinkMatch) {
    partialThinking = partialThinkMatch[1]
    regularContent = regularContent.replace(/<think>[\s\S]*$/i, '')
  }

  regularContent = regularContent.trim()

  // Detect if content should be rendered as markdown (only for complete content)
  const isMarkdown = regularContent && !partialThinking ? detectMarkdown(regularContent) : undefined

  return {
    thinkingSections,
    partialThinking,
    regularContent,
    isMarkdown
  }
}

/**
 * Detects if content contains markdown syntax
 * @param content The content to analyze
 * @returns true if markdown syntax is detected
 */
function detectMarkdown(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false
  }

  // Common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s+/m,           // Headers
    /\*\*.*?\*\*/,           // Bold
    /\*.*?\*/,               // Italic
    /`.*?`/,                 // Inline code
    /```[\s\S]*?```/,        // Code blocks
    /^\s*[-*+]\s+/m,         // Unordered lists
    /^\s*\d+\.\s+/m,         // Ordered lists
    /^\s*>\s+/m,             // Blockquotes
    /\[.*?\]\(.*?\)/,        // Links
    /!\[.*?\]\(.*?\)/,       // Images
    /^\s*\|.*\|.*$/m,        // Tables
    /^---+$/m,               // Horizontal rules
    /~~.*?~~/,               // Strikethrough
  ]

  return markdownPatterns.some(pattern => pattern.test(content))
}