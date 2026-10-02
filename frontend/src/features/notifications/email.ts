export function suggestedEgliseEmail(prenom: string, nom: string) {
  const slug = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')

  const left = [slug(prenom), slug(nom)].filter(Boolean).join('.')
  return left ? `${left}@eglise.org` : ''
}
