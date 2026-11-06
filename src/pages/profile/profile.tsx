import { useQuery } from '@tanstack/react-query'
import AccountSidebar from '@/components/layout/account-sidebar'
import MobilePageHeader from '@/components/layout/mobile-page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { profileQuery } from '@/domain/profile/queries'
import { useSession } from '@/features/auth/use-session'
import AvatarField from './avatar-field'
import PasswordForm from './password-form'
import ProfileForm from './profile-form'

function Profile() {
  const { data: session } = useSession()
  const { data: profile, isPending, isError, refetch } = useQuery({ ...profileQuery(session?.user.id ?? ''), enabled: !!session })

  return (
    <div className="mx-auto w-full max-w-300 px-6 py-6 md:py-10 xl:px-0">
      <MobilePageHeader title="Perfil do colecionador" toHome />

      <div className="grid gap-8 md:grid-cols-[17rem_1fr]">
        <AccountSidebar current="profile" />

        <div className="min-w-0 space-y-12">
          {isPending ? (
            <div aria-busy className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div role="alert" className="flex flex-col items-start gap-3">
              <p className="text-sm">Não foi possível carregar o perfil.</p>
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          ) : (
            <>
              <section aria-labelledby="profile-title" className="space-y-6">
                <h1 id="profile-title" className="font-bold">
                  Perfil do colecionador
                </h1>
                <AvatarField profile={profile} />
                <ProfileForm key={profile.id} profile={profile} />
              </section>

              <section aria-labelledby="password-title" className="space-y-6">
                <h2 id="password-title" className="font-bold">
                  Alterar senha
                </h2>
                <PasswordForm />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
