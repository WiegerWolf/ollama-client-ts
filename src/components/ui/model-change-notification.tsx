"use client"

import { useEffect, useState } from "react"
import { CheckCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ModelBadge } from "./model-badge"

interface ModelChangeNotificationProps {
  fromModel: string | null
  toModel: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function ModelChangeNotification({
  fromModel,
  toModel,
  isVisible,
  onClose,
  duration = 4000
}: ModelChangeNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible && !isAnimating) return null

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm bg-bg-primary border border-border-primary rounded-lg shadow-elevated p-lg transition-all duration-300 ease-in-out",
        isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      )}
    >
      <div className="flex items-start space-md">
        <div className="flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-body-medium font-medium text-text-primary mb-xs">
            Model Changed
          </div>
          
          <div className="flex items-center space-xs text-body-small text-text-secondary">
            {fromModel ? (
              <>
                <ModelBadge model={fromModel} size="sm" variant="compact" />
                <span>→</span>
                <ModelBadge model={toModel} size="sm" variant="compact" />
              </>
            ) : (
              <>
                <span>Now using</span>
                <ModelBadge model={toModel} size="sm" variant="compact" />
              </>
            )}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="flex-shrink-0 p-xs rounded-md hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 focus:ring-offset-bg-primary transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4 text-text-tertiary" />
        </button>
      </div>
    </div>
  )
}