/**
 * Photos de profil importées localement.
 * Le contrat Phase 0 n'expose qu'une URI photoUrl (max 500), trop courte pour un fichier.
 */

import { useSyncExternalStore } from 'react'

const photos: Record<string, string> = {}
const listeners = new Set<() => void>()
let version = 0

function emit() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function subscribePersonnePhotos(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getPersonnePhotosVersion() {
  return version
}

export function getPersonnePhoto(personneId: string, photoUrl?: string) {
  return photos[personneId] || photoUrl
}

export function setPersonnePhoto(personneId: string, dataUrl: string) {
  photos[personneId] = dataUrl
  emit()
}

export function clearPersonnePhoto(personneId: string) {
  delete photos[personneId]
  emit()
}

export function resetPersonnePhotos() {
  for (const id of Object.keys(photos)) delete photos[id]
  emit()
}

export function usePersonnePhoto(personneId: string, photoUrl?: string) {
  useSyncExternalStore(subscribePersonnePhotos, getPersonnePhotosVersion, getPersonnePhotosVersion)
  return getPersonnePhoto(personneId, photoUrl)
}

export function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choisissez un fichier image (JPG, PNG ou WebP).'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("L'image ne peut pas dépasser 5 Mo."))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Impossible de lire l'image."))
    reader.readAsDataURL(file)
  })
}
