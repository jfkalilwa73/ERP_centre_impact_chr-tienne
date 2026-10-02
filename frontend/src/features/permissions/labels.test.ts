import { describe, expect, it } from 'vitest'
import {
  actionLabel,
  moduleLabel,
  permissionLabel,
  permissionLabelFromCode,
  permissionSearchHaystack,
} from './labels'

describe('libellés des permissions', () => {
  it('traduit les codes techniques en français', () => {
    expect(moduleLabel('membres')).toBe('Personnes')
    expect(moduleLabel('comptes')).toBe('Comptes')
    expect(actionLabel('read')).toBe('Consulter')
    expect(actionLabel('create')).toBe('Créer')
    expect(permissionLabelFromCode('membres.read')).toBe('Consulter — Personnes')
  })

  it('préfère l’intitulé humain quand il existe', () => {
    expect(
      permissionLabel({
        code: 'membres.read',
        module: 'membres',
        action: 'read',
        description: 'Consulter les personnes',
      }),
    ).toBe('Consulter les personnes')
  })

  it('permet de rechercher en français ou par code', () => {
    const haystack = permissionSearchHaystack({
      code: 'membres.read',
      module: 'membres',
      action: 'read',
      description: 'Consulter les personnes',
    })
    expect(haystack).toContain('membres.read')
    expect(haystack).toContain('personnes')
    expect(haystack).toContain('consulter')
  })
})
