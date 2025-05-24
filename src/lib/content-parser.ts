export interface ParsedContent {
  thinkingSections: string[]
  regularContent: string
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

  return {
    thinkingSections,
    regularContent
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

  return {
    thinkingSections,
    partialThinking,
    regularContent
  }
}