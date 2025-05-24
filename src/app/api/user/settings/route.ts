import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use upsert to handle race conditions
    const userSettings = await prisma.userSettings.upsert({
      where: {
        userId: session.user.id
      },
      update: {},
      create: {
        userId: session.user.id,
        defaultModel: 'llama3.2',
        defaultTemperature: 0.7,
        ollamaUrl: 'http://localhost:11434',
        preferences: JSON.stringify({
          theme: 'light',
          maxTokens: 2048,
          systemPrompt: ''
        })
      }
    })

    // Parse preferences JSON
    const preferences = userSettings.preferences ? JSON.parse(userSettings.preferences) : {}

    return NextResponse.json({
      id: userSettings.id,
      defaultModel: userSettings.defaultModel,
      defaultTemperature: userSettings.defaultTemperature,
      ollamaUrl: userSettings.ollamaUrl,
      theme: preferences.theme || 'light',
      maxTokens: preferences.maxTokens || 2048,
      systemPrompt: preferences.systemPrompt || '',
      updatedAt: userSettings.updatedAt
    })
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      defaultModel, 
      defaultTemperature, 
      ollamaUrl, 
      theme, 
      maxTokens, 
      systemPrompt 
    } = body

    // Validate input
    if (defaultTemperature !== undefined && (defaultTemperature < 0 || defaultTemperature > 2)) {
      return NextResponse.json(
        { error: 'Temperature must be between 0 and 2' }, 
        { status: 400 }
      )
    }

    if (maxTokens !== undefined && (maxTokens < 1 || maxTokens > 8192)) {
      return NextResponse.json(
        { error: 'Max tokens must be between 1 and 8192' }, 
        { status: 400 }
      )
    }

    // Prepare preferences object
    const preferences = {
      theme: theme || 'light',
      maxTokens: maxTokens || 2048,
      systemPrompt: systemPrompt || ''
    }

    // Update or create user settings
    const userSettings = await prisma.userSettings.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        ...(defaultModel && { defaultModel }),
        ...(defaultTemperature !== undefined && { defaultTemperature }),
        ...(ollamaUrl && { ollamaUrl }),
        preferences: JSON.stringify(preferences)
      },
      create: {
        userId: session.user.id,
        defaultModel: defaultModel || 'llama3.2',
        defaultTemperature: defaultTemperature !== undefined ? defaultTemperature : 0.7,
        ollamaUrl: ollamaUrl || 'http://localhost:11434',
        preferences: JSON.stringify(preferences)
      }
    })

    // Parse preferences for response
    const parsedPreferences = JSON.parse(userSettings.preferences || '{}')

    return NextResponse.json({
      id: userSettings.id,
      defaultModel: userSettings.defaultModel,
      defaultTemperature: userSettings.defaultTemperature,
      ollamaUrl: userSettings.ollamaUrl,
      theme: parsedPreferences.theme || 'light',
      maxTokens: parsedPreferences.maxTokens || 2048,
      systemPrompt: parsedPreferences.systemPrompt || '',
      updatedAt: userSettings.updatedAt
    })
  } catch (error) {
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}