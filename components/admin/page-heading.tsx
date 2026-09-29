import { cn } from "@/lib/utils"

export function PageHeading({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-background", className)}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
          <h2 className="font-sans text-base font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function AdminEmpty({ icon: Icon, title, description, action }: { icon?: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </span>
      )}
      <h3 className="mt-4 font-sans font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
