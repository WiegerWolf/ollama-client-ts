"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

export default function CancellationTestPage() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [output, setOutput] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testCancellation = async () => {
    setIsStreaming(true)
    setOutput('')
    setLogs([])
    
    // Create new AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    addLog('Starting request...')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [
            { role: 'user', content: 'Write a very long story about space exploration. Make it at least 500 words and take your time.' }
          ],
          stream: true
        }),
        signal: abortController.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      addLog('Response received, starting to read stream...')

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        // Check if request was aborted
        if (abortController.signal.aborted) {
          addLog('Request was aborted')
          break
        }

        const { done, value } = await reader.read()
        if (done) {
          addLog('Stream completed')
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            
            if (data.message?.content) {
              content += data.message.content
              setOutput(content)
            }

            if (data.done) {
              addLog('Response completed')
            }
          } catch (parseError) {
            // Skip invalid JSON lines
            continue
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        addLog('✅ Request successfully cancelled!')
      } else {
        addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const cancelRequest = () => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      addLog('Cancelling request...')
      abortControllerRef.current.abort()
    }
  }

  const testQuickCancel = async () => {
    setIsStreaming(true)
    setOutput('')
    setLogs([])
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    addLog('Starting request (will cancel in 2 seconds)...')

    // Auto-cancel after 2 seconds
    setTimeout(() => {
      addLog('Auto-cancelling after 2 seconds...')
      abortController.abort()
    }, 2000)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [
            { role: 'user', content: 'Count from 1 to 1000 very slowly, one number per second.' }
          ],
          stream: true
        }),
        signal: abortController.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        if (abortController.signal.aborted) {
          addLog('Request was aborted during streaming')
          break
        }

        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        content += chunk
        setOutput(content)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        addLog('✅ Quick cancel test successful!')
      } else {
        addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Request Cancellation Test</h1>
      
      <div className="space-y-4 mb-6">
        <div className="flex gap-4">
          <Button 
            onClick={testCancellation}
            disabled={isStreaming}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Start Long Request
          </Button>
          
          <Button 
            onClick={cancelRequest}
            disabled={!isStreaming}
            variant="destructive"
          >
            Cancel Request
          </Button>
          
          <Button 
            onClick={testQuickCancel}
            disabled={isStreaming}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Test Quick Cancel (2s)
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          {isStreaming ? '🔄 Streaming...' : '⏸️ Ready'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Response Output</h2>
          <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-gray-50">
            <pre className="whitespace-pre-wrap text-sm">{output || 'No output yet...'}</pre>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-3">Test Logs</h2>
          <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-gray-50">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm mb-1 font-mono">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li><strong>Start Long Request:</strong> Begins a streaming request that should take a while</li>
          <li><strong>Cancel Request:</strong> Manually cancels the active request</li>
          <li><strong>Test Quick Cancel:</strong> Starts a request and automatically cancels it after 2 seconds</li>
        </ol>
        <p className="mt-2 text-sm text-gray-600">
          Watch the logs to see if cancellation is working properly. You should see "Request successfully cancelled!" when it works.
        </p>
      </div>
    </div>
  )
}