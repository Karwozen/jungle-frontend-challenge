import type { ReactNode } from 'react'

function PageShell({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-300 px-6 py-10 xl:px-0">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </div>
  )
}

export default PageShell
