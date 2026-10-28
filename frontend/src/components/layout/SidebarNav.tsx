import { useId, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, FileText, Heart, Layers, List } from 'lucide-react'
import { cn } from '@/lib/cn'
import { canSeePilotageDge } from '@/features/auth/orgRoles'
import { PERMISSIONS } from '@/lib/permissions'
import { useCurrentUser, useSessionProfil } from '@/stores/authStore'
import { useAccessScope } from '@/features/auth/accessScope'
import { useUnreadDemandes } from '@/features/notifications/useUnreadDemandes'
import { useDepartements, useDepartementsByIds } from '@/features/departements/hooks'
import { canAccessDepartementUnit } from '@/features/departements/roles'
import { useFamilles, useFamillesByIds } from '@/features/familles/hooks'
import { canAccessFamilleUnit } from '@/features/familles/roles'
import { usePersonneAffectations, usePersonneFamilles } from '@/features/personnes/hooks'
import { isNavGroup, navigation, type NavItem } from '@/routes/navigation'

type SidebarNavProps = {
  onNavigate?: () => void
  collapsed?: boolean
}

function linkClassName(isActive: boolean, collapsed?: boolean) {
  return cn(
    'flex items-center rounded-lg text-sm font-medium transition-[color,background-color,transform] duration-200 ease-out',
    collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
    isActive ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/8 hover:text-white',
  )
}

function NavItemLink({
  item,
  onNavigate,
  nested,
  collapsed,
}: {
  item: NavItem
  onNavigate?: () => void
  nested?: boolean
  collapsed?: boolean
}) {
  const Icon = item.icon
  const unread = useUnreadDemandes()
  const showBadge = item.to === '/notifications' && unread > 0
  return (
    <NavLink
      to={item.to}
      end={item.end ?? item.to === '/'}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={({ isActive }) => cn(linkClassName(isActive, collapsed), nested && !collapsed && 'pl-10')}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className={cn(collapsed ? 'sr-only' : 'flex-1')}>{item.label}</span>
      {showBadge && (
        <span className="rounded-full bg-gerbe-or px-1.5 py-0.5 text-[10px] font-semibold text-brand-950">
          {unread}
        </span>
      )}
      {item.soon && !collapsed && (
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white/55 uppercase">
          Bientôt
        </span>
      )}
    </NavLink>
  )
}

function isChildActive(pathname: string, item: NavItem) {
  if (item.end) return pathname === item.to
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function groupIdFromPath(pathname: string): string | null {
  if (pathname === '/departements' || pathname.startsWith('/departements/')) return 'departements'
  if (pathname === '/familles' || pathname.startsWith('/familles/')) return 'familles'
  if (
    pathname.startsWith('/comptes') ||
    pathname.startsWith('/roles') ||
    pathname.startsWith('/permissions') ||
    pathname.startsWith('/audit')
  ) {
    return 'administration'
  }
  return null
}

function CollapsibleNavGroup({
  id,
  label,
  icon: Icon,
  open,
  onToggle,
  children,
  onNavigate,
}: {
  id: string
  label: string
  icon: NavItem['icon']
  open: boolean
  onToggle: (id: string) => void
  children: NavItem[]
  onNavigate?: () => void
}) {
  const location = useLocation()
  const panelId = useId()
  const childActive = children.some((item) => isChildActive(location.pathname, item))

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(id)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
          childActive ? 'text-white' : 'text-white/70 hover:bg-white/8 hover:text-white',
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        className="nav-accordion"
        data-open={open}
        aria-hidden={!open}
        inert={!open || undefined}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-0.5">
            {children.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={onNavigate} nested />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DepartementsNav({
  catalogItems,
  onNavigate,
  collapsed,
  open,
  onToggle,
}: {
  catalogItems: NavItem[]
  onNavigate?: () => void
  collapsed?: boolean
  open: boolean
  onToggle: (id: string) => void
}) {
  const user = useCurrentUser()
  const userPermissions = useCurrentUser()?.permissions ?? []
  const sessionPermissions =
    (useSessionProfil() as { permissions?: string[] } | null)?.permissions ?? []
  const permissions = userPermissions.length > 0 ? userPermissions : sessionPermissions  
  const canManageAll =
    permissions.includes(PERMISSIONS.DEPARTEMENTS_UPDATE) ||
    permissions.includes(PERMISSIONS.DEPARTEMENTS_CREATE)
  const canSeeCatalog = permissions.includes(PERMISSIONS.DEPARTEMENTS_READ)
  const affectationsQuery = usePersonneAffectations(user?.personne.idPersonne)
  const ledIds = useMemo(
    () =>
      new Set(
        (affectationsQuery.data ?? [])
          .filter((affectation) => affectation.actif && canAccessDepartementUnit(affectation.fonction))
          .map((affectation) => affectation.idDepartement),
      ),
    [affectationsQuery.data],
  )
  const departementsQuery = useDepartements({ page: 1, limit: 100 }, canSeeCatalog)
  const ledDepartementQueries = useDepartementsByIds(canSeeCatalog ? [] : [...ledIds])
  const catalog = canSeeCatalog
    ? (departementsQuery.data?.data ?? [])
    : ledDepartementQueries.flatMap((query) => (query.data ? [query.data] : []))
  const departmentLinks: NavItem[] = catalog
    .filter((departement) => departement.actif)
    .filter((departement) => canManageAll || ledIds.has(departement.idDepartement))
    .map((departement) => ({
      to: `/departements/${departement.idDepartement}`,
      label: departement.nom,
      icon: Layers,
    }))
  const loadingDepartments = canSeeCatalog
    ? departementsQuery.isLoading
    : affectationsQuery.isLoading || ledDepartementQueries.some((query) => query.isLoading)
  const canOpenPage =
    catalogItems.length > 0 ||
    canSeePilotageDge(user) ||
    ledIds.size > 0 ||
    loadingDepartments
  if (!canOpenPage) return null

  const parentItem: NavItem = { to: '/departements', label: 'Départements', icon: Layers }
  const panelId = 'departements-nav-list'

  if (collapsed) {
    return (
      <>
        <NavItemLink item={parentItem} onNavigate={onNavigate} collapsed />
        {departmentLinks.map((item) => (
          <NavItemLink key={item.to} item={item} onNavigate={onNavigate} collapsed />
        ))}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-0.5">
        <NavLink
          to={parentItem.to}
          onClick={onNavigate}
          className={({ isActive }) => cn(linkClassName(isActive), 'min-w-0 flex-1')}
        >
          <Layers className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">Départements</span>
        </NavLink>
        {(departmentLinks.length > 0 || loadingDepartments) && (
          <button
            type="button"
            aria-label={open ? 'Masquer les départements créés' : 'Afficher les départements créés'}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => onToggle('departements')}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/8 hover:text-white"
          >
            <ChevronDown
              className={cn(
                'size-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                open && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
      <div
        id={panelId}
        className="nav-accordion"
        data-open={open}
        aria-hidden={!open}
        inert={!open || undefined}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-0.5">
            {departmentLinks.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={onNavigate} nested />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FamillesNav({
  catalogItems,
  onNavigate,
  collapsed,
  open,
  onToggle,
}: {
  catalogItems: NavItem[]
  onNavigate?: () => void
  collapsed?: boolean
  open: boolean
  onToggle: (id: string) => void
}) {
  const user = useCurrentUser()
  const userPermissions = useCurrentUser()?.permissions ?? []
  const sessionPermissions =
    (useSessionProfil() as { permissions?: string[] } | null)?.permissions ?? []
  const permissions = userPermissions.length > 0 ? userPermissions : sessionPermissions  
  const canManageAll =permissions.includes(PERMISSIONS.FAMILLES_UPDATE) ||permissions.includes(PERMISSIONS.FAMILLES_CREATE)
  const canSeeCatalog = permissions.includes(PERMISSIONS.FAMILLES_READ)
  const affectationsQuery = usePersonneFamilles(user?.personne.idPersonne)
  const ledIds = useMemo(
    () =>
      new Set(
        (affectationsQuery.data ?? [])
          .filter((affectation) => affectation.actif && canAccessFamilleUnit(affectation.fonction))
          .map((affectation) => affectation.idFamille),
      ),
    [affectationsQuery.data],
  )
  const famillesQuery = useFamilles({ page: 1, limit: 100 }, canSeeCatalog)
  const ledFamilleQueries = useFamillesByIds(canSeeCatalog ? [] : [...ledIds])
  const catalog = canSeeCatalog
    ? (famillesQuery.data?.data ?? [])
    : ledFamilleQueries.flatMap((query) => (query.data ? [query.data] : []))
  const catalogLinks: NavItem[] = canSeePilotageDge(user)
    ? [
        {
          to: '/familles',
          label: "Toutes les familles d'impact",
          icon: List,
          permission: PERMISSIONS.FAMILLES_READ,
          end: true,
        },
        {
          to: '/familles/suivi',
          label: 'Suivi DGE',
          icon: List,
          permission: PERMISSIONS.FAMILLES_READ,
        },
        {
          to: '/familles/rapports',
          label: 'Rapports reçus',
          icon: FileText,
          permission: PERMISSIONS.FAMILLES_READ,
        },
      ]
    : catalogItems
  const familleLinks: NavItem[] = catalog
    .filter((famille) => famille.actif)
    .filter((famille) => canManageAll || ledIds.has(famille.idFamille))
    .map((famille) => ({
      to: `/familles/${famille.idFamille}`,
      label: famille.nom,
      icon: Heart,
    }))
  const children = [...catalogLinks, ...familleLinks]
  const loadingLeadership =
    !canSeeCatalog &&
    (affectationsQuery.isLoading || ledFamilleQueries.some((query) => query.isLoading))
  if (children.length === 0 && !loadingLeadership) return null

  if (collapsed) {
    return children.map((item) => (
      <NavItemLink key={item.to} item={item} onNavigate={onNavigate} collapsed />
    ))
  }

  return (
    <CollapsibleNavGroup
      id="familles"
      label="Familles d'impact"
      icon={Heart}
      open={open}
      onToggle={onToggle}
      onNavigate={onNavigate}
    >
      {children}
    </CollapsibleNavGroup>
  )
}

export function SidebarNav({ onNavigate, collapsed = false }: SidebarNavProps) {
  const location = useLocation()
  const userPermissions = useCurrentUser()?.permissions ?? []
  const sessionPermissions =
    (useSessionProfil() as { permissions?: string[] } | null)?.permissions ?? []
  const permissions = userPermissions.length > 0 ? userPermissions : sessionPermissions  
  const { isScoped } = useAccessScope()
  const routeGroupId = groupIdFromPath(location.pathname)
  const [manualOpen, setManualOpen] = useState<{ path: string; id: string | null } | null>(null)
  const openGroupId =
    manualOpen && manualOpen.path === location.pathname ? manualOpen.id : routeGroupId

  const toggleGroup = (id: string) => {
    setManualOpen({
      path: location.pathname,
      id: openGroupId === id ? null : id,
    })
  }

  const canSee = (item: NavItem) => {
    if (isScoped && (item.to === '/' || item.to === '/personnes')) return false
    return !item.permission || permissions.includes(item.permission)
  }

  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-1">
      {navigation.map((entry) => {
        if (isNavGroup(entry) && entry.id === 'departements') {
          return (
            <DepartementsNav
              key={entry.id}
              catalogItems={entry.children.filter(canSee)}
              onNavigate={onNavigate}
              collapsed={collapsed}
              open={openGroupId === entry.id}
              onToggle={toggleGroup}
            />
          )
        }

        if (isNavGroup(entry) && entry.id === 'familles') {
          return (
            <FamillesNav
              key={entry.id}
              catalogItems={entry.children.filter(canSee)}
              onNavigate={onNavigate}
              collapsed={collapsed}
              open={openGroupId === entry.id}
              onToggle={toggleGroup}
            />
          )
        }

        if (isNavGroup(entry)) {
          const children = entry.children.filter(canSee)
          if (children.length === 0) return null
          if (collapsed) {
            return children.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={onNavigate} collapsed />
            ))
          }
          return (
            <CollapsibleNavGroup
              key={entry.id}
              id={entry.id}
              label={entry.label}
              icon={entry.icon}
              open={openGroupId === entry.id}
              onToggle={toggleGroup}
              onNavigate={onNavigate}
            >
              {children}
            </CollapsibleNavGroup>
          )
        }

        if (!canSee(entry)) return null
        return <NavItemLink key={entry.to} item={entry} onNavigate={onNavigate} collapsed={collapsed} />
      })}
    </nav>
  )
}
