import { describe, expect, it } from 'vitest'
import {
  canAccessDepartementUnit,
  isLeadershipRole,
  isSupervisionRole,
  roleDepartement,
} from './roles'

describe('rôles d’un département', () => {
  it('place le superviseur au-dessus du chef', () => {
    expect(roleDepartement('Superviseur')).toBe('Superviseur')
    expect(roleDepartement('superviseur de site')).toBe('Superviseur')
    expect(isSupervisionRole('Superviseur')).toBe(true)
    expect(isLeadershipRole('Superviseur')).toBe(false)
    expect(canAccessDepartementUnit('Superviseur')).toBe(true)
  })

  it('garde le chef et l’adjoint comme pilotes d’équipe', () => {
    expect(roleDepartement('Chef')).toBe('Chef')
    expect(roleDepartement('Responsable accueil')).toBe('Responsable')
    expect(isLeadershipRole('Responsable accueil')).toBe(false)
    expect(isLeadershipRole('Chef')).toBe(true)
    expect(isLeadershipRole('Adjoint')).toBe(true)
    expect(canAccessDepartementUnit('Adjoint')).toBe(true)
    expect(canAccessDepartementUnit('Membre')).toBe(false)
  })
})
