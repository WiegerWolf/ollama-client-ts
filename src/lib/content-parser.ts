export interface ParsedContent {
  thinkingSections: string[]
  hasThinking: boolean
  mainContent: string
  regularContent: string
  isMarkdown?: boolean
}

/**
 * Parses message content to extract thinking sections and regular content
 * @param content The raw message content
 * @returns Object containing thinking sections and regular content
 */
export function parseMessageContent(content: string): ParsedContent {
  // Handle null/undefined inputs
  if (!content) {
    return {
      thinkingSections: [],
      hasThinking: false,
      mainContent: '',
      regularContent: '',
      isMarkdown: false
    }
  }

  const thinkingSections: string[] = []
  let regularContent = content

  // Check if we have properly closed thinking tags
  const openTags = (content.match(/<thinking>/gi) || []).length
  const closeTags = (content.match(/<\/thinking>/gi) || []).length
  
  // Only process if we have matching open/close tags
  if (openTags === closeTags && openTags > 0) {
    // Handle nested thinking tags by finding balanced pairs
    let currentPos = 0
    
    while (currentPos < content.length) {
      const openIndex = content.indexOf('<thinking>', currentPos)
      if (openIndex === -1) break
      
      // Find the matching closing tag by counting nested levels
      let depth = 1
      let searchPos = openIndex + 10 // Start after '<thinking>'
      let closeIndex = -1
      
      while (searchPos < content.length && depth > 0) {
        const nextOpen = content.indexOf('<thinking>', searchPos)
        const nextClose = content.indexOf('</thinking>', searchPos)
        
        if (nextClose === -1) break // No more closing tags
        
        if (nextOpen !== -1 && nextOpen < nextClose) {
          // Found another opening tag before the next closing tag
          depth++
          searchPos = nextOpen + 10
        } else {
          // Found a closing tag
          depth--
          if (depth === 0) {
            closeIndex = nextClose
            break
          }
          searchPos = nextClose + 11
        }
      }
      
      if (closeIndex !== -1) {
        // Extract the content between the balanced tags
        const thinkingContent = content.substring(openIndex + 10, closeIndex)
        thinkingSections.push(thinkingContent)
        
        // Remove this thinking section from regular content
        const fullTag = content.substring(openIndex, closeIndex + 11)
        regularContent = regularContent.replace(fullTag, '')
        
        currentPos = closeIndex + 11
      } else {
        break // No matching closing tag found
      }
    }
    
    // Clean up extra newlines but preserve structure
    regularContent = regularContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
  }

  // Detect if content should be rendered as markdown
  const isMarkdown = detectMarkdown(regularContent)

  return {
    thinkingSections,
    hasThinking: thinkingSections.length > 0,
    mainContent: regularContent,
    regularContent,
    isMarkdown
  }
}

/**
 * Parses streaming content chunks and accumulates the result
 * @param chunk The streaming chunk (JSON string)
 * @param accumulated The accumulated content so far
 * @returns The updated accumulated content
 */
export function parseStreamingContent(chunk: string, accumulated: string = ''): string {
  // Handle null/undefined inputs
  if (!chunk) {
    return accumulated || ''
  }

  try {
    const parsed = JSON.parse(chunk)
    
    // Extract content from the message
    if (parsed.message && parsed.message.content) {
      return accumulated + parsed.message.content
    }
    
    // Return accumulated content if no new content in this chunk
    return accumulated
  } catch (error) {
    // If JSON parsing fails, return accumulated content
    return accumulated
  }
}

/**
 * Parses complete content to handle thinking tags (for backward compatibility)
 * @param content The complete content
 * @returns Object containing complete thinking sections, partial thinking content, and regular content
 */
export function parseCompleteStreamingContent(content: string): {
  thinkingSections: string[]
  partialThinking: string | null
  regularContent: string
  isMarkdown?: boolean
} {
  // Handle null/undefined inputs
  if (!content) {
    return {
      thinkingSections: [],
      partialThinking: null,
      regularContent: '',
      isMarkdown: false
    }
  }

  const thinkingSections: string[] = []
  let regularContent = content
  let partialThinking: string | null = null

  // Find complete thinking sections
  const completeThinkRegex = /<thinking>([\s\S]*?)<\/thinking>/gi
  let match

  while ((match = completeThinkRegex.exec(content)) !== null) {
    thinkingSections.push(match[1].trim())
  }

  // Remove complete thinking sections
  regularContent = content.replace(completeThinkRegex, '')

  // Check for partial thinking section (opening tag without closing)
  const partialThinkMatch = regularContent.match(/<thinking>([\s\S]*)$/i)
  if (partialThinkMatch) {
    partialThinking = partialThinkMatch[1]
    regularContent = regularContent.replace(/<thinking>[\s\S]*$/i, '')
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