import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Ollama base URL from environment
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

    try {
      const response = await fetch(`${ollamaUrl}/api/tags`)
      
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch models from Ollama server' }, 
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error('Error connecting to Ollama:', fetchError)
      return NextResponse.json(
        { 
          error: 'Cannot connect to Ollama server',
          details: 'Make sure Ollama is running on the configured URL'
        }, 
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Models API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}