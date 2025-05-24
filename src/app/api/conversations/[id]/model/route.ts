import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { model } = body

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      )
    }

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: id,
        userId: session.user.id
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
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check if model is actually changing
    if (conversation.model === model) {
      return NextResponse.json({
        message: 'Model is already set to this value',
        conversation
      })
    }

    // Update conversation's current model and create system message
    const updatedConversation = await prisma.$transaction(async (tx) => {
      // Update the conversation's current model
      const updated = await tx.conversation.update({
        where: { id: id },
        data: {
          model: model,
          updatedAt: new Date()
        }
      })

      // Create system message for model change
      const systemMessageContent = conversation.model 
        ? `Model changed from ${conversation.model} to ${model}`
        : `Model set to ${model}`

      const systemMessage = await tx.message.create({
        data: {
          conversationId: id,
          role: 'system',
          content: systemMessageContent,
          model: model, // Add the model field
          metadata: JSON.stringify({
            type: 'model_change',
            fromModel: conversation.model,
            toModel: model,
            messageIndex: conversation._count.messages
          })
        }
      })

      // Note: ModelChange tracking removed for now due to TypeScript issues
      // The system message above serves as the primary record of model changes

      return { conversation: updated, systemMessage }
    })

    console.log(`Model switched in conversation ${id}: ${conversation.model} -> ${model}`)

    return NextResponse.json({
      message: 'Model updated successfully',
      conversation: updatedConversation.conversation,
      systemMessage: updatedConversation.systemMessage,
      modelChange: {
        from: conversation.model,
        to: model
      }
    })
  } catch (error) {
    console.error('Error updating conversation model:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}