import type { AffectationDepartement, Personne } from '@/types'
import { initials } from './duplicates'
import { FORMATIONS, STATUT_CIVIL_LABELS, type FicheComplement } from './fiche'

export type FichePdfModel = {
  personne: Personne
  photoSrc?: string
  logoSrc?: string
  email?: string
  sexeLabel: string
  famille?: string
  complement: FicheComplement
  personnes: Personne[]
  affectationsActives: AffectationDepartement[]
  nomDepartement: (id: string) => string
  formatDateLong: (value: string) => string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function field(label: string, value: string) {
  return `<div class="field">
    <p class="label">${escapeHtml(label)}</p>
    <p class="value">${escapeHtml(value)}</p>
  </div>`
}

const PRINT_CSS = `
  @page { margin: 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #0f172a;
    background: #fff;
    font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  header {
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .brand {
    height: 40px;
    width: auto;
    margin-bottom: 16px;
    display: block;
  }
  .identity {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .photo, .initials {
    width: 80px;
    height: 80px;
    border-radius: 9999px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .initials {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f172a;
    color: #fff;
    font-size: 22px;
    font-weight: 600;
  }
  h1 { margin: 0; font-size: 26px; }
  h2 { margin: 0 0 12px; font-size: 14px; }
  section { margin-bottom: 22px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
  .field .label { margin: 0; font-size: 12px; color: #64748b; }
  .field .value { margin: 4px 0 0; font-size: 14px; }
  ul { margin: 0; padding-left: 18px; }
  li { margin: 0 0 6px; font-size: 14px; }
  .empty { margin: 0; font-size: 14px; color: #64748b; }
`

export function churchLogoSrc() {
  if (typeof window === 'undefined') return '/logo-icc.png'
  return new URL('/logo-icc.png', window.location.origin).href
}

export function buildFichePdfHtml(model: FichePdfModel) {
  const { personne, photoSrc, email, sexeLabel, famille, complement, personnes, affectationsActives } = model
  const fullName = `${personne.prenom} ${personne.nom}`
  const logoSrc = model.logoSrc ?? churchLogoSrc()
  const photo = photoSrc
    ? `<img class="photo" src="${escapeHtml(photoSrc)}" alt="${escapeHtml(fullName)}" />`
    : `<span class="initials">${escapeHtml(initials(personne))}</span>`

  const liens = complement.liens.length
    ? `<ul>${complement.liens
        .map((lien) => {
          const proche = personnes.find((item) => item.idPersonne === lien.idPersonne)
          const nom = proche ? `${proche.prenom} ${proche.nom}` : 'Personne liée'
          return `<li>${escapeHtml(`${nom} — ${lien.lien}`)}</li>`
        })
        .join('')}</ul>`
    : `<p class="empty">Aucun lien familial renseigné.</p>`

  const ministeres = affectationsActives.length
    ? `<ul>${affectationsActives
        .map((affectation) => {
          const label = `${model.nomDepartement(affectation.idDepartement)}${
            affectation.fonction ? ` — ${affectation.fonction}` : ''
          }`
          return `<li>${escapeHtml(label)}</li>`
        })
        .join('')}</ul>`
    : `<p class="empty">Aucune affectation départementale.</p>`

  const formations = FORMATIONS.map((formation) =>
    field(formation.label, complement.formations[formation.id] ? 'Obtenue' : '—'),
  ).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(fullName)}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <header>
    <img class="brand" src="${escapeHtml(logoSrc)}" alt="Impact Centre Chrétien" />
    <div class="identity">
      ${photo}
      <div>
        <h1>${escapeHtml(fullName)}</h1>
      </div>
    </div>
  </header>
  <section>
    <h2>Coordonnées</h2>
    <div class="grid">
      ${field('Téléphone', personne.telephone ?? '—')}
      ${field('Email', email ?? '—')}
      ${field('Adresse Principale', personne.adresse ?? '—')}
    </div>
  </section>
  <section>
    <h2>Détails Civils &amp; Ecclésiastiques</h2>
    <div class="grid">
      ${field('Statut Civil', complement.statutCivil ? STATUT_CIVIL_LABELS[complement.statutCivil] : '—')}
      ${field('Date de Naissance', personne.dateNaissance ? model.formatDateLong(personne.dateNaissance) : '—')}
      ${field("Date d'Intégration", model.formatDateLong(personne.dateCreation))}
      ${field('Compétences / Professions', complement.competences || '—')}
      ${field('Sexe', sexeLabel)}
      ${field("Famille d'impact", famille ?? '—')}
      ${field('Certificat de baptême', complement.certificatBaptemeNom || '—')}
      ${formations}
    </div>
  </section>
  <section>
    <h2>Liens Familiaux</h2>
    ${liens}
  </section>
  <section>
    <h2>Responsabilités &amp; Ministères</h2>
    ${ministeres}
  </section>
</body>
</html>`
}

export function exportFichePdf(model: FichePdfModel) {
  const html = buildFichePdfHtml(model)
  const popup = window.open('', 'fiche-pdf')
  if (!popup) {
    window.print()
    return
  }

  popup.document.open()
  popup.document.write(html)
  popup.document.close()

  const printWhenReady = () => {
    popup.focus()
    popup.print()
  }

  popup.addEventListener('afterprint', () => popup.close(), { once: true })

  const images = Array.from(popup.document.images)
  if (images.length === 0 || images.every((image) => image.complete)) {
    popup.setTimeout(printWhenReady, 50)
    return
  }

  void Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  ).then(() => popup.setTimeout(printWhenReady, 50))
}
