import { useEffect, useId, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Layers } from 'lucide-react'
import { cn } from '@/lib/cn'
import { PERMISSIONS } from '@/lib/permissions'
import { useCurrentUser } from '@/stores/authStore'
import { useDepartements } from '@/features/departements/hooks'
import { isLeadershipRole } from '@/features/departements/roles'
import { usePersonneAffectations } from '@/features/personnes/hooks'
import { isNavGroup, navigation, type NavItem } from '@/routes/navigation'

type SidebarNavProps = {
  onNavigate?: () => void
  collapsed?: boolean
}

function linkClassName(isActive: boolean, collapsed?: boolean) {
  return cn(
    'flex items-center rounded-lg text-sm font-medium transition-colors',
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

function CollapsibleNavGroup({
  label,
  icon: Icon,
  children,
  onNavigate,
}: {
  label: string
  icon: NavItem['icon']
  children: NavItem[]
  onNavigate?: () => void
}) {
  const location = useLocation()
  const panelId = useId()
  const childActive = children.some((item) => isChildActive(location.pathname, item))
  const [open, setOpen] = useState(childActive)

  useEffect(() => {
    if (childActive) setOpen(true)
  }, [childActive])

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          childActive ? 'text-white' : 'text-white/70 hover:bg-white/8 hover:text-white',
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      <div id={panelId} hidden={!open} className="flex flex-col gap-0.5">
        {children.map((item) => (
          <NavItemLink key={item.to} item={item} onNavigate={onNavigate} nested />
        ))}
      </div>
    </div>
  )
}

function DepartementsNav({
  catalogItems,
  onNavigate,
  collapsed,
}: {
  catalogItems: NavItem[]
  onNavigate?: () => void
  collapsed?: boolean
}) {
  const user = useCurrentUser()
  const permissions = user?.permissions ?? []
  const canManageAll =
    permissions.includes(PERMISSIONS.DEPARTEMENTS_UPDATE) ||
    permissions.includes(PERMISSIONS.DEPARTEMENTS_CREATE)
  const canSeeCatalog = permissions.includes(PERMISSIONS.DEPARTEMENTS_READ)
  const affectationsQuery = usePersonneAffectations(user?.personne.idPersonne)
  const ledIds = useMemo(
    () =>
      new Set(
        (affectationsQuery.data ?? [])
          .filter((affectation) => affectation.actif && isLeadershipRole(affectation.fonction))
          .map((affectation) => affectation.idDepartement),
      ),
    [affectationsQuery.data],
  )
  const departementsQuery = useDepartements({ page: 1, limit: 100 }, canSeeCatalog || ledIds.size > 0)
  const departmentLinks: NavItem[] = (departementsQuery.data?.data ?? [])
    .filter((departement) => departement.actif)
    .filter((departement) => canManageAll || ledIds.has(departement.idDepartement))
    .map((departement) => ({
      to: `/departements/${departement.idDepartement}`,
      label: departement.nom,
      icon: Layers,
    }))
  const children = [...catalogItems, ...departmentLinks]
  if (children.length === 0) return null

  if (collapsed) {
    return children.map((item) => (
      <NavItemLink key={item.to} item={item} onNavigate={onNavigate} collapsed />
    ))
  }

  return (
    <CollapsibleNavGroup label="Départements" icon={Layers} onNavigate={onNavigate}>
      {children}
    </CollapsibleNavGroup>
  )
}

export function SidebarNav({ onNavigate, collapsed = false }: SidebarNavProps) {
  const permissions = useCurrentUser()?.permissions ?? []
  const canSee = (item: NavItem) => !item.permission || permissions.includes(item.permission)

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
              label={entry.label}
              icon={entry.icon}
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
