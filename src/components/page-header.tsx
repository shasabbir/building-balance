
import * as React from "react"

interface PageHeaderProps {
  title: string
  children?: React.ReactNode
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {children && <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:justify-end">{children}</div>}
    </div>
  )
}
