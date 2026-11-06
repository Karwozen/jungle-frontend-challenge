import { useRef, type ReactNode } from 'react'

/** Keep the reference's auxiliary controls without implying an unavailable service works. */
export function AuxiliaryAction({ children, title, description, className }: { children: ReactNode; title?: string; description?: string; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  return <><button type="button" className={className} onClick={() => dialog.current?.showModal()}>{children}</button><dialog ref={dialog} className="auxiliary-dialog" aria-label={title || (typeof children === 'string' ? children : 'Informação')}><h2>{title || children}</h2><p>{description || 'Este recurso não faz parte da demonstração do marketplace. Nenhuma solicitação foi enviada.'}</p><button type="button" onClick={() => dialog.current?.close()} autoFocus>Fechar</button></dialog></>
}
