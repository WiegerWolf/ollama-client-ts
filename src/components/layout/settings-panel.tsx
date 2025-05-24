"use client"

import { useState, useEffect, useRef } from "react"
import { X, Settings, Palette, Sliders, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useChatStore } from "@/stores/chat-store"
import { createDebouncedFunction } from "@/lib/debounce"

type SettingsTab = 'parameters' | 'appearance'

export function SettingsPanel() {
  const {
    settingsPanelOpen,
    setSettingsPanelOpen,
    temperature,
    maxTokens,
    systemPrompt,
    setTemperature,
    setMaxTokens,
    setSystemPrompt,
    theme,
    settingsLoading,
    loadUserSettings,
    saveUserSettings
  } = useChatStore()
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('parameters')
  
  // Create debounced save function with cleanup
  const debouncedSaveRef = useRef<{
    debouncedFunc: () => void
    cleanup: () => void
  } | null>(null)

  // Initialize debounced save function
  useEffect(() => {
    const { debouncedFunc, cleanup } = createDebouncedFunction(saveUserSettings, 800)
    debouncedSaveRef.current = { debouncedFunc, cleanup }

    // Cleanup on unmount
    return () => {
      cleanup()
    }
  }, [saveUserSettings])

  // Load user settings on mount
  useEffect(() => {
    loadUserSettings()
  }, [loadUserSettings])

  if (!settingsPanelOpen) {
    return null
  }

  const handleTemperatureChange = (value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 2) {
      setTemperature(numValue)
      // Use debounced save function
      debouncedSaveRef.current?.debouncedFunc()
    }
  }

  const handleMaxTokensChange = (value: string) => {
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 8192) {
      setMaxTokens(numValue)
      // Use debounced save function
      debouncedSaveRef.current?.debouncedFunc()
    }
  }

  const handleSystemPromptChange = (value: string) => {
    setSystemPrompt(value)
    // Use debounced save function
    debouncedSaveRef.current?.debouncedFunc()
  }

  return (
    <div className="w-80 max-w-full bg-bg-tertiary border-l border-border-primary flex flex-col h-full touch-manipulation">
      {/* Header */}
      <div className="flex items-center justify-between p-lg border-b border-border-primary bg-bg-primary">
        <div className="flex items-center space-md">
          {settingsLoading ? (
            <Loader2 className="h-5 w-5 text-text-secondary animate-spin" />
          ) : (
            <Settings className="h-5 w-5 text-text-secondary" />
          )}
          <h2 className="text-heading-medium text-text-primary font-semibold">
            Settings
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsPanelOpen(false)}
          className="w-8 h-8 focus-ring"
          aria-label="Close settings panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border-primary bg-bg-primary">
        <button
          onClick={() => setActiveTab('parameters')}
          className={`flex-1 flex items-center justify-center space-xs px-lg py-md text-body-medium font-medium transition-colors focus:outline-none focus-ring-inset touch-manipulation ${
            activeTab === 'parameters'
              ? 'text-primary-blue border-b-2 border-primary-blue bg-bg-secondary'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary active:bg-bg-secondary'
          }`}
          aria-selected={activeTab === 'parameters'}
          role="tab"
        >
          <Sliders className="h-4 w-4" />
          <span>Parameters</span>
        </button>
        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex-1 flex items-center justify-center space-xs px-lg py-md text-body-medium font-medium transition-colors focus:outline-none focus-ring-inset touch-manipulation ${
            activeTab === 'appearance'
              ? 'text-primary-blue border-b-2 border-primary-blue bg-bg-secondary'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary active:bg-bg-secondary'
          }`}
          aria-selected={activeTab === 'appearance'}
          role="tab"
        >
          <Palette className="h-4 w-4" />
          <span>Appearance</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-lg space-lg">
        {activeTab === 'parameters' && (
          <div className="space-lg">
            {/* Temperature Setting */}
            <div className="space-sm">
              <label htmlFor="temperature" className="block text-body-medium font-medium text-text-primary">
                Temperature
              </label>
              <p className="text-body-small text-text-secondary mb-md">
                Controls randomness. Lower values make responses more focused and deterministic.
              </p>
              <div className="space-xs">
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => handleTemperatureChange(e.target.value)}
                  className="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                />
                <div className="flex justify-between text-body-small text-text-tertiary">
                  <span>0</span>
                  <span className="font-medium text-text-primary">{temperature}</span>
                  <span>2</span>
                </div>
              </div>
            </div>

            {/* Max Tokens Setting */}
            <div className="space-sm">
              <label htmlFor="maxTokens" className="block text-body-medium font-medium text-text-primary">
                Max Tokens
              </label>
              <p className="text-body-small text-text-secondary mb-md">
                Maximum number of tokens in the response. Higher values allow longer responses.
              </p>
              <div className="space-xs">
                <input
                  id="maxTokens"
                  type="range"
                  min="1"
                  max="8192"
                  step="1"
                  value={maxTokens}
                  onChange={(e) => handleMaxTokensChange(e.target.value)}
                  className="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                />
                <div className="flex justify-between text-body-small text-text-tertiary">
                  <span>1</span>
                  <span className="font-medium text-text-primary">{maxTokens}</span>
                  <span>8192</span>
                </div>
              </div>
            </div>

            {/* System Prompt Setting */}
            <div className="space-sm">
              <label htmlFor="systemPrompt" className="block text-body-medium font-medium text-text-primary">
                System Prompt
              </label>
              <p className="text-body-small text-text-secondary mb-md">
                Instructions that guide the AI's behavior and responses.
              </p>
              <textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => handleSystemPromptChange(e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={4}
                className="w-full px-md py-sm bg-bg-primary border border-border-primary rounded-lg text-body-medium text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none touch-manipulation"
              />
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-lg">
            {/* Theme Setting */}
            <div className="space-sm">
              <label className="block text-body-medium font-medium text-text-primary mb-md">
                Theme
              </label>
              <p className="text-body-small text-text-secondary mb-md">
                Choose between light and dark appearance.
              </p>
              <div className="flex items-center justify-between p-md bg-bg-primary border border-border-primary rounded-lg">
                <div className="flex items-center space-md">
                  <div className="text-body-medium text-text-primary">
                    {theme === 'light' ? 'Light Theme' : 'Dark Theme'}
                  </div>
                  <div className="text-body-small text-text-secondary">
                    Current theme
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>

            {/* Future appearance settings can be added here */}
            <div className="space-sm">
              <div className="p-md bg-bg-primary border border-border-primary rounded-lg">
                <p className="text-body-medium text-text-secondary text-center">
                  More appearance options coming soon
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}