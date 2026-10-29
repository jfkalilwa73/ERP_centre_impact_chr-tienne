import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bell, LogOut, Menu, Moon, Sun } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { PageTransition } from '@/components/layout/PageTransition'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { useApplicationPageAccess } from '@/features/auth/applicationPageAccess'
import { useLogout, useSyncCurrentUser } from '@/features/auth/hooks'
import { useUnreadDemandes } from '@/features/notifications/useUnreadDemandes'
import { PERMISSIONS } from '@/lib/permissions'
import { useCurrentUser, useHasPermission, useSessionProfil } from '@/stores/authStore'
import { cn } from '@/lib/cn'

function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn('flex items-center', collapsed ? 'justify-center px-0' : 'gap-3 px-3')}>
      <img
        src={collapsed ? '/embleme-icc-blanc.png' : '/logo-icc-blanc.png'}
        alt="Impact Centre Chrétien"
        width={collapsed ? 128 : 962}
        height={collapsed ? 128 : 510}
        className={collapsed ? 'size-8 object-contain' : 'h-9 w-auto'}
      />
    </div>
  )
}

function SidebarShell({ children, collapsed = false }: { children: ReactNode; collapsed?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col gap-6 overflow-hidden bg-brand-900 py-5 text-white',
        collapsed ? 'px-2' : 'px-3',
      )}
    >
      {children}
    </div>
  )
}

export function AppLayout() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return window.localStorage.getItem('icc-theme') === 'dark' ? 'dark' : 'light'
  })
  const user = useCurrentUser()
  const profil = useSessionProfil()
  const logoutMutation = useLogout()
  const applicationPageAccess = useApplicationPageAccess()
  const canSeeNotifications =
    useHasPermission(PERMISSIONS.DEMANDES_READ) && applicationPageAccess.canView('notifications')
  const unreadDemandes = useUnreadDemandes()

  useSyncCurrentUser()

  const fullName = user
    ? [user.personne.prenom, user.personne.nom].filter(Boolean).join(' ')
    : (profil?.name ?? '')
  const email = user?.compte.email ?? profil?.email ?? ''

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('icc-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'))

  return (
    <div className="min-h-screen md:grid md:grid-cols-[4.5rem_1fr] lg:grid-cols-[16.5rem_1fr] print:block">
      <aside className="hidden md:block lg:hidden print:hidden">
        <div className="sticky top-0 h-screen">
          <SidebarShell collapsed>
            <div className="shrink-0">
              <BrandMark collapsed />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <SidebarNav collapsed />
            </div>
          </SidebarShell>
        </div>
      </aside>

      <aside className="hidden lg:block print:hidden">
        <div className="sticky top-0 h-screen">
          <SidebarShell>
            <div className="shrink-0">
              <BrandMark />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <SidebarNav />
            </div>
          </SidebarShell>
        </div>
      </aside>

      <div className="flex min-w-0 min-h-screen flex-col">
        <header className="app-topbar sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/20 bg-brand-950/75 px-3 text-white shadow-lg shadow-brand-950/20 backdrop-blur-xl sm:h-16 sm:gap-3 sm:px-6 print:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <DialogPrimitive.Root open={isNavOpen} onOpenChange={setIsNavOpen}>
              <DialogPrimitive.Trigger asChild>
                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-white transition-colors duration-200 hover:bg-white/10 lg:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </button>
              </DialogPrimitive.Trigger>
              <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="nav-overlay fixed inset-0 z-50 bg-brand-950/50 lg:hidden" />
                <DialogPrimitive.Content className="nav-drawer fixed inset-y-0 left-0 z-50 w-72 max-w-[min(85vw,20rem)] lg:hidden">
                  <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">
                    Menu des sections de l'application
                  </DialogPrimitive.Description>
                  <SidebarShell>
                    <div className="shrink-0">
                      <BrandMark />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                      <SidebarNav onNavigate={() => setIsNavOpen(false)} />
                    </div>
                  </SidebarShell>
                </DialogPrimitive.Content>
              </DialogPrimitive.Portal>
            </DialogPrimitive.Root>

            <img
              src="/logo-icc.png"
              alt="Impact Centre Chrétien"
              width={962}
              height={510}
              className="h-7 w-auto lg:hidden"
            />
          </div>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-0.5 sm:gap-2">
            {canSeeNotifications && (
              <Link
                to="/notifications"
                className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 sm:size-10"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="size-5" aria-hidden="true" />
                {unreadDemandes > 0 && (
                  <span className="absolute right-1 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gerbe-or px-1 text-[10px] font-semibold leading-none text-brand-950">
                    {unreadDemandes > 9 ? '9+' : unreadDemandes}
                  </span>
                )}
              </Link>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 sm:size-10"
              aria-label={theme === 'light' ? 'Activer le mode nuit' : 'Activer le mode jour'}
              title={theme === 'light' ? 'Activer le mode nuit' : 'Activer le mode jour'}
            >
              {theme === 'light' ? (
                <Moon className="size-5" aria-hidden="true" />
              ) : (
                <Sun className="size-5" aria-hidden="true" />
              )}
            </button>
            <div className="mx-1 hidden h-8 w-px bg-white/20 sm:block" aria-hidden="true" />
            <div className="min-w-0 max-w-20 leading-tight sm:max-w-56">
              {fullName && (
                <p className="truncate text-xs font-semibold text-white sm:text-sm">{fullName}</p>
              )}
              <p className="hidden truncate text-xs text-white/65 sm:block">{email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              isLoading={logoutMutation.isPending}
              aria-label="Déconnexion"
              className="size-9 shrink-0 px-0 text-white hover:bg-white/10 hover:text-white sm:size-10"
              title="Déconnexion"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="sr-only">Déconnexion</span>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 overflow-x-hidden px-4 py-8 sm:px-6 print:max-w-none print:overflow-visible print:px-0 print:py-0">
          <PageTransition />
        </main>
      </div>
    </div>
  )
}
