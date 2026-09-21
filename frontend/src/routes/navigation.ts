import {
  KeyRound,
  LayoutDashboard,
  Layers,
  List,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PERMISSIONS, type PermissionCode } from '@/lib/permissions'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  permission?: PermissionCode
  /** Match exact du chemin, pour ne pas activer le parent d'une fiche. */
  end?: boolean
  /** Module prévu au contrat, écran pas encore livré. */
  soon?: boolean
}

export type NavGroup = {
  id: string
  label: string
  icon: LucideIcon
  children: NavItem[]
}

export type NavEntry = NavItem | NavGroup

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry
}

export const navigation: NavEntry[] = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard },
  { to: '/personnes', label: 'Personnes', icon: Users, permission: PERMISSIONS.MEMBRES_READ },
  {
    id: 'departements',
    label: 'Départements',
    icon: Layers,
    children: [
      {
        to: '/departements',
        label: 'Tous les départements',
        icon: List,
        permission: PERMISSIONS.DEPARTEMENTS_READ,
        end: true,
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Settings,
    children: [
      { to: '/comptes', label: 'Comptes', icon: KeyRound, permission: PERMISSIONS.COMPTES_READ },
      { to: '/roles', label: 'Rôles', icon: Shield, permission: PERMISSIONS.ROLES_MANAGE },
      {
        to: '/permissions',
        label: 'Permissions',
        icon: ShieldCheck,
        permission: PERMISSIONS.ROLES_MANAGE,
      },
      { to: '/audit', label: 'Audit', icon: ScrollText, permission: PERMISSIONS.AUDIT_READ },
    ],
  },
]
