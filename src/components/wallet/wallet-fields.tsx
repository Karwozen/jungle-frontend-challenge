import type { ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import TextField from '@/components/form/text-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { networks } from '@/domain/catalog/schema'
import { ensSuffixes, walletProviders, type WalletInput } from '@/domain/wallets/schema'
import { networkLabels, providerLabels } from '@/features/catalog/labels'

const selectClass =
  'h-10 w-full rounded-md border border-border bg-transparent px-3 text-xs text-gold outline-none [color-scheme:dark] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'

const inputClass = 'h-10 border-border text-xs placeholder:text-gold'

const required = (label: string): ReactNode => (
  <>
    {label}
    <span aria-hidden className="ml-0.5 text-primary">
      *
    </span>
  </>
)

function SelectField({
  label,
  error,
  children,
  ...props
}: { label: ReactNode; error?: string } & React.ComponentProps<'select'>) {
  const errorId = `${props.id}-error`
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={props.id}>{label}</Label>
      <select {...props} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} className={selectClass}>
        {children}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function EnsField({ form }: { form: UseFormReturn<WalletInput> }) {
  const {
    register,
    formState: { errors },
  } = form
  const error = errors.ensName?.message

  return (
    <div className="grid gap-1.5">
      <Label htmlFor="ensName">{required('Nome ENS')}</Label>
      <div className="flex">
        <Input
          id="ensName"
          aria-required
          aria-invalid={!!error}
          aria-describedby={error ? 'ensName-error' : undefined}
          className={`${inputClass} rounded-r-none`}
          {...register('ensName')}
        />
        <select aria-label="Domínio do nome ENS" className={`${selectClass} w-28 rounded-l-none border-l-0`} {...register('ensSuffix')}>
          {ensSuffixes.map((suffix) => (
            <option key={suffix} value={suffix} className="bg-card">
              .{suffix}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p id="ensName-error" role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function WalletFields({ form }: { form: UseFormReturn<WalletInput> }) {
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
      <TextField label={required('Nome de exibição')} className={inputClass} aria-required error={errors.displayName?.message} {...register('displayName')} />
      <TextField label={required('Nome de usuário')} className={inputClass} aria-required error={errors.alias?.message} {...register('alias')} />
      <SelectField id="network" label={required('Rede')} error={errors.network?.message} defaultValue="" {...register('network')}>
        <option value="" disabled className="bg-card">
          Selecione uma rede
        </option>
        {networks.map((network) => (
          <option key={network} value={network} className="bg-card">
            {networkLabels[network]}
          </option>
        ))}
      </SelectField>
      <TextField label={required('Nome do perfil')} className={inputClass} aria-required error={errors.profileName?.message} {...register('profileName')} />
      <TextField
        label={required('Endereço da carteira')}
        className={inputClass}
        placeholder="Endereço 0x da carteira"
        aria-required
        error={errors.address?.message}
        {...register('address')}
      />
      <TextField
        label="ENS ou carteira secundária"
        className={inputClass}
        placeholder="ENS ou carteira secundária (opcional)"
        error={errors.secondaryAddress?.message}
        {...register('secondaryAddress')}
      />
      <SelectField id="provider" label={required('Tipo de carteira')} error={errors.provider?.message} defaultValue="" {...register('provider')}>
        <option value="" disabled className="bg-card">
          Selecione uma carteira
        </option>
        {walletProviders.map((provider) => (
          <option key={provider} value={provider} className="bg-card">
            {providerLabels[provider]}
          </option>
        ))}
      </SelectField>
      <TextField label={required('Código de indicação')} className={inputClass} aria-required error={errors.referralCode?.message} {...register('referralCode')} />
      <TextField label={required('E-mail')} type="email" className={inputClass} aria-required error={errors.email?.message} {...register('email')} />

      <EnsField form={form} />
    </div>
  )
}

export default WalletFields
