"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/stores/chat-store"
import { OllamaModel } from "@/lib/ollama-client"

interface ModelSelectorProps {
  conversationId?: string
}

export function ModelSelector({ conversationId }: ModelSelectorProps = {}) {
  const {
    models,
    selectedModel,
    setModels,
    setSelectedModel,
    getConversationModel,
    setConversationModel,
    currentConversation
  } = useChatStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch models on component mount
  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Fetching models from /api/models...')
      const response = await fetch('/api/models')
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText)
        throw new Error('Failed to fetch models')
      }
      
      const data = await response.json()
      console.log('Frontend received data:', JSON.stringify(data, null, 2))
      
      if (data.error) {
        console.error('API returned error:', data.error)
        throw new Error(data.error)
      }
      
      const modelList: OllamaModel[] = data.models || []
      console.log('Processed model list:', modelList.length, 'models')
      setModels(modelList)
      
      // If no model is selected and we have models, select the first one
      if (!selectedModel && modelList.length > 0) {
        setSelectedModel(modelList[0].name)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching models:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModelSelect = (modelName: string) => {
    if (conversationId || currentConversation) {
      // If we're in a conversation context, update the conversation model
      const targetConversationId = conversationId || currentConversation?.id
      if (targetConversationId) {
        setConversationModel(targetConversationId, modelName)
      }
    } else {
      // Otherwise, update the global selected model
      setSelectedModel(modelName)
    }
    setIsOpen(false)
  }

  // Get the appropriate model based on context
  const currentModel = (conversationId || currentConversation)
    ? getConversationModel(conversationId || currentConversation?.id || '')
    : selectedModel
    
  const selectedModelData = models.find(model => model.name === currentModel)

  if (error) {
    return (
      <div className="flex items-center space-xs text-error-red">
        <AlertCircle className="h-4 w-4" />
        <span className="text-body-small">Model error</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-xs">
        <div className="w-4 h-4 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
        <span className="text-body-small text-text-secondary">Loading models...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-xs px-md py-xs h-auto bg-bg-secondary border border-border-primary hover:bg-bg-tertiary focus-ring"
        aria-label="Select model"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-body-medium text-text-primary">
          {selectedModelData?.name || currentModel || 'No model'}
        </span>
        <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-xs min-w-[200px] max-w-[300px] bg-bg-primary border border-border-primary rounded-lg shadow-elevated z-50 max-h-[300px] overflow-y-auto">
            {models.length === 0 ? (
              <div className="p-md text-center">
                <p className="text-body-medium text-text-secondary">No models available</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={fetchModels}
                  className="mt-xs"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div role="listbox" aria-label="Available models">
                {models.map((model) => (
                  <button
                    key={model.name}
                    role="option"
                    aria-selected={model.name === currentModel}
                    onClick={() => handleModelSelect(model.name)}
                    className="w-full px-md py-sm text-left hover:bg-bg-secondary focus:bg-bg-secondary focus:outline-none transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-body-medium text-text-primary font-medium truncate">
                        {model.name}
                      </div>
                      {model.details?.parameter_size && (
                        <div className="text-body-small text-text-tertiary">
                          {model.details.parameter_size}
                        </div>
                      )}
                    </div>
                    
                    {model.name === currentModel && (
                      <Check className="h-4 w-4 text-primary-blue flex-shrink-0 ml-sm" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}