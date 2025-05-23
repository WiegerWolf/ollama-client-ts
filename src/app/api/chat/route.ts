import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ChatMessage } from '@/lib/ollama-client'
import { generateConversationTitle } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
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
                      { role: 'assistant', content: assistantMessage },
                      model
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
          data.message,
          model
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
  assistantMessage: ChatMessage,
  model: string
) {
  try {
    // Verify the conversation belongs to the user and get current state
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: userId
      },
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    if (!conversation) {
      console.error('Conversation not found or unauthorized')
      return
    }

    // Check if this is the first user message and conversation has default title
    const isFirstMessage = conversation._count.messages === 0
    const hasDefaultTitle = conversation.title === 'New Conversation'
    const shouldGenerateTitle = isFirstMessage && hasDefaultTitle && userMessage.content.trim()

    // Check if model has changed from conversation's current model
    const modelChanged = conversation.currentModel !== model
    const messageCount = conversation._count.messages

    // Execute operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Save user message with 'user' as model
      await tx.message.create({
        data: {
          conversationId,
          role: userMessage.role,
          content: userMessage.content,
          model: 'user', // User messages always use 'user' as model
          metadata: userMessage.images || userMessage.tool_calls
            ? JSON.stringify({
                images: userMessage.images,
                tool_calls: userMessage.tool_calls
              })
            : null
        }
      })

      // Save assistant message with the actual model used
      await tx.message.create({
        data: {
          conversationId,
          role: assistantMessage.role,
          content: assistantMessage.content,
          model: model, // Store the model that generated this response
          metadata: assistantMessage.tool_calls
            ? JSON.stringify({ tool_calls: assistantMessage.tool_calls })
            : null
        }
      })

      // Update conversation's currentModel and record model change if needed
      if (modelChanged) {
        await tx.conversation.update({
          where: { id: conversationId },
          data: {
            currentModel: model,
            updatedAt: new Date()
          }
        })

        // Record the model change
        await tx.modelChange.create({
          data: {
            conversationId,
            fromModel: conversation.currentModel,
            toModel: model,
            messageIndex: messageCount + 1 // Position where the change occurred (after user message)
          }
        })

        console.log(`Model changed in conversation ${conversationId}: ${conversation.currentModel} -> ${model}`)
      }

      // Update conversation title if this is the first message
      if (shouldGenerateTitle) {
        const newTitle = generateConversationTitle(userMessage.content)
        await tx.conversation.update({
          where: { id: conversationId },
          data: {
            title: newTitle,
            updatedAt: new Date()
          }
        })
      }
    })

    // Log title generation for debugging
    if (shouldGenerateTitle) {
      console.log(`Generated title for conversation ${conversationId}: "${generateConversationTitle(userMessage.content)}"`)
    }
  } catch (error) {
    console.error('Error saving messages to database:', error)
  }
}