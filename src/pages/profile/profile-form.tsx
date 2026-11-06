import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import TextField from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionQuery } from '@/domain/auth/queries'
import { updateProfile } from '@/domain/profile/api'
import { profileKey } from '@/domain/profile/queries'
import { profileFields, type Profile } from '@/domain/profile/schema'
import { applyApiError } from '@/lib/form-errors'
import type { z } from 'zod'

type ProfileValues = z.infer<typeof profileFields>

function ProfileForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileFields),
    defaultValues: {
      displayName: profile.displayName,
      username: profile.username,
      email: profile.email,
      ensName: profile.ensName,
      walletNickname: profile.walletNickname,
    },
  })

  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(profileKey(updated.id), updated)
      queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey })
      toast.success('Perfil atualizado')
    },
    onError: (error) => applyApiError(setError, error),
  })

  return (
    <form onSubmit={handleSubmit((values) => save.mutate(values))} noValidate aria-label="Dados do perfil" className="grid gap-x-7 gap-y-5 md:grid-cols-2">
      <TextField label={<>Nome de exibição<span aria-hidden className="ml-0.5 text-primary">*</span></>} error={errors.displayName?.message} {...register('displayName')} />
      <TextField label={<>Nome de usuário<span aria-hidden className="ml-0.5 text-primary">*</span></>} error={errors.username?.message} {...register('username')} />
      <TextField label={<>E-mail<span aria-hidden className="ml-0.5 text-primary">*</span></>} type="email" error={errors.email?.message} {...register('email')} />

      <div className="grid gap-1.5">
        <Label htmlFor="ensName">
          Nome ENS<span aria-hidden className="ml-0.5 text-primary">*</span>
        </Label>
        <div className="flex">
          <span className="flex h-10 items-center rounded-l-md border border-r-0 border-border px-3 text-sm text-gold">.eth</span>
          <Input
            id="ensName"
            aria-invalid={!!errors.ensName}
            aria-describedby={errors.ensName ? 'ensName-error' : undefined}
            className="h-10 rounded-l-none"
            {...register('ensName')}
          />
        </div>
        {errors.ensName && (
          <p id="ensName-error" role="alert" className="text-xs text-destructive">
            {errors.ensName.message}
          </p>
        )}
      </div>

      <TextField label={<>Apelido da carteira<span aria-hidden className="ml-0.5 text-primary">*</span></>} error={errors.walletNickname?.message} {...register('walletNickname')} />

      <div className="md:col-span-2">
        <Button type="submit" disabled={!isDirty || save.isPending}>
          {save.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

export default ProfileForm
