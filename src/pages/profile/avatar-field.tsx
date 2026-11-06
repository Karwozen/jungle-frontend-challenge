import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { sessionQuery } from '@/domain/auth/queries'
import { removeAvatar, uploadAvatar } from '@/domain/profile/api'
import { profileKey } from '@/domain/profile/queries'
import { avatarLimits, type Profile } from '@/domain/profile/schema'
import { ApiError } from '@/lib/http'

function AvatarField({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: profileKey(profile.id) })
    queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey })
  }

  const upload = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      setError(undefined)
      toast.success('Avatar atualizado')
      refresh()
    },
    onError: (e) => setError(e instanceof ApiError ? (e.fields.avatar ?? e.message) : e.message),
  })
  const remove = useMutation({
    mutationFn: removeAvatar,
    onSuccess: () => {
      setError(undefined)
      refresh()
    },
    onError: (e) => setError(e.message),
  })

  return (
    <div className="grid gap-1.5">
      <p className="text-sm">Avatar</p>
      <div className="flex items-center gap-4">
        <span className="flex size-15 items-center justify-center overflow-hidden rounded-full bg-card text-text-accent">
          {profile.avatar ? <img src={profile.avatar} alt="Seu avatar" className="size-full object-cover" /> : <ImageIcon aria-hidden />}
        </span>
        <input
          ref={input}
          type="file"
          accept={avatarLimits.types.join(',')}
          aria-label="Escolher imagem do avatar"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) upload.mutate(file)
          }}
        />
        <Button type="button" disabled={upload.isPending} onClick={() => input.current?.click()}>
          {upload.isPending ? 'Enviando…' : 'Alterar'}
        </Button>
        {profile.avatar && (
          <Button type="button" variant="outline" disabled={remove.isPending} onClick={() => remove.mutate()}>
            Remover
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export default AvatarField
