export function getPersonnePhoto(personneId: string, photoUrl?: string) {
  void personneId
  return photoUrl
}

export function usePersonnePhoto(personneId: string, photoUrl?: string) {
  return getPersonnePhoto(personneId, photoUrl)
}

export function validateProfilePhoto(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choisissez un fichier image JPG, PNG ou WebP.')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("L'image ne peut pas dépasser 5 Mo.")
  }
}

export function resetPersonnePhotos() {}
