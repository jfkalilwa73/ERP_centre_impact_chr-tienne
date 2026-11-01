import { useId, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Heart, Layers } from 'lucide-react'
import { cn } from '@/lib/cn'
import { canSeeAllUnits, canSeePilotageDge } from '@/features/auth/orgRoles'
import { applicationPageFromPath, useApplicationPageAccess } from '@/features/auth/applicationPageAccess'
import { PERMISSIONS } from '@/lib/permissions'
import type { ApplicationPageId } from '@/features/auth/unitPageAccess'
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
  onNavigate,
  collapsed,
  open,
  onToggle,
  canAccessList,
  canAccessSuivi,
  canAccessReports,
}: {
  onNavigate?: () => void
  collapsed?: boolean
  open: boolean
  onToggle: (id: string) => void
  canAccessList: boolean
  canAccessSuivi: boolean
  canAccessReports: boolean
}) {
  const user = useCurrentUser()
  const userPermissions = useCurrentUser()?.permissions ?? []
  const sessionPermissions =
    (useSessionProfil() as { permissions?: string[] } | null)?.permissions ?? []
  const permissions = userPermissions.length > 0 ? userPermissions : sessionPermissions  
  const canManageAll =
    permissions.includes(PERMISSIONS.DEPARTEMENTS_UPDATE) ||
    permissions.includes(PERMISSIONS.DEPARTEMENTS_CREATE)
  const canSeeCatalog =
    permissions.includes(PERMISSIONS.DEPARTEMENTS_READ) && canAccessList
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
  const canOpenDgePage =
    canSeePilotageDge(user) && (canAccessSuivi || canAccessReports)
  const canOpenPage =
    canAccessList || canOpenDgePage || departmentLinks.length > 0 || loadingDepartments
  if (!canOpenPage) return null
  const showParent = canAccessList || canOpenDgePage

  const parentTarget = canAccessList
    ? '/departements'
    : canSeePilotageDge(user) && canAccessSuivi
      ? '/departements/suivi'
      : canSeePilotageDge(user) && canAccessReports
        ? '/departements/rapports'
        : departmentLinks[0]?.to ?? '/departements'
  const parentItem: NavItem = { to: parentTarget, label: 'Départements', icon: Layers }
  const panelId = 'departements-nav-list'

  if (!showParent) {
    return (
      <>
        {departmentLinks.map((item) => (
          <NavItemLink key={item.to} item={item} onNavigate={onNavigate} collapsed={collapsed} />
        ))}
      </>
    )
  }

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
  onNavigate,
  collapsed,
  open,
  onToggle,
  canAccessList,
  canAccessSuivi,
  canAccessReports,
}: {
  onNavigate?: () => void
  collapsed?: boolean
  open: boolean
  onToggle: (id: string) => void
  canAccessList: boolean
  canAccessSuivi: boolean
  canAccessReports: boolean
}) {
  const user = useCurrentUser()
  const userPermissions = useCurrentUser()?.permissions ?? []
  const sessionPermissions =
    (useSessionProfil() as { permissions?: string[] } | null)?.permissions ?? []
  const permissions = userPermissions.length > 0 ? userPermissions : sessionPermissions  
  const canManageAll =
    permissions.includes(PERMISSIONS.FAMILLES_UPDATE) ||
    permissions.includes(PERMISSIONS.FAMILLES_CREATE)
  const canSeeCatalog =
    permissions.includes(PERMISSIONS.FAMILLES_READ) &&
    (canSeeAllUnits(user) || canManageAll)
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
  const familleLinks: NavItem[] = catalog
    .filter((famille) => famille.actif)
    .filter((famille) => canManageAll || ledIds.has(famille.idFamille))
    .map((famille) => ({
      to: `/familles/${famille.idFamille}`,
      label: famille.nom,
      icon: Heart,
    }))
  const loadingFamilies = canSeeCatalog
    ? famillesQuery.isLoading
    : affectationsQuery.isLoading || ledFamilleQueries.some((query) => query.isLoading)
  const canAccessFamilyList =
    canAccessList && (canSeeAllUnits(user) || canManageAll || ledIds.size > 0)
  const canOpenDgePage =
    canSeePilotageDge(user) && (canAccessSuivi || canAccessReports)
  const canOpenPage =
    canAccessFamilyList || canOpenDgePage || familleLinks.length > 0
  if (!canOpenPage) return null

  const parentTarget = canAccessFamilyList
    ? '/familles'
    : canSeePilotageDge(user) && canAccessSuivi
      ? '/familles/suivi'
      : canSeePilotageDge(user) && canAccessReports
        ? '/familles/rapports'
        : familleLinks[0]?.to ?? '/familles'
  const parentItem: NavItem = {
    to: parentTarget,
    label: "Familles d'impact",
    icon: Heart,
  }
  const panelId = 'familles-nav-list'

  if (collapsed) {
    return (
      <>
        <NavItemLink item={parentItem} onNavigate={onNavigate} collapsed />
        {familleLinks.map((item) => (
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
          <Heart className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">Familles d'impact</span>
        </NavLink>
        {(familleLinks.length > 0 || loadingFamilies) && (
          <button
            type="button"
            aria-label={open ? 'Masquer les familles créées' : 'Afficher les familles créées'}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => onToggle('familles')}
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
            {familleLinks.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={onNavigate} nested />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SidebarNav({ onNavigate, collapsed = false }: SidebarNavProps) {
  const location = useLocation()
  const userPermissions = useCurrentUser()?.permissions ?? []
  const sessionPermissions =
    (useSessionProfil() as { permissions?: string[] } | null)?.permissions ?? []
  const permissions = userPermissions.length > 0 ? userPermissions : sessionPermissions  
  const { isScoped } = useAccessScope()
  const applicationPageAccess = useApplicationPageAccess()
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
    if (item.permission && !permissions.includes(item.permission)) return false
    const page = applicationPageFromPath(item.to)
    return page === null || applicationPageAccess.canView(page as ApplicationPageId)
  }

  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-1">
      {navigation.map((entry) => {
        if (isNavGroup(entry) && entry.id === 'departements') {
          const canAccessDepartmentRoutes =
            permissions.includes(PERMISSIONS.DEPARTEMENTS_READ) ||
            permissions.includes(PERMISSIONS.ROLES_MANAGE)
          return (
            <DepartementsNav
              key={entry.id}
              onNavigate={onNavigate}
              collapsed={collapsed}
              open={openGroupId === entry.id}
              onToggle={toggleGroup}
              canAccessList={canAccessDepartmentRoutes && applicationPageAccess.canView('departements')}
              canAccessSuivi={canAccessDepartmentRoutes && applicationPageAccess.canView('departements-suivi')}
              canAccessReports={canAccessDepartmentRoutes && applicationPageAccess.canView('departements-rapports')}
            />
          )
        }

        if (isNavGroup(entry) && entry.id === 'familles') {
          return (
            <FamillesNav
              key={entry.id}
              onNavigate={onNavigate}
              collapsed={collapsed}
              open={openGroupId === entry.id}
              onToggle={toggleGroup}
              canAccessList={permissions.includes(PERMISSIONS.FAMILLES_READ) && applicationPageAccess.canView('familles')}
              canAccessSuivi={permissions.includes(PERMISSIONS.FAMILLES_READ) && applicationPageAccess.canView('familles-suivi')}
              canAccessReports={permissions.includes(PERMISSIONS.FAMILLES_READ) && applicationPageAccess.canView('familles-rapports')}
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
