import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { TextFieldProps } from './text-field'

function PasswordField({ label, error, hideLabel, id, ...props }: Omit<TextFieldProps, 'type'>) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const errorId = `${fieldId}-error`
  const [visible, setVisible] = useState(false)

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={fieldId} className={cn(hideLabel && 'sr-only')}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="h-10 pr-10"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export default PasswordField
