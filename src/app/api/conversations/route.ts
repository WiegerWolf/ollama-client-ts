import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateConversationTitle } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body
    try {
      const requestText = await request.text()
      if (!requestText.trim()) {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        )
      }
      body = JSON.parse(requestText)
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { title, model, settings, firstMessage } = body

    // Validate title length if provided
    if (title && title.length > 500) {
      return NextResponse.json(
        { error: 'Title too long' },
        { status: 400 }
      )
    }

    // Generate title from first message if provided, otherwise use default
    let conversationTitle = title ? title.trim() : 'New Conversation'
    if (firstMessage && firstMessage.trim()) {
      conversationTitle = generateConversationTitle(firstMessage)
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: conversationTitle,
        model: model || 'llama3.2',
        currentModel: model || 'llama3.2', // Set currentModel to the initial model
        ...(settings && { settings: JSON.stringify(settings) })
      }
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}