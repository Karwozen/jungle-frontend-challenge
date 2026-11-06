import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import PasswordField from '@/components/form/password-field'
import TextField from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { signupForm, signupRequest, type SignupForm as SignupFormValues } from '@/domain/auth/schema'
import { applyApiError } from '@/lib/form-errors'
import { useSignup } from '@/features/auth/mutations'
import SocialButtons from './social-buttons'

function SignupForm({ onDone }: { onDone: () => void }) {
  const signup = useSignup()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupForm) })

  const submit = handleSubmit((values) =>
    signup.mutate(signupRequest.parse(values), {
      onSuccess: onDone,
      onError: (error) => applyApiError(setError, error),
    }),
  )

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <TextField
        label="Nome de usuário"
        hideLabel
        autoComplete="username"
        placeholder="Nome de usuário"
        error={errors.username?.message}
        {...register('username')}
      />
      <TextField
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Senha"
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordField
        label="Confirmar senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Confirmar senha"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" size="lg" className="h-10 rounded-md" disabled={signup.isPending}>
        {signup.isPending ? (
          'Criando conta…'
        ) : (
          <>
            <span className="sm:hidden">Criar perfil</span>
            <span className="max-sm:hidden">Criar conta</span>
          </>
        )}
      </Button>
      <SocialButtons onDone={onDone} />
    </form>
  )
}

export default SignupForm
