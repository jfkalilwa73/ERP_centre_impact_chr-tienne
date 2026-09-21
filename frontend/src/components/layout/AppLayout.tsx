import { useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { useLogout, useSyncCurrentUser } from '@/features/auth/hooks'
import { useCurrentUser } from '@/stores/authStore'
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

function SessionFooter({
  fullName,
  email,
  onLogout,
  isLoggingOut,
}: {
  fullName: string
  email: string
  onLogout: () => void
  isLoggingOut: boolean
}) {
  return (
    <div className="mt-auto flex flex-col gap-3 border-t border-white/10 px-3 pt-4">
      {fullName && (
        <div className="min-w-0 px-1 leading-tight">
          <p className="truncate text-sm font-medium text-white">{fullName}</p>
          <p className="truncate text-xs text-white/55">{email}</p>
        </div>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={onLogout}
        isLoading={isLoggingOut}
        className="justify-start border-white/15 bg-white/10 text-white hover:bg-white/15"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Déconnexion
      </Button>
    </div>
  )
}

function SidebarShell({ children, collapsed = false }: { children: ReactNode; collapsed?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-full flex-col gap-8 bg-brand-900 py-5 text-white',
        collapsed ? 'px-2' : 'px-3',
      )}
    >
      {children}
    </div>
  )
}

export function AppLayout() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const user = useCurrentUser()
  const logoutMutation = useLogout()

  useSyncCurrentUser()

  const fullName = user ? `${user.personne.prenom} ${user.personne.nom}` : ''
  const email = user?.compte.email ?? ''

  const session = (
    <SessionFooter
      fullName={fullName}
      email={email}
      onLogout={() => logoutMutation.mutate()}
      isLoggingOut={logoutMutation.isPending}
    />
  )

  return (
    <div className="min-h-screen md:grid md:grid-cols-[4.5rem_1fr] lg:grid-cols-[16.5rem_1fr] print:block">
      <aside className="hidden md:block lg:hidden print:hidden">
        <div className="sticky top-0 h-screen">
          <SidebarShell collapsed>
            <BrandMark collapsed />
            <SidebarNav collapsed />
          </SidebarShell>
        </div>
      </aside>

      <aside className="hidden lg:block print:hidden">
        <div className="sticky top-0 h-screen">
          <SidebarShell>
            <BrandMark />
            <SidebarNav />
            {session}
          </SidebarShell>
        </div>
      </aside>

      <div className="flex min-w-0 min-h-screen flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 lg:hidden print:hidden">
          <DialogPrimitive.Root open={isNavOpen} onOpenChange={setIsNavOpen}>
            <DialogPrimitive.Trigger asChild>
              <button
                type="button"
                className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
                aria-label="Ouvrir le menu"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-brand-950/50 lg:hidden" />
              <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-72 max-w-[min(85vw,20rem)] lg:hidden">
                <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Menu des sections de l'application
                </DialogPrimitive.Description>
                <SidebarShell>
                  <BrandMark />
                  <SidebarNav onNavigate={() => setIsNavOpen(false)} />
                </SidebarShell>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>

          <img
            src="/logo-icc.png"
            alt="Impact Centre Chrétien"
            width={962}
            height={510}
            className="h-8 w-auto"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            isLoading={logoutMutation.isPending}
            aria-label="Déconnexion"
            className="px-2"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="sr-only">Déconnexion</span>
          </Button>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 overflow-x-hidden px-4 py-8 sm:px-6 print:max-w-none print:overflow-visible print:px-0 print:py-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
