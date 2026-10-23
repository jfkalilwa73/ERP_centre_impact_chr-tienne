import { describe, expect, it } from 'vitest'
import { currentUserFromSession } from './sessionUser'

describe('session réelle', () => {
  it('fabrique un utilisateur complet même sans fiche personne', () => {
    const user = currentUserFromSession({
      id: 4,
      name: 'Administrateur fonctionnel',
      email: 'elieilunga007@gmail.com',
      statut: 'actif',
      permissions: ['membres.read'],
      compte: {
        idCompte: '4',
        email: 'elieilunga007@gmail.com',
        statut: 'actif',
        mfaActive: false,
        dateCreation: '2026-10-18T10:00:00Z',
      },
      roles: [
        {
          idRole: '11111111-1111-4111-8111-111111111111',
          code: 'ADMIN_FONCTIONNEL',
          nom: 'Administrateur fonctionnel',
          actif: true,
          dateCreation: '2026-10-18T10:00:00Z',
        },
      ],
    })

    expect(user.personne.prenom).toBe('Administrateur')
    expect(user.personne.nom).toBe('fonctionnel')
    expect(user.compte.email).toBe('elieilunga007@gmail.com')
    expect(user.roles.map((role) => role.nom)).toContain('Administrateur fonctionnel')
    expect(user.permissions).toContain('membres.read')
  })
})
