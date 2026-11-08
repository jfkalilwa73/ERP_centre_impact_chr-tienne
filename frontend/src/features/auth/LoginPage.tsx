import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { GerbeMotif } from '@/components/brand/GerbeMotif'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { errorId } from '@/lib/form'
import { useLogin } from './hooks'
import { loginSchema, type LoginFormValues } from './loginSchema'

const EMAIL_FIELD_ID = 'login-email'
const PASSWORD_FIELD_ID = 'login-password'

const argumentsDeMarque = [
  'Un référentiel unique pour les membres et les départements',
  'Des droits d\u2019accès ajustés à la responsabilité de chacun',
  'Un historique fiable des opérations sensibles',
]

const verset = {
  texte: 'Seulement, que tout se fasse avec dignité et ordre.',
  reference: '1 Corinthiens 14.40 ',
}

function Verset({ className }: { className?: string }) {
  return (
    <blockquote className={className}>
      <p className="text-sm leading-relaxed text-white/80 italic">« {verset.texte} »</p>
      <footer className="mt-1.5 text-xs tracking-wide text-white/50">{verset.reference}</footer>
    </blockquote>
  )
}

export function LoginPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', motDePasse: '' },
  })

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  const onSubmit = handleSubmit((values) => {
    loginMutation.mutate(values, {
      onSuccess: () => navigate(redirectTo, { replace: true }),
    })
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-brand-600 via-brand-700 to-brand-900">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(236,183,8,0.20),transparent_40%),radial-gradient(circle_at_88%_85%,rgba(4,123,202,0.28),transparent_45%),radial-gradient(circle_at_70%_20%,rgba(221,28,22,0.14),transparent_35%)]" />
        <GerbeMotif className="absolute -top-2 -left-8 h-auto w-[260px] opacity-20 lg:top-2 lg:-left-16 lg:w-[520px] lg:opacity-15" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-14 px-6 py-12 lg:grid-cols-2 lg:px-10">
        <aside className="hidden flex-col text-white lg:flex">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90 backdrop-blur-sm">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Espace administratif sécurisé
          </p>

          <h2 className="mt-10 text-4xl leading-[1.15] font-semibold tracking-tight text-balance">
            Servir l'Église avec ordre et clarté.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
            Une seule plateforme pour les membres et les départements d'Impact Centre
            Chrétien, afin que chaque serviteur dispose du bon accès, au bon moment.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {argumentsDeMarque.map((argument) => (
              <li key={argument} className="flex items-start gap-3 text-sm text-white/85">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gerbe-or"
                />
                {argument}
              </li>
            ))}
          </ul>

          <Verset className="mt-10 border-l-2 border-gerbe-or/70 pl-4" />

          <p className="mt-10 text-xs text-white/50">
            Impact Centre Chrétien — Kinshasa, République Démocratique du Congo
          </p>
        </aside>

        <div className="relative mx-auto w-full max-w-sm">
          <img
            src="/logo-icc-blanc.png"
            alt="Impact Centre Chrétien"
            width={962}
            height={510}
            className="pointer-events-none absolute top-6 left-1/2 w-[50%] max-w-none -translate-x-1/2 opacity-75"
          />

          <div className="relative rounded-3xl border border-white/20 bg-brand-950/30 p-7 pt-36 shadow-2xl shadow-brand-950/40 sm:p-8 sm:pt-36">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Connexion</h1>
            <p className="mt-1.5 text-sm text-white/70">
              Accédez à votre espace avec vos identifiants.
            </p>

            <form onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-5">
              {loginMutation.isError && (
                <Alert
                  variant="error"
                  title="Connexion impossible"
                  className="border-red-300/40 bg-red-500/25 text-red-50 backdrop-blur-sm"
                >
                  {loginMutation.error.message}
                </Alert>
              )}

              <FormField
                id={EMAIL_FIELD_ID}
                label="Adresse e-mail"
                error={errors.email?.message}
                tone="glass"
              >
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute inset-y-0 left-0 my-auto size-4 text-white/60"
                    aria-hidden="true"
                  />
                  <Input
                    variant="glass"
                    id={EMAIL_FIELD_ID}
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="prenom.nom@eglise.org"
                    className="h-11 pl-8"
                    hasError={Boolean(errors.email)}
                    aria-describedby={errors.email ? errorId(EMAIL_FIELD_ID) : undefined}
                    {...register('email')}
                  />
                </div>
              </FormField>

              <FormField
                id={PASSWORD_FIELD_ID}
                label="Mot de passe"
                error={errors.motDePasse?.message}
                tone="glass"
              >
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute inset-y-0 left-0 my-auto size-4 text-white/60"
                    aria-hidden="true"
                  />
                  <Input
                    variant="glass"
                    id={PASSWORD_FIELD_ID}
                    type={isPasswordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-11 pr-10 pl-8"
                    hasError={Boolean(errors.motDePasse)}
                    aria-describedby={errors.motDePasse ? errorId(PASSWORD_FIELD_ID) : undefined}
                    {...register('motDePasse')}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    aria-label={
                      isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                    }
                    className="absolute inset-y-0 right-1 my-auto flex size-8 items-center justify-center rounded-md bg-white text-brand-900 shadow-sm transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-brand-700"
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </FormField>

              <Button
                type="submit"
                variant="glass"
                size="lg"
                isLoading={loginMutation.isPending}
                className="mt-3 rounded-xl bg-white font-semibold text-brand-900 shadow-md shadow-brand-950/30 hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
              >
                {loginMutation.isPending ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs leading-relaxed text-white/65">
              Accès réservé au personnel autorisé. En cas de difficulté de connexion, contactez
              l'administrateur.
            </p>
          </div>

          <Verset className="relative mt-6 text-center lg:hidden" />
        </div>
      </div>
    </div>
  )
}
