import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../shared/utils'
const buttonVariants = cva('inline-flex items-center justify-center gap-2 rounded-sm text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 min-h-11 px-5 py-2', { variants: { variant: { default: 'bg-primary text-primary-foreground hover:brightness-110', outline: 'border border-border bg-transparent text-foreground hover:bg-muted', ghost: 'text-foreground hover:bg-muted' } }, defaultVariants: { variant: 'default' } })
function Button({ className, variant, asChild = false, ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, className }))} {...props}/>
}
export { Button }
