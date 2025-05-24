"use client"

import { cn } from "@/lib/utils"

interface ModelBadgeProps {
  model: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "compact" | "dot"
  className?: string
}

// Generate consistent colors for models
const getModelColor = (model: string): string => {
  const colors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-green-100 text-green-800 border-green-200", 
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-teal-100 text-teal-800 border-teal-200",
    "bg-red-100 text-red-800 border-red-200"
  ]
  
  // Simple hash function to get consistent color for model name
  let hash = 0
  for (let i = 0; i < model.length; i++) {
    hash = ((hash << 5) - hash + model.charCodeAt(i)) & 0xffffffff
  }
  return colors[Math.abs(hash) % colors.length]
}

const getModelDotColor = (model: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500", 
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-red-500"
  ]
  
  let hash = 0
  for (let i = 0; i < model.length; i++) {
    hash = ((hash << 5) - hash + model.charCodeAt(i)) & 0xffffffff
  }
  return colors[Math.abs(hash) % colors.length]
}

export function ModelBadge({ model, size = "md", variant = "default", className }: ModelBadgeProps) {
  if (variant === "dot") {
    return (
      <div 
        className={cn(
          "rounded-full",
          size === "sm" && "w-2 h-2",
          size === "md" && "w-3 h-3", 
          size === "lg" && "w-4 h-4",
          getModelDotColor(model),
          className
        )}
        title={`Model: ${model}`}
      />
    )
  }

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-xs",
    lg: "px-2.5 py-1.5 text-sm"
  }

  const displayName = variant === "compact"
    ? model.length > 18 ? model.substring(0, 18) + '...' : model
    : model

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        sizeClasses[size],
        getModelColor(model),
        className
      )}
      title={variant === "compact" ? `Model: ${model}` : undefined}
    >
      {displayName}
    </span>
  )
}