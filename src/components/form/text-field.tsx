import { useId, type ComponentProps, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface TextFieldProps extends ComponentProps<'input'> {
  label: ReactNode
  error?: string
  // o desenho mostra só o placeholder; o rótulo continua existindo para leitor de tela
  hideLabel?: boolean
}

function TextField({ label, error, hideLabel, id, className, ...props }: TextFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const errorId = `${fieldId}-error`

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={fieldId} className={cn(hideLabel && 'sr-only')}>
        {label}
      </Label>
      <Input
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn('h-10', className)}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export default TextField
