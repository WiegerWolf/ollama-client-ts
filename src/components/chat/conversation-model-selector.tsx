"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Check, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/stores/chat-store"
import { OllamaModel } from "@/lib/ollama-client"
import { ModelBadge } from "@/components/ui/model-badge"

interface ConversationModelSelectorProps {
  conversationId: string
}

export function ConversationModelSelector({
  conversationId
}: ConversationModelSelectorProps) {
  const {
    models,
    setModels,
    getConversationModel,
    setConversationModel,
    modelChangeLoading,
    setModelChangeLoading,
    currentConversation,
    updateConversation,
    addModelChange,
    addMessage
  } = useChatStore()
  
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // Fetch models on component mount if not already loaded
  useEffect(() => {
    if (models.length === 0) {
      fetchModels()
    }
  }, [models.length])

  const fetchModels = async () => {
    setIsLoadingModels(true)
    setError(null)
    
    try {
      const response = await fetch('/api/models')
      
      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      const modelList: OllamaModel[] = data.models || []
      setModels(modelList)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
    } finally {
      setIsLoadingModels(false)
    }
  }

  const currentModel = getConversationModel(conversationId)
  const selectedModelData = models.find(model => model.name === currentModel)

  const handleModelSelect = async (modelName: string) => {
    if (modelName === currentModel || modelChangeLoading) return
    
    setIsOpen(false)
    setError(null)
    setModelChangeLoading(true)

    try {
      // Call the API to update the conversation model
      const response = await fetch(`/api/conversations/${conversationId}/model`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: modelName }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update model')
      }

      const data = await response.json()
      
      // Update local state
      const previousModel = currentModel
      setConversationModel(conversationId, modelName)
      
      // Update conversation in store
      if (currentConversation?.id === conversationId) {
        updateConversation(conversationId, { 
          currentModel: modelName,
          updatedAt: new Date().toISOString()
        })
      }

      // Add model change to history
      if (data.modelChange) {
        addModelChange(conversationId, {
          conversationId,
          fromModel: data.modelChange.from,
          toModel: data.modelChange.to,
          changedAt: new Date().toISOString(),
          messageIndex: currentConversation?.messages.length || 0
        })
      }

      // Add system message to chat if one was created
      if (data.systemMessage) {
        addMessage(conversationId, {
          conversationId,
          role: 'system',
          content: data.systemMessage.content,
          metadata: data.systemMessage.metadata
        })
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error updating conversation model:', err)
    } finally {
      setModelChangeLoading(false)
    }
  }

  if (error) {
    return (
      <div className="flex items-center space-xs text-error-red">
        <AlertCircle className="h-4 w-4" />
        <span className="text-body-small">Model error</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        disabled={modelChangeLoading}
        className="flex items-center space-xs px-md py-xs h-auto bg-bg-secondary border border-border-primary hover:bg-bg-tertiary focus-ring"
        aria-label="Change conversation model"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {modelChangeLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />
            <span className="text-body-small text-text-secondary">Switching...</span>
          </>
        ) : (
          <>
            <ModelBadge model={currentModel} size="sm" variant="compact" />
            <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </Button>

      {isOpen && !modelChangeLoading && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-xs min-w-[200px] max-w-[300px] bg-bg-primary border border-border-primary rounded-lg shadow-elevated z-50 max-h-[300px] overflow-y-auto">
            {isLoadingModels ? (
              <div className="p-md text-center">
                <div className="flex items-center justify-center space-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />
                  <span className="text-body-small text-text-secondary">Loading models...</span>
                </div>
              </div>
            ) : models.length === 0 ? (
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