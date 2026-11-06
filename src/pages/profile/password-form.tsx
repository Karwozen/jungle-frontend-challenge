import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import PasswordField from '@/components/form/password-field'
import { Button } from '@/components/ui/button'
import { changePassword } from '@/domain/profile/api'
import { changePasswordForm, type ChangePasswordForm } from '@/domain/profile/schema'
import { applyApiError } from '@/lib/form-errors'

function PasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordForm) })

  const save = useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordForm) => changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      reset()
      toast.success('Senha alterada')
    },
    onError: (error) => applyApiError(setError, error),
  })

  return (
    <form onSubmit={handleSubmit((values) => save.mutate(values))} noValidate aria-label="Alterar senha" className="grid max-w-lg gap-5">
      <PasswordField label="Senha atual" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
      <PasswordField label="Nova senha" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
      <PasswordField label="Confirmar nova senha" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <div>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Alterando…' : 'Alterar senha'}
        </Button>
      </div>
    </form>
  )
}

export default PasswordForm
