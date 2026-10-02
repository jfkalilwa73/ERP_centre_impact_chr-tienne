import { describe, expect, it } from 'vitest'
import { listAllProjets, listAllRisques, listProjets, resetProjets } from './projets'

const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'
const DIAKONIE_ID = 'd4f6b8c0-0006-4000-8000-000000000003'

describe('projets et risques', () => {
  it('limite le portefeuille aux unités demandées', () => {
    resetProjets()
    expect(listProjets(LOUANGE_ID).some((item) => item.code === 'PROJ-LOU-01')).toBe(true)
    expect(listAllProjets([LOUANGE_ID]).every((item) => item.idDepartement === LOUANGE_ID)).toBe(true)
    expect(listAllProjets([DIAKONIE_ID])).toEqual([])
    expect(listAllRisques([LOUANGE_ID]).some((item) => item.libelle.includes('choristes'))).toBe(true)
  })
})
