import { parseMessageContent, parseStreamingContent } from '@/lib/content-parser'
import { mockThinkingContent, mockMarkdownContent } from '../../mocks/data'

describe('Content Parser', () => {
  describe('parseMessageContent', () => {
    it('should parse thinking sections correctly', () => {
      const content = `
<thinking>
This is a thinking section.
Let me analyze this step by step.
</thinking>

This is the main response content.
`

      const result = parseMessageContent(content)

      expect(result.hasThinking).toBe(true)
      expect(result.thinkingSections).toHaveLength(1)
      expect(result.thinkingSections[0]).toContain('This is a thinking section.')
      expect(result.thinkingSections[0]).toContain('Let me analyze this step by step.')
      expect(result.mainContent).toBe('This is the main response content.')
    })

    it('should handle multiple thinking sections', () => {
      const content = `
<thinking>
First thinking section.
</thinking>

Some content here.

<thinking>
Second thinking section.
</thinking>

More content.
`

      const result = parseMessageContent(content)

      expect(result.hasThinking).toBe(true)
      expect(result.thinkingSections).toHaveLength(2)
      expect(result.thinkingSections[0]).toContain('First thinking section.')
      expect(result.thinkingSections[1]).toContain('Second thinking section.')
      expect(result.mainContent).toBe('Some content here.\n\nMore content.')
    })

    it('should handle content without thinking sections', () => {
      const content = 'This is just regular content without thinking sections.'

      const result = parseMessageContent(content)

      expect(result.hasThinking).toBe(false)
      expect(result.thinkingSections).toHaveLength(0)
      expect(result.mainContent).toBe(content)
    })

    it('should handle empty content', () => {
      const result = parseMessageContent('')

      expect(result.hasThinking).toBe(false)
      expect(result.thinkingSections).toHaveLength(0)
      expect(result.mainContent).toBe('')
    })

    it('should handle malformed thinking tags', () => {
      const content = `
<thinking>
Unclosed thinking section.

This should still be parsed correctly.
`

      const result = parseMessageContent(content)

      expect(result.hasThinking).toBe(false)
      expect(result.thinkingSections).toHaveLength(0)
      expect(result.mainContent).toBe(content)
    })

    it('should handle nested thinking tags', () => {
      const content = `
<thinking>
Outer thinking section.
<thinking>
This should not create nested sections.
</thinking>
End of outer section.
</thinking>

Main content.
`

      const result = parseMessageContent(content)

      expect(result.hasThinking).toBe(true)
      expect(result.thinkingSections).toHaveLength(1)
      expect(result.thinkingSections[0]).toContain('Outer thinking section.')
      expect(result.thinkingSections[0]).toContain('This should not create nested sections.')
      expect(result.mainContent).toBe('Main content.')
    })

    it('should preserve whitespace in thinking sections', () => {
      const content = `
<thinking>
  Indented content
    More indented
  Back to less indented
</thinking>

Main content.
`

      const result = parseMessageContent(content)

      expect(result.hasThinking).toBe(true)
      expect(result.thinkingSections[0]).toContain('  Indented content')
      expect(result.thinkingSections[0]).toContain('    More indented')
      expect(result.thinkingSections[0]).toContain('  Back to less indented')
    })

    it('should handle thinking sections with special characters', () => {
      const content = `
<thinking>
Special characters: !@#$%^&*()
Unicode: 🤔💭🧠
HTML entities: &lt;&gt;&amp;
</thinking>

Main response.
`

      const result = parseMessageContent(content)

      expect(result.hasThinking).toBe(true)
      expect(result.thinkingSections[0]).toContain('Special characters: !@#$%^&*()')
      expect(result.thinkingSections[0]).toContain('Unicode: 🤔💭🧠')
      expect(result.thinkingSections[0]).toContain('HTML entities: &lt;&gt;&amp;')
    })
  })

  describe('parseStreamingContent', () => {
    it('should parse streaming chunks correctly', () => {
      const chunks = [
        '{"message":{"role":"assistant","content":"Hello"},"done":false}',
        '{"message":{"role":"assistant","content":" there"},"done":false}',
        '{"message":{"role":"assistant","content":"!"},"done":false}',
        '{"done":true}',
      ]

      let result = ''
      chunks.forEach(chunk => {
        result = parseStreamingContent(chunk, result)
      })

      expect(result).toBe('Hello there!')
    })

    it('should handle invalid JSON chunks gracefully', () => {
      const chunks = [
        '{"message":{"role":"assistant","content":"Hello"},"done":false}',
        'invalid json',
        '{"message":{"role":"assistant","content":" world"},"done":false}',
        '{"done":true}',
      ]

      let result = ''
      chunks.forEach(chunk => {
        result = parseStreamingContent(chunk, result)
      })

      expect(result).toBe('Hello world')
    })

    it('should handle empty chunks', () => {
      const chunks = [
        '{"message":{"role":"assistant","content":"Hello"},"done":false}',
        '',
        '{"message":{"role":"assistant","content":" world"},"done":false}',
      ]

      let result = ''
      chunks.forEach(chunk => {
        result = parseStreamingContent(chunk, result)
      })

      expect(result).toBe('Hello world')
    })

    it('should handle chunks without content', () => {
      const chunks = [
        '{"message":{"role":"assistant"},"done":false}',
        '{"message":{"role":"assistant","content":"Hello"},"done":false}',
        '{"done":true}',
      ]

      let result = ''
      chunks.forEach(chunk => {
        result = parseStreamingContent(chunk, result)
      })

      expect(result).toBe('Hello')
    })

    it('should handle thinking sections in streaming', () => {
      const chunks = [
        '{"message":{"role":"assistant","content":"<thinking>"},"done":false}',
        '{"message":{"role":"assistant","content":"\\nLet me think..."},"done":false}',
        '{"message":{"role":"assistant","content":"\\n</thinking>"},"done":false}',
        '{"message":{"role":"assistant","content":"\\n\\nHere is my response."},"done":false}',
        '{"done":true}',
      ]

      let result = ''
      chunks.forEach(chunk => {
        result = parseStreamingContent(chunk, result)
      })

      expect(result).toBe('<thinking>\nLet me think...\n</thinking>\n\nHere is my response.')
    })

    it('should handle unicode characters in streaming', () => {
      const chunks = [
        '{"message":{"role":"assistant","content":"Hello 🌍"},"done":false}',
        '{"message":{"role":"assistant","content":" 你好"},"done":false}',
        '{"message":{"role":"assistant","content":" مرحبا"},"done":false}',
        '{"done":true}',
      ]

      let result = ''
      chunks.forEach(chunk => {
        result = parseStreamingContent(chunk, result)
      })

      expect(result).toBe('Hello 🌍 你好 مرحبا')
    })

    it('should handle escaped characters in JSON', () => {
      const chunks = [
        '{"message":{"role":"assistant","content":"Quote: \\"Hello\\""},"done":false}',
        '{"message":{"role":"assistant","content":" Newline:\\n"},"done":false}',
        '{"message":{"role":"assistant","content":"Tab:\\t"},"done":false}',
        '{"done":true}',
      ]

      let result = ''
      chunks.forEach(chunk => {
        result = parseStreamingContent(chunk, result)
      })

      expect(result).toBe('Quote: "Hello" Newline:\nTab:\t')
    })

    it('should handle large content chunks', () => {
      const largeContent = 'A'.repeat(10000)
      const chunk = `{"message":{"role":"assistant","content":"${largeContent}"},"done":false}`

      const result = parseStreamingContent(chunk, '')

      expect(result).toBe(largeContent)
      expect(result.length).toBe(10000)
    })

    it('should handle malformed streaming data', () => {
      const chunks = [
        '{"message":{"role":"assistant","content":"Hello"},"done":false}',
        '{"malformed": json}',
        '{"message":{"role":"assistant","content":" world"},"done":false}',
      ]

      let result = ''
      chunks.forEach(chunk => {
        result = parseStreamingContent(chunk, result)
      })

      expect(result).toBe('Hello world')
    })

    it('should handle streaming with metadata', () => {
      const chunks = [
        '{"message":{"role":"assistant","content":"Hello","metadata":{"model":"llama3.2"}},"done":false}',
        '{"message":{"role":"assistant","content":" world"},"done":false}',
        '{"done":true,"metadata":{"total_tokens":10}}',
      ]

      let result = ''
      chunks.forEach(chunk => {
        result = parseStreamingContent(chunk, result)
      })

      expect(result).toBe('Hello world')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null and undefined inputs', () => {
      expect(() => parseMessageContent(null as any)).not.toThrow()
      expect(() => parseMessageContent(undefined as any)).not.toThrow()
      expect(() => parseStreamingContent(null as any, '')).not.toThrow()
      expect(() => parseStreamingContent('', null as any)).not.toThrow()
    })

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(100000)
      const result = parseMessageContent(longContent)

      expect(result.mainContent).toBe(longContent)
      expect(result.hasThinking).toBe(false)
    })

    it('should handle content with only thinking sections', () => {
      const content = `
<thinking>
Only thinking, no main content.
</thinking>
`

      const result = parseMessageContent(content)

      expect(result.hasThinking).toBe(true)
      expect(result.thinkingSections).toHaveLength(1)
      expect(result.mainContent.trim()).toBe('')
    })

    it('should handle mixed line endings', () => {
      const content = '<thinking>\r\nWindows line endings\r\n</thinking>\n\nUnix line endings\n'

      const result = parseMessageContent(content)

      expect(result.hasThinking).toBe(true)
      expect(result.thinkingSections[0]).toContain('Windows line endings')
      expect(result.mainContent).toContain('Unix line endings')
    })

    it('should handle content with HTML-like tags that are not thinking', () => {
      const content = `
<div>This is not a thinking section</div>
<span>Neither is this</span>
<thinking>But this is</thinking>
Regular content.
`

      const result = parseMessageContent(content)

      expect(result.hasThinking).toBe(true)
      expect(result.thinkingSections).toHaveLength(1)
      expect(result.mainContent).toContain('<div>This is not a thinking section</div>')
      expect(result.mainContent).toContain('<span>Neither is this</span>')
      expect(result.mainContent).toContain('Regular content.')
    })
  })

  describe('Performance', () => {
    it('should handle large number of thinking sections efficiently', () => {
      let content = ''
      for (let i = 0; i < 100; i++) {
        content += `<thinking>Thinking section ${i}</thinking>\nContent ${i}\n`
      }

      const startTime = Date.now()
      const result = parseMessageContent(content)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
      expect(result.thinkingSections).toHaveLength(100)
    })

    it('should handle rapid streaming updates efficiently', () => {
      const chunks = Array.from({ length: 1000 }, (_, i) => 
        `{"message":{"role":"assistant","content":"${i} "},"done":false}`
      )

      const startTime = Date.now()
      let result = ''
      chunks.forEach(chunk => {
        result = parseStreamingContent(chunk, result)
      })
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
      expect(result.split(' ')).toHaveLength(1001) // 1000 numbers + empty string at end
    })
  })
})