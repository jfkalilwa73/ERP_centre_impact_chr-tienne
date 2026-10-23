import { useEffect, useRef } from 'react'
import type { ExpressionSpecification, Map as CarteMap, Marker } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { cn } from '@/lib/cn'

export type MarqueurCarte = {
  id: string
  nom: string
  detail?: string
  latitude: number
  longitude: number
}

const CENTRE_KINSHASA = { latitude: -4.36, longitude: 15.32, zoom: 14.2 }
const STYLE_CARTE = 'https://tiles.openfreemap.org/styles/liberty'
const HAUTEUR_BATIMENT_DEFAUT = 12

const HAUTEUR_BATIMENTS: ExpressionSpecification = [
  'case',
  ['>', ['to-number', ['get', 'render_height'], 0], 0],
  ['to-number', ['get', 'render_height'], 0],
  HAUTEUR_BATIMENT_DEFAUT,
]

export function carteIndisponible() {
  return typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
}

function echapper(valeur: string) {
  return valeur.replace(/[&<>"']/g, (caractere) => {
    const entites: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entites[caractere] ?? caractere
  })
}

type MapLibreNs = typeof import('maplibre-gl')

function bibliotheque(module: MapLibreNs): MapLibreNs {
  if (typeof module.Map === 'function') return module
  const defaut = (module as MapLibreNs & { default?: MapLibreNs }).default
  return defaut && typeof defaut.Map === 'function' ? defaut : module
}

function pastille(selection: boolean) {
  const element = document.createElement('span')
  const taille = selection ? 18 : 16
  element.style.display = 'block'
  element.style.width = `${taille}px`
  element.style.height = `${taille}px`
  element.style.borderRadius = '9999px'
  element.style.background = '#3c0173'
  element.style.border = selection ? '3px solid #ecb708' : '2px solid #fff'
  element.style.boxShadow = '0 1px 4px rgba(15,23,42,.45)'
  return element
}

function activerRelief(carte: CarteMap) {
  try {
    if (!carte.getSource('relief')) {
      carte.addSource('relief', {
        type: 'raster-dem',
        tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'],
        tileSize: 512,
        encoding: 'terrarium',
        attribution:
          '<a href="https://mapterhorn.com/attribution" target="_blank" rel="noopener noreferrer">© Mapterhorn</a>',
      })
    }
    carte.setTerrain({ source: 'relief', exaggeration: 1.35 })
    if (carte.getLayer('building-3d')) {
      carte.setLayerZoomRange('building-3d', 13, 24)
      carte.setPaintProperty('building-3d', 'fill-extrusion-height', HAUTEUR_BATIMENTS)
    }
  } catch {
    // La vue inclinée reste utilisable si le relief ou les hauteurs sont refusés.
  }
}

function voler(carte: CarteMap, cible: { latitude: number; longitude: number; zoom?: number }) {
  carte.flyTo({
    center: [cible.longitude, cible.latitude],
    zoom: cible.zoom ?? 16,
    pitch: 62,
    bearing: -18,
    duration: 900,
    essential: true,
  })
}

export function CarteOsm({
  marqueurs,
  selection = null,
  onChoisir,
  vol,
  hauteur = 'h-80',
  className,
}: {
  marqueurs: MarqueurCarte[]
  selection?: { latitude: number; longitude: number } | null
  onChoisir?: (latitude: number, longitude: number) => void
  vol?: { latitude: number; longitude: number; zoom?: number; cle: number } | null
  hauteur?: string
  className?: string
}) {
  const noeud = useRef<HTMLDivElement>(null)
  const carteRef = useRef<CarteMap | null>(null)
  const libRef = useRef<MapLibreNs | null>(null)
  const pastillesRef = useRef<Marker[]>([])
  const choixRef = useRef(onChoisir)
  const volRef = useRef(vol)
  volRef.current = vol
  const dessinerRef = useRef<() => void>(() => {})
  const vueReglee = useRef(false)
  choixRef.current = onChoisir
  const cle = JSON.stringify({ marqueurs, selection })

  dessinerRef.current = () => {
    const lib = libRef.current
    const carte = carteRef.current
    if (!lib || !carte) return
    for (const pastilleExistante of pastillesRef.current) pastilleExistante.remove()
    pastillesRef.current = []
    const positions = [
      ...marqueurs.map((item) => ({ ...item, popup: true as const, choisi: false })),
      ...(selection
        ? [{ id: 'selection', nom: 'Position choisie', detail: undefined, ...selection, popup: false as const, choisi: true }]
        : []),
    ]
    for (const item of positions) {
      const marqueur = new lib.Marker({ element: pastille(item.choisi), anchor: 'center' }).setLngLat([
        item.longitude,
        item.latitude,
      ])
      if (item.popup) {
        const lignes = [echapper(item.nom), item.detail ? echapper(item.detail) : ''].filter(Boolean)
        marqueur.setPopup(new lib.Popup({ offset: 16, closeButton: false }).setHTML(lignes.join('<br>')))
      }
      marqueur.addTo(carte)
      pastillesRef.current.push(marqueur)
    }
    if (vueReglee.current) return
    vueReglee.current = true
    if (volRef.current) return
    if (positions.length === 0) {
      carte.jumpTo({
        center: [CENTRE_KINSHASA.longitude, CENTRE_KINSHASA.latitude],
        zoom: CENTRE_KINSHASA.zoom,
        pitch: 58,
        bearing: -18,
      })
    } else if (positions.length === 1) {
      const point = positions[0]!
      carte.jumpTo({
        center: [point.longitude, point.latitude],
        zoom: 15.6,
        pitch: 60,
        bearing: -18,
      })
    } else {
      const limites = new lib.LngLatBounds()
      for (const point of positions) limites.extend([point.longitude, point.latitude])
      carte.fitBounds(limites, { padding: 48, pitch: 52, bearing: -18, maxZoom: 15.5, duration: 0 })
    }
  }

  useEffect(() => {
    if (carteIndisponible() || !noeud.current) return
    const element = noeud.current
    let abandon = false

    void import('maplibre-gl').then((module) => {
      if (abandon || carteRef.current) return
      const lib = bibliotheque(module)
      libRef.current = lib
      lib.setWorkerUrl(maplibreWorkerUrl)
      const carte = new lib.Map({
        container: element,
        style: STYLE_CARTE,
        center: [CENTRE_KINSHASA.longitude, CENTRE_KINSHASA.latitude],
        zoom: CENTRE_KINSHASA.zoom,
        pitch: 58,
        bearing: -18,
        maxPitch: 72,
        attributionControl: { compact: true },
      })
      carteRef.current = carte
      carte.on('error', () => {})
      carte.addControl(new lib.NavigationControl({ visualizePitch: true, showCompass: true }), 'top-left')
      carte.on('load', () => {
        if (abandon) return
        activerRelief(carte)
        dessinerRef.current()
        const cible = volRef.current
        if (cible) voler(carte, cible)
        carte.resize()
      })
      carte.on('click', (event) => {
        choixRef.current?.(
          Math.round(event.lngLat.lat * 1e6) / 1e6,
          Math.round(event.lngLat.lng * 1e6) / 1e6,
        )
      })
      window.setTimeout(() => carte.resize(), 200)
    })

    return () => {
      abandon = true
      for (const pastilleExistante of pastillesRef.current) pastilleExistante.remove()
      pastillesRef.current = []
      carteRef.current?.remove()
      carteRef.current = null
      libRef.current = null
      vueReglee.current = false
    }
  }, [])

  useEffect(() => {
    if (carteRef.current?.isStyleLoaded()) dessinerRef.current()
  }, [cle])

  useEffect(() => {
    if (!vol || !carteRef.current) return
    voler(carteRef.current, vol)
  }, [vol])

  if (carteIndisponible()) {
    return <div className={cn('rounded-xl bg-slate-50', hauteur, className)} />
  }

  return (
    <div
      ref={noeud}
      className={cn('carte-osm overflow-hidden rounded-xl', onChoisir && 'carte-osm-choix', hauteur, className)}
      role="application"
      aria-label={onChoisir ? 'Carte 3D pour placer la famille' : "Carte 3D des familles d'impact"}
    />
  )
}
