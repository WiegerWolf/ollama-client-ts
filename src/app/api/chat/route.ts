import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ChatMessage } from '@/lib/ollama-client'
import { generateConversationTitle } from '@/lib/utils'

export async function POST(request: NextRequest) {
  // Create an AbortController to handle cancellation
  const abortController = new AbortController()
  let ollamaReader: ReadableStreamDefaultReader<Uint8Array> | null = null
  let isRequestCancelled = false
  let partialAssistantMessage = ''
  
  // Set up cancellation timeout (30 seconds)
  const cancellationTimeout = setTimeout(() => {
    if (!abortController.signal.aborted) {
      console.log('Cancellation timeout reached, aborting request')
      abortController.abort()
    }
  }, 30000)

  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      clearTimeout(cancellationTimeout)
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
      clearTimeout(cancellationTimeout)
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

    // Listen for client disconnection
    request.signal.addEventListener('abort', () => {
      console.log('Client disconnected, aborting Ollama request')
      isRequestCancelled = true
      abortController.abort()
    })

    // Forward request to Ollama with abort signal
    const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ollamaRequest),
      signal: abortController.signal
    })

    if (!ollamaResponse.ok) {
      clearTimeout(cancellationTimeout)
      if (abortController.signal.aborted) {
        return NextResponse.json(
          { error: 'Request cancelled', cancelled: true }, 
          { status: 499 }
        )
      }
      return NextResponse.json(
        { error: 'Ollama server error' }, 
        { status: ollamaResponse.status }
      )
    }

    if (stream) {
      // Handle streaming response with cancellation support
      const encoder = new TextEncoder()
      let assistantMessage = ''

      const readableStream = new ReadableStream({
        async start(controller) {
          ollamaReader = ollamaResponse.body?.getReader() || null
          if (!ollamaReader) {
            controller.close()
            clearTimeout(cancellationTimeout)
            return
          }

          const decoder = new TextDecoder()

          try {
            while (true) {
              // Check for cancellation before each read
              if (abortController.signal.aborted || isRequestCancelled) {
                console.log('Request cancelled during streaming')
                break
              }

              const { done, value } = await ollamaReader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n').filter(line => line.trim())

              for (const line of lines) {
                // Check for cancellation before processing each line
                if (abortController.signal.aborted || isRequestCancelled) {
                  break
                }

                try {
                  const data = JSON.parse(line)
                  
                  if (data.message?.content) {
                    assistantMessage += data.message.content
                    partialAssistantMessage = assistantMessage
                  }

                  // Forward the chunk to the client
                  controller.enqueue(encoder.encode(line + '\n'))

                  // If this is the final chunk, save to database
                  if (data.done && conversationId && !isRequestCancelled) {
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

              if (abortController.signal.aborted || isRequestCancelled) {
                break
              }
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              console.log('Ollama request aborted')
              isRequestCancelled = true
            } else {
              console.error('Streaming error:', error)
            }
          } finally {
            // Clean up resources
            if (ollamaReader) {
              try {
                ollamaReader.releaseLock()
              } catch (cleanupError) {
                console.error('Error during reader cleanup:', cleanupError)
              }
            }

            // Handle partial database write for cancelled requests
            if (isRequestCancelled && conversationId && partialAssistantMessage.trim()) {
              try {
                await saveMessageToDatabase(
                  conversationId,
                  session.user.id,
                  messages[messages.length - 1], // Last user message
                  { role: 'assistant', content: partialAssistantMessage + '\n\n[Response cancelled]' },
                  model
                )
                console.log('Saved partial message due to cancellation')
              } catch (dbError) {
                console.error('Error saving partial message:', dbError)
              }
            }

            controller.close()
            clearTimeout(cancellationTimeout)
          }
        },
        
        cancel() {
          console.log('ReadableStream cancelled by client')
          isRequestCancelled = true
          abortController.abort()
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
      
      if (conversationId && data.message && !isRequestCancelled) {
        await saveMessageToDatabase(
          conversationId,
          session.user.id,
          messages[messages.length - 1], // Last user message
          data.message,
          model
        )
      }

      clearTimeout(cancellationTimeout)
      return NextResponse.json(data)
    }
  } catch (error) {
    clearTimeout(cancellationTimeout)
    
    // Clean up Ollama reader if it exists
    if (ollamaReader) {
      try {
        ollamaReader.releaseLock()
      } catch (cleanupError) {
        console.error('Error during reader cleanup in catch block:', cleanupError)
      }
    }

    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request aborted:', error.message)
      return NextResponse.json(
        { error: 'Request cancelled', cancelled: true }, 
        { status: 499 }
      )
    }

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

    // For now, use the conversation's model field instead of currentModel
    const modelChanged = conversation.model !== model
    const messageCount = conversation._count.messages

    // Execute operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Save user message
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

      // Update conversation's model if needed
      if (modelChanged) {
        await tx.conversation.update({
          where: { id: conversationId },
          data: {
            model: model,
            updatedAt: new Date()
          }
        })

        console.log(`Model changed in conversation ${conversationId}: ${conversation.model} -> ${model}`)
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