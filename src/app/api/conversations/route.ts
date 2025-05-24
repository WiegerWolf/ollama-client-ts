import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 1 // Just get the first message for preview
        },
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

    const body = await request.json()
    const { title, model, settings } = body

    if (!title || !model) {
      return NextResponse.json(
        { error: 'Title and model are required' }, 
        { status: 400 }
      )
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title,
        model,
        settings: settings ? JSON.stringify(settings) : null
      }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}