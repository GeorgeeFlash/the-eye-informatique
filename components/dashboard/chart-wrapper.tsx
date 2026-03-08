// Wrapper for Recharts charts ensuring they render correctly in Next.js
// with dynamic import and SSR disabled when needed
"use client"

import { ReactNode } from "react"

interface ChartWrapperProps {
  children: ReactNode
  title?: string
  className?: string
}

export function ChartWrapper({ children, title, className }: ChartWrapperProps) {
  return (
    <div className={className}>
      {title && <h3 className="mb-4 text-sm font-medium">{title}</h3>}
      {children}
    </div>
  )
}
