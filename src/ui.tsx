import type { ReactNode } from "react"
export function Icon({ name, size = 20 }: {
  name: string
  size?: number
}) {
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    folder: (
      <path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    ),
    spark: (
      <>
        <path d="m12 3 2.8 6.2L21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8Z" />
        <path d="m20 2 .7 1.3L22 4l-1.3.7L20 6l-.7-1.3L18 4l1.3-.7Z" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    invoice: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    down: <path d="m6 9 6 6 6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="3" />
        <path d="M3 8V5a2 2 0 0 1 2-2h13v2M16 11h5v5h-5Z" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7m0-7L11 13M10 4H4v16h16v-6" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3h.01" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    link: (
      <>
        <path d="m10 14 4-4M8 16l-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0m2 6a3 3 0 0 0 4 0l5-5a3 3 0 0 0-4-4l-2 2" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.grid}
    </svg>
  )
}
export function Logo() {
  return (
    <span className="brand">
      <span className="logo-mark">
        <i />
        <i />
        <i />
      </span>
      <span>
        milestone<span className="brand-light">pay</span>
        <sup>AI</sup>
      </span>
    </span>
  )
}
export function Button({
  children,
  onClick,
  secondary = false,
  className = "",
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  secondary?: boolean
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`button ${secondary ? "secondary" : ""} ${className}`}
    >
      {children}
    </button>
  )
}
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      className={`badge ${String(children).toLowerCase().replace(/ /g, "-")}`}
    >
      {children}
    </span>
  )
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`card ${className}`}>{children}</section>
}
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
