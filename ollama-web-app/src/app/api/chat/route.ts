import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ChatMessage } from '@/lib/ollama-client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      model, 
      messages, 
      conversationId, 
      temperature, 
      stream = true 
    }: {
      model: string
      messages: ChatMessage[]
      conversationId?: string
      temperature?: number
      stream?: boolean
    } = body

    if (!model || !messages || messages.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get Ollama base URL from environment
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

    // Prepare request to Ollama
    const ollamaRequest = {
      model,
      messages,
      stream,
      ...(temperature !== undefined && {
        options: { temperature }
      })
    }

    // Forward request to Ollama
    const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ollamaRequest),
    })

    if (!ollamaResponse.ok) {
      return NextResponse.json(
        { error: 'Ollama server error' }, 
        { status: ollamaResponse.status }
      )
    }

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder()
      let assistantMessage = ''

      const readableStream = new ReadableStream({
        async start(controller) {
          const reader = ollamaResponse.body?.getReader()
          if (!reader) {
            controller.close()
            return
          }

          const decoder = new TextDecoder()

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n').filter(line => line.trim())

              for (const line of lines) {
                try {
                  const data = JSON.parse(line)
                  
                  if (data.message?.content) {
                    assistantMessage += data.message.content
                  }

                  // Forward the chunk to the client
                  controller.enqueue(encoder.encode(line + '\n'))

                  // If this is the final chunk, save to database
                  if (data.done && conversationId) {
                    await saveMessageToDatabase(
                      conversationId,
                      session.user.id,
                      messages[messages.length - 1], // Last user message
                      { role: 'assistant', content: assistantMessage }
                    )
                  }
                } catch (parseError) {
                  // Skip invalid JSON lines
                  continue
                }
              }
            }
          } catch (error) {
            console.error('Streaming error:', error)
          } finally {
            reader.releaseLock()
            controller.close()
          }
        }
      })

      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Handle non-streaming response
      const data = await ollamaResponse.json()
      
      if (conversationId && data.message) {
        await saveMessageToDatabase(
          conversationId,
          session.user.id,
          messages[messages.length - 1], // Last user message
          data.message
        )
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

async function saveMessageToDatabase(
  conversationId: string,
  userId: string,
  userMessage: ChatMessage,
  assistantMessage: ChatMessage
) {
  try {
    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: userId
      }
    })

    if (!conversation) {
      console.error('Conversation not found or unauthorized')
      return
    }

    // Save both messages in a transaction
    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          role: userMessage.role,
          content: userMessage.content,
          metadata: userMessage.images || userMessage.tool_calls 
            ? JSON.stringify({ 
                images: userMessage.images, 
                tool_calls: userMessage.tool_calls 
              })
            : null
        }
      }),
      prisma.message.create({
        data: {
          conversationId,
          role: assistantMessage.role,
          content: assistantMessage.content,
          metadata: assistantMessage.tool_calls 
            ? JSON.stringify({ tool_calls: assistantMessage.tool_calls })
            : null
        }
      })
    ])
  } catch (error) {
    console.error('Error saving messages to database:', error)
  }
}