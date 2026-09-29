import { cn } from "@/lib/utils"

type Props = {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, children, className }: Props) {
  return (
    <header className={cn("border-b pt-12 pb-10 sm:pt-16 sm:pb-12", className)}>
      {eyebrow && <p className="font-mono text-xs tracking-widest text-brand uppercase">{eyebrow}</p>}
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      {description && <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>}
      {children}
    </header>
  )
}

export function EmptyState({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && <p className="mt-2 max-w-md text-muted-foreground">{description}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
