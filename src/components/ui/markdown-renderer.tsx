"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useChatStore } from '@/stores/chat-store'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const { theme } = useChatStore()
  const isDark = theme === 'dark'

  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-heading-large text-text-primary font-semibold mb-lg mt-xl first:mt-0 border-b border-border-primary pb-sm">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-heading-medium text-text-primary font-semibold mb-md mt-lg first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-body-large text-text-primary font-semibold mb-sm mt-lg first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-body-medium text-text-primary font-semibold mb-sm mt-md first:mt-0">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-body-medium text-text-primary font-medium mb-sm mt-md first:mt-0">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-body-small text-text-secondary font-medium mb-sm mt-md first:mt-0">
              {children}
            </h6>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-body-medium text-text-primary leading-relaxed mb-md last:mb-0">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-xs mb-md ml-lg text-body-medium text-text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-xs mb-md ml-lg text-body-medium text-text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary-blue hover:text-primary-blue-hover underline underline-offset-2 transition-colors duration-150"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),

          // Emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-text-primary">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-text-primary">{children}</em>
          ),

          // Code
          code: ({ className, children, ...props }: any) => {
            const inline = !className
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''

            if (inline) {
              return (
                <code
                  className="text-code bg-bg-tertiary text-text-primary px-xs py-xs rounded border border-border-primary"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <div className="my-md">
                <SyntaxHighlighter
                  style={isDark ? oneDark : oneLight}
                  language={language}
                  PreTag="div"
                  className="rounded-lg border border-border-primary"
                  customStyle={{
                    margin: 0,
                    fontSize: 'var(--font-size-code)',
                    lineHeight: 'var(--line-height-code)',
                    fontFamily: 'var(--font-family-mono)',
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            )
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-border-secondary pl-lg my-md bg-bg-secondary rounded-r-lg py-md">
              <div className="text-body-medium text-text-secondary italic">
                {children}
              </div>
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-md">
              <table className="min-w-full border border-border-primary rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-bg-secondary">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-bg-primary">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border-primary last:border-b-0">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-lg py-md text-left text-body-medium font-semibold text-text-primary border-r border-border-primary last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-lg py-md text-body-medium text-text-primary border-r border-border-primary last:border-r-0">
              {children}
            </td>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="my-xl border-0 h-px bg-gradient-to-r from-transparent via-border-primary to-transparent" />
          ),

          // Images
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg border border-border-primary my-md"
            />
          ),

          // Task lists (GitHub Flavored Markdown)
          input: ({ type, checked, disabled }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  className="mr-sm accent-primary-blue"
                  readOnly
                />
              )
            }
            return <input type={type} checked={checked} disabled={disabled} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}